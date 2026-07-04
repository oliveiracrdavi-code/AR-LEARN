import { readFile } from "node:fs/promises";
import { learnContratoSchema } from "../lib/openrouter/schema";
import { gerarPdfDoLearn } from "../lib/pdf/gerarPdf";

async function main() {
  const caminhoJson = process.argv[2] ?? "scripts/output/fixture-mercado-imobiliario.json";
  const conteudo = await readFile(caminhoJson, "utf-8");
  const contrato = learnContratoSchema.parse(JSON.parse(conteudo));

  let mapaMentalSvg: string | undefined;
  const caminhoSvg = process.argv[3];
  if (caminhoSvg) {
    mapaMentalSvg = await readFile(caminhoSvg, "utf-8");
  }

  const caminhoSaida = "scripts/output/fixture-mercado-imobiliario.pdf";
  await gerarPdfDoLearn(contrato.learn, caminhoSaida, { mapaMentalSvg });
  console.log("PDF gerado em:", caminhoSaida);

  const pdfBuffer = await readFile(caminhoSaida);
  console.log("===PDF_BASE64_START===");
  console.log(pdfBuffer.toString("base64"));
  console.log("===PDF_BASE64_END===");
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
