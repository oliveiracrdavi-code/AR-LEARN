// Converte o JSON do Learn (contrato do Sistema_Autonomo_v2) no shape
// de props que a composição Remotion espera. Se receber o caminho do
// áudio de narração (Edge TTS) e das durações reais medidas por cena
// (scripts/sintetizar-narracao-fixture.ts), substitui a estimativa de
// duração do cérebro pela duração REAL da narração, pra vídeo e áudio
// ficarem sincronizados cena a cena. Sem esses argumentos, mantém o
// comportamento antigo (estimativa do roteiro, vídeo mudo).
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LearnContrato } from "../lib/openrouter/schema";
import type { LearnVideoProps } from "../remotion/src/LearnVideo";

async function main() {
  const caminhoEntrada = process.argv[2] ?? "scripts/output/fixture-mercado-imobiliario.json";
  const caminhoSaida = process.argv[3] ?? "scripts/output/remotion-props.json";
  const caminhoAudio = process.argv[4];
  const caminhoDuracoes = process.argv[5];

  const conteudo = await readFile(caminhoEntrada, "utf-8");
  const contrato = JSON.parse(conteudo) as LearnContrato;

  let cenas = contrato.learn.video_roteiro.cenas;
  if (caminhoDuracoes) {
    const { duracoesPorCena } = JSON.parse(await readFile(caminhoDuracoes, "utf-8")) as {
      duracoesPorCena: number[];
    };
    if (duracoesPorCena.length !== cenas.length) {
      throw new Error(
        `Número de durações reais (${duracoesPorCena.length}) não bate com o número de cenas (${cenas.length}).`
      );
    }
    cenas = cenas.map((cena, i) => ({ ...cena, duracao_seg: duracoesPorCena[i] }));
  }

  // audioSrc carrega só o NOME do arquivo (relativo à pasta public/) —
  // não o caminho resolvido. staticFile() precisa ser chamado dentro
  // do componente React (LearnVideo.tsx), não aqui: chamado num script
  // Node puro (sem `window`), staticFile() cai num fallback sem o
  // prefixo correto, que não bate com onde o Remotion realmente serve
  // a pasta public/ durante o render — causava 404 mesmo com o arquivo
  // existindo no disco no lugar certo.
  const audioSrc = caminhoAudio ? path.relative("public", caminhoAudio) : undefined;

  const props: LearnVideoProps = {
    titulo: contrato.learn.titulo,
    trilha: contrato.learn.trilha,
    modulo: contrato.learn.modulo,
    cenas,
    ...(audioSrc ? { audioSrc } : {}),
  };

  await writeFile(caminhoSaida, JSON.stringify(props, null, 2), "utf-8");
  console.log("Props do Remotion salvas em:", caminhoSaida);
  if (audioSrc) console.log("audioSrc:", audioSrc);
  if (caminhoDuracoes) console.log("Durações de cena substituídas pela narração real medida.");
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
