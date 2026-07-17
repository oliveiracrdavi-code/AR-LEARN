// Vídeo longo 16:9 ep.171 — "stills" (1 preview no meio de cada seção) ou
// "video" (render completo 12.847f). Mudo local (Edge TTS só no CI).
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, renderMedia } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { SECOES } from "../remotion/src/finance/longo/dados";

const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const modo = process.argv[2] ?? "stills";

async function main() {
  const outDir = path.resolve("scripts/output/episodes/171");
  await mkdir(outDir, { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/finance/index.ts") });
  const composition = await selectComposition({ serveUrl, id: "VideoLongo171", browserExecutable: CHROME });
  console.log(`Composição: ${composition.durationInFrames}f @ ${composition.fps}fps = ${(composition.durationInFrames / composition.fps / 60).toFixed(2)}min`);

  if (modo === "stills") {
    let acc = 0;
    for (let i = 0; i < SECOES.length; i++) {
      const meio = acc + Math.floor(SECOES[i].frames / 2);
      acc += SECOES[i].frames;
      const output = path.join(outDir, `preview_${String(i).padStart(2, "0")}_${SECOES[i].tipo}.png`);
      await renderStill({ composition, serveUrl, output, frame: meio, browserExecutable: CHROME });
      console.log("still:", output);
    }
  } else {
    const output = path.join(outDir, "ar_learn_171_16x9_final_v2.mp4");
    await renderMedia({
      composition, serveUrl, codec: "h264", outputLocation: output, browserExecutable: CHROME,
      onProgress: ({ progress }) => { const p = Math.round(progress * 100); if (p % 5 === 0) process.stdout.write(`\r ${p}% `); },
    });
    console.log("\nvideo:", output);
  }
}
main().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
