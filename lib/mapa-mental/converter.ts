// O contrato do Learn (Sistema_Autonomo_v2, seção 9) devolve o mapa
// mental em sintaxe Mermaid mindmap (campo mapa_mental_mermaid), que o
// Kroki consome nativamente para a imagem estática do PDF. Mas o mapa
// INTERATIVO do site usa Markmap, que espera uma lista markdown
// aninhada, não sintaxe Mermaid — os dois formatos não são iguais.
// Esta função converte um pro outro (mesma árvore, sintaxe diferente).
export function mermaidMindmapParaMarkdown(mermaidSource: string): string {
  const linhas = mermaidSource.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const corpo = linhas[0]?.trim() === "mindmap" ? linhas.slice(1) : linhas;

  return corpo
    .map((linha) => {
      const indentBruto = linha.match(/^(\s*)/)?.[1].length ?? 0;
      const nivel = Math.floor(indentBruto / 2);
      const texto = linha
        .trim()
        .replace(/^[-*]\s*/, "")
        .replace(/\(\(([^)]*)\)\)/, "$1")
        .replace(/\{\{([^}]*)\}\}/, "$1")
        .replace(/\[([^\]]*)\]/, "$1")
        .replace(/^\(([^)]*)\)$/, "$1")
        .trim();
      return `${"  ".repeat(nivel)}- ${texto}`;
    })
    .join("\n");
}
