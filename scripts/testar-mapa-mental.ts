import { readFile, writeFile } from "node:fs/promises";
import { learnContratoSchema } from "../lib/openrouter/schema";
import { mermaidMindmapParaMarkdown } from "../lib/mapa-mental/converter";
import { validarMarkmap } from "../lib/mapa-mental/markmap";

function contarNos(no: { content?: string; children?: unknown[] }): number {
  const filhos = (no.children as { content?: string; children?: unknown[] }[]) ?? [];
  return 1 + filhos.reduce((soma, filho) => soma + contarNos(filho), 0);
}

async function main() {
  const caminhoJson = process.argv[2] ?? "scripts/output/fixture-mercado-imobiliario.json";
  const conteudo = await readFile(caminhoJson, "utf-8");
  const contrato = learnContratoSchema.parse(JSON.parse(conteudo));

  const mermaidSource = contrato.learn.mapa_mental_mermaid;
  console.log("Fonte Mermaid (primeiras linhas):");
  console.log(mermaidSource.split("\n").slice(0, 5).join("\n"));

  const markdown = mermaidMindmapParaMarkdown(mermaidSource);
  await writeFile("scripts/output/fixture-mercado-imobiliario-mapa.md", markdown, "utf-8");
  console.log("\nMarkdown convertido (pra Markmap), salvo em scripts/output/fixture-mercado-imobiliario-mapa.md");

  const { root } = validarMarkmap(markdown);
  const totalNos = contarNos(root as { content?: string; children?: unknown[] });
  console.log(`Árvore do Markmap válida: ${totalNos} nós (raiz + ramos + folhas).`);
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
