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

export async function renderizarMapaMentalKroki(
  mermaidSource: string,
  formato: "svg" | "png" = "svg"
): Promise<Buffer> {
  const base = process.env.KROKI_URL || "https://kroki.io";
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
    if (erro instanceof Error && erro.name === "AbortError") {
      logComTimestamp(`Kroki (${formato}) não respondeu em ${TIMEOUT_MS / 1000}s.`);
      throw new Error(`Kroki não respondeu em ${TIMEOUT_MS / 1000}s (formato: ${formato}).`);
    }
    throw erro;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    throw new Error(`Kroki falhou: ${res.status} ${await res.text()}`);
  }

  logComTimestamp(`Resposta do Kroki (${formato}) recebida.`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
