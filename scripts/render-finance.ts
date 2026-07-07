// Render do clipe V3 Premium Finance (2D). "still" = 1 quadro no meio de
// cada um dos 5 blocos (p/ conferência de layout); "video" = 30s completo.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, renderMedia } from "@remotion/renderer";
import path from "node:path";
const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const modo = process.argv[2] ?? "still";
async function main() {
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/finance/index.ts") });
  const composition = await selectComposition({ serveUrl, id: "ClipeFinance", browserExecutable: CHROME });
  if (modo === "still") {
    const mids: [string, number][] = [["b1", 45], ["b2", 180], ["b3", 405], ["b4", 630], ["b5", 810]];
    for (const [tag, f] of mids) {
      const output = path.resolve(`scripts/output/fin-${tag}-f${f}.png`);
      await renderStill({ composition, serveUrl, output, frame: f, browserExecutable: CHROME });
      console.log("still:", output);
    }
  } else {
    const output = path.resolve("scripts/output/clipe-finance-30s.mp4");
    await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: output, browserExecutable: CHROME,
      onProgress: ({ progress }) => { if (Math.round(progress*100)%20===0) process.stdout.write(`\r ${Math.round(progress*100)}% `); } });
    console.log("\nvideo:", output);
  }
}
main().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
