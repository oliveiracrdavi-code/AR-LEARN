import { learnContratoSchema, type LearnContrato } from "./schema";
import { SYSTEM_PROMPT_CEREBRO } from "./systemPrompt";
import { logComTimestamp } from "../util/log";
import { DURACAO_MINIMA_VIDEO_SEG, TAXA_CARACTERES_POR_SEGUNDO_ANTONIO } from "../constantes";

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

// Sem max_tokens explícito, a resposta pode ser truncada a meio do
// JSON quando o roteiro expandido (retentativa de duração) fica mais
// longo — foi exatamente o que aconteceu de verdade (JSON malformado
// no meio de uma retentativa de expansão). ~19.500 caracteres de JSON
// completo (roteiro ~8.200 + seções do PDF + mapa mental + estrutura)
// dá uns 6-7 mil tokens; 12.000 dá folga generosa e ainda fica bem
// abaixo do teto real do modelo (google/gemini-2.5-flash suporta até
// 65.535 tokens de saída no catálogo do OpenRouter — confirmado, não
// é o gargalo).
const MAX_TOKENS_RESPOSTA = 12_000;

// Timeout curto e explícito por chamada — sem isso, uma instabilidade
// pontual do OpenRouter (fetch nunca resolve) trava o step inteiro por
// tempo indefinido em vez de falhar rápido e de forma identificável.
// Vira ErroTransiente, então é retentado pelo loop de MAX_TENTATIVAS
// como qualquer outro 429/5xx.
const TIMEOUT_MS = 30_000;

type Mensagem = { role: "system" | "user" | "assistant"; content: string };

class ErroTransiente extends Error {}

async function esperar(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function chamarOpenRouter(mensagens: Mensagem[]): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  logComTimestamp("Chamando OpenRouter...");
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
        max_tokens: MAX_TOKENS_RESPOSTA,
      }),
      signal: controller.signal,
    });
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") {
      logComTimestamp(`OpenRouter não respondeu em ${TIMEOUT_MS / 1000}s.`);
      throw new ErroTransiente(`OpenRouter não respondeu em ${TIMEOUT_MS / 1000}s.`);
    }
    throw erro;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 429 || res.status >= 500) {
    throw new ErroTransiente(`OpenRouter ${res.status}: ${await res.text()}`);
  }
  if (!res.ok) {
    throw new Error(`OpenRouter falhou: ${res.status} ${await res.text()}`);
  }

  logComTimestamp("Resposta do OpenRouter recebida.");
  const json = (await res.json()) as {
    choices: { message: { content: string }; finish_reason?: string }[];
  };

  // finish_reason "length" = a resposta foi CORTADA por bater o teto
  // de max_tokens, não um JSON malformado "normal" — sem essa checagem
  // explícita, isso vira um erro genérico de JSON.parse (posição X),
  // escondendo a causa real (resposta truncada) atrás de um sintoma.
  if (json.choices[0].finish_reason === "length") {
    throw new Error(
      `OpenRouter cortou a resposta por atingir o limite de max_tokens (${MAX_TOKENS_RESPOSTA}) — JSON incompleto, não malformado. Aumente MAX_TOKENS_RESPOSTA.`
    );
  }

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
        // O duracao_seg que o LLM escreve não é confiável (testado: o
        // modelo "chuta" por intuição mesmo com a fórmula explícita no
        // prompt, entregando ~10-12 char/seg em vez dos ~17,8 char/seg
        // reais do Antonio). Por isso o valor usado no gate é
        // RECALCULADO aqui a partir do texto_narrado real de cada
        // cena, sobrescrevendo o que veio da LLM.
        for (const cena of validado.data.learn.video_roteiro.cenas) {
          cena.duracao_seg = cena.texto_narrado.length / TAXA_CARACTERES_POR_SEGUNDO_ANTONIO;
        }

        const duracaoTotal = validado.data.learn.video_roteiro.cenas.reduce(
          (soma, cena) => soma + cena.duracao_seg,
          0
        );

        console.log(`  [tentativa ${tentativa}] duração do roteiro (recalculada por caracteres): ${duracaoTotal.toFixed(2)}s (piso: ${DURACAO_MINIMA_VIDEO_SEG}s)`);

        if (duracaoTotal >= DURACAO_MINIMA_VIDEO_SEG) {
          return validado.data;
        }

        ultimoErro = `duração total do roteiro (${duracaoTotal.toFixed(2)}s, recalculada pelos caracteres reais) abaixo do piso de ${DURACAO_MINIMA_VIDEO_SEG}s`;
        mensagens.push({ role: "assistant", content: resposta });
        mensagens.push({
          role: "user",
          content: `A duração real (calculada pelos caracteres de texto_narrado, não pelo duracao_seg que você escreveu) ficou em ${duracaoTotal.toFixed(2)}s, abaixo do mínimo de ${DURACAO_MINIMA_VIDEO_SEG}s (7 minutos). Devolva o JSON de novo, expandindo o video_roteiro com MAIS TEXTO/detalhe do que já está na transcrição — sem inventar fatos que não estão nela — até bater pelo menos ~8.200 caracteres somados de texto_narrado. Sem cercas de markdown.`,
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
