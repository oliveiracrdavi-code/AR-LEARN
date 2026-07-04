// Teste ISOLADO do Edge TTS (msedge-tts) — comparação de 3 vozes
// MASCULINAS pt-BR candidatas a voz fixa do projeto (perfil Leandro
// Carozzo: confiante, caloroso, profissional, autoridade sem
// arrogância — Guia de Voz e Vídeo V2). Gera uma amostra por voz, não
// escolhe nenhuma sozinho — decisão fica com o usuário, por ouvido.
// Não integra em lib/tts/ nem substitui a voz aprovada anteriormente
// (pt-BR-FranciscaNeural, feminina) até decisão explícita.
import { readFile, mkdir } from "node:fs/promises";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const VOZES_CANDIDATAS = [
  "pt-BR-AntonioNeural",
  "pt-BR-HumbertoNeural",
  "pt-BR-DonatoNeural",
] as const;

const TEXTO_TESTE =
  "Olá! Este é um teste de voz em português brasileiro, usando o Edge TTS. " +
  "Se você está ouvindo isso claramente, com pronúncia correta e sotaque brasileiro, o teste funcionou.";

async function sintetizarVoz(voz: string) {
  console.log(`\n=== Voz: ${voz} ===`);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voz, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioFilePath } = await tts.toFile("scripts/output", TEXTO_TESTE);
  const audioBuffer = await readFile(audioFilePath);

  const caminhoFinal = `scripts/output/teste-tts-edge-${voz}.mp3`;
  if (audioFilePath !== caminhoFinal) {
    await import("node:fs/promises").then((fs) => fs.rename(audioFilePath, caminhoFinal));
  }

  console.log("OK — áudio salvo em:", caminhoFinal, `(${audioBuffer.length} bytes)`);
  console.log(`===AUDIO_BASE64_START_${voz}===`);
  console.log(audioBuffer.toString("base64"));
  console.log(`===AUDIO_BASE64_END_${voz}===`);
}

async function main() {
  console.log("Texto:", TEXTO_TESTE);
  await mkdir("scripts/output", { recursive: true });

  // Catálogo real de vozes pt-BR (não confiar de memória — a Microsoft
  // pode ter renomeado/removido vozes desde o treinamento do modelo).
  const catalogo = await new MsEdgeTTS().getVoices();
  const vozesPtBr = catalogo.filter((v) => v.Locale === "pt-BR");
  console.log("\n=== Catálogo real de vozes pt-BR disponíveis ===");
  for (const v of vozesPtBr) {
    console.log(`  ${v.ShortName} (${v.Gender})`);
  }

  for (const voz of VOZES_CANDIDATAS) {
    try {
      await sintetizarVoz(voz);
    } catch (erro) {
      console.error(`FALHOU (${voz}):`, erro instanceof Error ? erro.message : erro);
    }
  }
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
