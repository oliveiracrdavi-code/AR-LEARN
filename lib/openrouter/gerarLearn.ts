import { learnContratoSchema, type LearnContrato } from "./schema";
import { SYSTEM_PROMPT_CEREBRO } from "./systemPrompt";

// Modelo barato via OpenRouter (Manual das Ferramentas, seção 5).
// Configurável por env var pra trocar sem tocar em código.
// google/gemini-2.0-flash-001 foi descontinuado (404 "no endpoints
// found" no catálogo atual) — confirmado via busca no catálogo real
// do OpenRouter, não de memória. google/gemini-2.5-flash é o slug
// vigente equivalente (~US$0,30/M tokens de entrada, ~US$2,50/M de
// saída); deepseek/deepseek-chat é a alternativa também barata citada
// no manual.
const MODELO_BARATO = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
const MAX_TENTATIVAS = 3;

// Duração mínima do vídeo (Regra de Ouro do projeto — CLAUDE.md /
// docs/stack.md). Atualizado de 300s (5 min) para 420s (7 min).
const DURACAO_MINIMA_SEG = 420;

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
        const duracaoTotal = validado.data.learn.video_roteiro.cenas.reduce(
          (soma, cena) => soma + cena.duracao_seg,
          0
        );

        console.log(`  [tentativa ${tentativa}] duração do roteiro: ${duracaoTotal}s (piso: ${DURACAO_MINIMA_SEG}s)`);

        if (duracaoTotal >= DURACAO_MINIMA_SEG) {
          return validado.data;
        }

        ultimoErro = `duração total do roteiro (${duracaoTotal}s) abaixo do piso de ${DURACAO_MINIMA_SEG}s`;
        mensagens.push({ role: "assistant", content: resposta });
        mensagens.push({
          role: "user",
          content: `A soma de duracao_seg das cenas ficou em ${duracaoTotal}s, abaixo do mínimo de ${DURACAO_MINIMA_SEG}s (7 minutos). Devolva o JSON de novo, expandindo o video_roteiro com mais cenas/detalhe do que já está na transcrição — sem inventar fatos que não estão nela — até atingir o piso. Sem cercas de markdown.`,
        });
        continue;
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
