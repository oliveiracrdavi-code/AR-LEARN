import { readFile } from "node:fs/promises";
import { learnContratoSchema } from "../lib/openrouter/schema";
import { gerarPdfDoLearn } from "../lib/pdf/gerarPdf";
import { renderizarMapaMentalKroki } from "../lib/mapa-mental/kroki";

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
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
