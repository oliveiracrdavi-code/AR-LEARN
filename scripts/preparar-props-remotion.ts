// Converte o JSON do Learn (contrato do Sistema_Autonomo_v2) no shape
// de props que a composição Remotion espera. audioSrc fica de fora até
// a narração (Google Cloud TTS) existir de verdade.
import { readFile, writeFile } from "node:fs/promises";
import type { LearnContrato } from "../lib/openrouter/schema";
import type { LearnVideoProps } from "../remotion/src/LearnVideo";

async function main() {
  const caminhoEntrada = process.argv[2] ?? "scripts/output/fixture-mercado-imobiliario.json";
  const caminhoSaida = process.argv[3] ?? "scripts/output/remotion-props.json";

  const conteudo = await readFile(caminhoEntrada, "utf-8");
  const contrato = JSON.parse(conteudo) as LearnContrato;

  const props: LearnVideoProps = {
    titulo: contrato.learn.titulo,
    trilha: contrato.learn.trilha,
    modulo: contrato.learn.modulo,
    cenas: contrato.learn.video_roteiro.cenas,
  };

  await writeFile(caminhoSaida, JSON.stringify(props, null, 2), "utf-8");
  console.log("Props do Remotion salvas em:", caminhoSaida);
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
