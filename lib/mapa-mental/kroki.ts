// Imagem estática do mapa mental para o PDF, via Kroki (Manual das
// Ferramentas, seção 7). Recebe o mesmo texto que o LLM devolve em
// `mapa_mental_mermaid` (sintaxe Mermaid mindmap) e envia direto —
// Kroki suporta o tipo de diagrama "mermaid" nativamente.
export async function renderizarMapaMentalKroki(
  mermaidSource: string,
  formato: "svg" | "png" = "svg"
): Promise<Buffer> {
  const base = process.env.KROKI_URL || "https://kroki.io";
  const res = await fetch(`${base}/mermaid/${formato}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: mermaidSource,
  });

  if (!res.ok) {
    throw new Error(`Kroki falhou: ${res.status} ${await res.text()}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
