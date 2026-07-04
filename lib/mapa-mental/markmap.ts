import { Transformer } from "markmap-lib";

// Valida que o markdown (já convertido de Mermaid) gera uma árvore
// consumível pelo Markmap — é essa árvore que o componente interativo
// do site renderiza. Se isso falhar, o componente quebraria em runtime.
export function validarMarkmap(markdown: string) {
  const transformer = new Transformer();
  const { root, features } = transformer.transform(markdown);

  if (!root || !root.children || root.children.length === 0) {
    throw new Error("Markmap não gerou uma árvore válida (root sem filhos)");
  }

  return { root, features };
}
