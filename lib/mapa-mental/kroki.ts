// Imagem estática do mapa mental para o PDF, via Kroki (Manual das
// Ferramentas, seção 7). Recebe o mesmo texto que o LLM devolve em
// `mapa_mental_mermaid` (sintaxe Mermaid mindmap) e envia direto —
// Kroki suporta o tipo de diagrama "mermaid" nativamente.
//
// Timeout explícito: sem ele, uma instabilidade pontual da instância
// pública do Kroki trava o fetch indefinidamente (sem erro, sem log) —
// aconteceu de verdade em CI (2x) depois que passamos a chamar essa
// função duas vezes por fixture, SVG e PNG.
import { logComTimestamp } from "../util/log";

const TIMEOUT_MS = 30_000;
const MAX_TENTATIVAS = 3;

// A instância pública do Kroki falha de forma TRANSIENTE ao converter
// mermaid: o conversor deles usa um Chromium server-side e, sob carga,
// devolve 400 com "Failed to launch the browser process ... Resource
// temporarily unavailable" no corpo (EAGAIN do lado DELES, não um erro
// do nosso diagrama). Visto em CI 2x em 3 chamadas no mesmo dia; a
// re-execução passou sem mudar nada. Um 400 assim é retentável; um 400
// "de verdade" (sintaxe mermaid inválida) não é.
function ehTransiente(status: number, corpo: string): boolean {
  if (status >= 500) return true;
  return status === 400 && corpo.includes("Failed to launch the browser process");
}

async function esperar(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function renderizarMapaMentalKroki(
  mermaidSource: string,
  formato: "svg" | "png" = "svg"
): Promise<Buffer> {
  const base = process.env.KROKI_URL || "https://kroki.io";
  let ultimoErro = "";

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    logComTimestamp(`Chamando Kroki (${formato})...`);
    let res: Response;
    try {
      res = await fetch(`${base}/mermaid/${formato}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: mermaidSource,
        signal: controller.signal,
      });
    } catch (erro) {
      clearTimeout(timeoutId);
      if (erro instanceof Error && erro.name === "AbortError") {
        logComTimestamp(`Kroki (${formato}) não respondeu em ${TIMEOUT_MS / 1000}s.`);
        ultimoErro = `Kroki não respondeu em ${TIMEOUT_MS / 1000}s (formato: ${formato}).`;
        await esperar(2 ** tentativa * 1000);
        continue;
      }
      throw erro;
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
      const corpo = await res.text();
      if (ehTransiente(res.status, corpo) && tentativa < MAX_TENTATIVAS) {
        logComTimestamp(
          `Kroki instável (${res.status}, tentativa ${tentativa}/${MAX_TENTATIVAS}) — retentando...`
        );
        ultimoErro = `Kroki falhou: ${res.status} ${corpo}`;
        await esperar(2 ** tentativa * 1000);
        continue;
      }
      throw new Error(`Kroki falhou: ${res.status} ${corpo}`);
    }

    logComTimestamp(`Resposta do Kroki (${formato}) recebida.`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error(
    `Kroki falhou após ${MAX_TENTATIVAS} tentativas. Último erro: ${ultimoErro}`
  );
}
