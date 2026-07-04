// Sintetiza a narração real (Edge TTS, voz oficial pt-BR-AntonioNeural)
// do roteiro gerado pelo cérebro (scripts/gerar-fixture-real.ts) e mede
// a duração REAL de cada cena, pra sincronizar o timeline do vídeo
// Remotion com o áudio de verdade (em vez da estimativa do roteiro).
// Não precisa de nenhuma credencial/API key.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import type { LearnContrato } from "../lib/openrouter/schema";
import { sintetizarRoteiro, VOZ_OFICIAL } from "../lib/tts/sintetizar";

async function main() {
  const caminhoJson = process.argv[2] ?? "scripts/output/fixture-mercado-imobiliario.json";
  const caminhoAudioSaida = process.argv[3] ?? "scripts/output/narracao-fixture.mp3";
  const caminhoDuracoesSaida = process.argv[4] ?? "scripts/output/narracao-fixture-duracoes.json";

  const conteudo = await readFile(caminhoJson, "utf-8");
  const contrato = JSON.parse(conteudo) as LearnContrato;
  const cenas = contrato.learn.video_roteiro.cenas;

  console.log("Voz:", VOZ_OFICIAL);
  console.log("Cenas a narrar:", cenas.length);

  const { audioCompleto, duracoesPorCena } = await sintetizarRoteiro(
    cenas.map((cena) => cena.texto_narrado)
  );

  await mkdir("scripts/output", { recursive: true });
  await writeFile(caminhoAudioSaida, audioCompleto);
  await writeFile(caminhoDuracoesSaida, JSON.stringify({ duracoesPorCena }, null, 2), "utf-8");

  const duracaoTotalReal = duracoesPorCena.reduce((soma, d) => soma + d, 0);
  const duracaoTotalEstimada = cenas.reduce((soma, c) => soma + c.duracao_seg, 0);

  console.log("\n=== Comparação estimativa (cérebro) x real (narração medida) ===");
  cenas.forEach((cena, i) => {
    console.log(
      `  cena ${i + 1}: estimado ${cena.duracao_seg}s | real ${duracoesPorCena[i].toFixed(2)}s`
    );
  });
  console.log(`Total estimado: ${duracaoTotalEstimada}s`);
  console.log(`Total real (narração): ${duracaoTotalReal.toFixed(2)}s`);
  console.log("Áudio salvo em:", caminhoAudioSaida, `(${audioCompleto.length} bytes)`);
  console.log("Durações reais salvas em:", caminhoDuracoesSaida);
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
