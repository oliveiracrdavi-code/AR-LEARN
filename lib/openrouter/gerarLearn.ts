import { learnContratoSchema, type LearnContrato } from "./schema";
import { SYSTEM_PROMPT_CEREBRO } from "./systemPrompt";

// Modelo barato via OpenRouter (Manual das Ferramentas, seção 5).
// Configurável por env var pra trocar sem tocar em código.
const MODELO_BARATO = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
const MAX_TENTATIVAS = 3;

type Mensagem = { role: "system" | "user" | "assistant"; content: string };

class ErroTransiente extends Error {}

async function esperar(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function chamarOpenRouter(mensagens: Mensagem[]): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO_BARATO,
      messages: mensagens,
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });

  if (res.status === 429 || res.status >= 500) {
    throw new ErroTransiente(`OpenRouter ${res.status}: ${await res.text()}`);
  }
  if (!res.ok) {
    throw new Error(`OpenRouter falhou: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return json.choices[0].message.content;
}

// Gera o JSON do Learn a partir da transcrição, validando contra o
// contrato e re-tentando (com correção) se vier malformado — conforme
// o Manual de Implementação, seção de erros do OpenRouter.
export async function gerarLearnDoEpisodio(
  transcricao: string,
  metadados: { videoId: string; titulo: string }
): Promise<LearnContrato> {
  const mensagens: Mensagem[] = [
    { role: "system", content: SYSTEM_PROMPT_CEREBRO },
    {
      role: "user",
      content: `Episódio: "${metadados.titulo}" (youtube_video_id: ${metadados.videoId})\n\nTranscrição:\n${transcricao}`,
    },
  ];

  let ultimoErro = "";

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const resposta = await chamarOpenRouter(mensagens);
      const parsed = JSON.parse(resposta);
      const validado = learnContratoSchema.safeParse(parsed);

      if (validado.success) {
        return validado.data;
      }

      ultimoErro = validado.error.message;
      mensagens.push({ role: "assistant", content: resposta });
      mensagens.push({
        role: "user",
        content: `O JSON não bateu com o schema. Erros: ${ultimoErro}\nDevolva o JSON corrigido, completo, sem cercas de markdown.`,
      });
    } catch (erro) {
      if (erro instanceof SyntaxError) {
        ultimoErro = `JSON malformado: ${erro.message}`;
        mensagens.push({
          role: "user",
          content: `A resposta anterior não era um JSON válido (${ultimoErro}). Devolva só o JSON, sem texto ao redor.`,
        });
        continue;
      }
      if (erro instanceof ErroTransiente) {
        ultimoErro = erro.message;
        await esperar(2 ** tentativa * 1000);
        continue;
      }
      throw erro;
    }
  }

  throw new Error(
    `Cérebro (OpenRouter) não devolveu um JSON válido após ${MAX_TENTATIVAS} tentativas. Último erro: ${ultimoErro}`
  );
}
