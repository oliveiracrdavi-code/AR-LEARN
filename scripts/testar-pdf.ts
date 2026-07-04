import { readFile } from "node:fs/promises";
import { learnContratoSchema } from "../lib/openrouter/schema";
import { gerarPdfDoLearn } from "../lib/pdf/gerarPdf";

async function main() {
  const caminhoJson = process.argv[2] ?? "scripts/output/fixture-mercado-imobiliario.json";
  const conteudo = await readFile(caminhoJson, "utf-8");
  const contrato = learnContratoSchema.parse(JSON.parse(conteudo));

  const caminhoSaida = "scripts/output/fixture-mercado-imobiliario.pdf";
  await gerarPdfDoLearn(contrato.learn, caminhoSaida);
  console.log("PDF gerado em:", caminhoSaida, "(sem mapa mental embutido — ativo separado)");

  const pdfBuffer = await readFile(caminhoSaida);
  console.log("===PDF_BASE64_START===");
  console.log(pdfBuffer.toString("base64"));
  console.log("===PDF_BASE64_END===");
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
