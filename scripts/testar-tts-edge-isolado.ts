// Teste ISOLADO do Edge TTS (biblioteca msedge-tts, usa o serviço
// "Read Aloud" do Microsoft Edge): só "texto em português -> áudio",
// direto na lib, antes de plugar no pipeline inteiro. Não usa
// lib/tts/sintetizar.ts de propósito — quero ver o resultado bruto
// desta biblioteca primeiro. Não precisa de nenhuma credencial/API key.
import { readFile, mkdir } from "node:fs/promises";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Voz fixa do projeto (Regra de Ouro: uma única voz, documentada em
// docs/regras.md) — pt-BR-FranciscaNeural.
const VOZ = "pt-BR-FranciscaNeural";

const TEXTO_TESTE =
  "Olá! Este é um teste de voz em português brasileiro, usando o Edge TTS. " +
  "Se você está ouvindo isso claramente, com pronúncia correta e sotaque brasileiro, o teste funcionou.";

async function main() {
  console.log("Voz:", VOZ);
  console.log("Texto:", TEXTO_TESTE);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOZ, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  await mkdir("scripts/output", { recursive: true });
  const { audioFilePath } = await tts.toFile("scripts/output", TEXTO_TESTE);

  const audioBuffer = await readFile(audioFilePath);
  const caminhoFinal = "scripts/output/teste-tts-edge-pt.mp3";
  if (audioFilePath !== caminhoFinal) {
    await import("node:fs/promises").then((fs) => fs.rename(audioFilePath, caminhoFinal));
  }

  console.log("OK — áudio salvo em:", caminhoFinal, `(${audioBuffer.length} bytes)`);
  console.log("===AUDIO_BASE64_START===");
  console.log(audioBuffer.toString("base64"));
  console.log("===AUDIO_BASE64_END===");
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
