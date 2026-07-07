// Renderiza a CENA DE TESTE do Motion System V2 (still + curto mp4, mudo).
// Usa headless_shell + gl=angle (WebGL por software), a esteira validada no
// smoke test 3D. Objetivo: aprovar a DIREÇÃO visual antes de portar tudo.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, renderMedia } from "@remotion/renderer";
import path from "node:path";

const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const GL = "angle" as const;
const modo = process.argv[2] ?? "still"; // "still" | "video"

async function main() {
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/sistema/index.ts") });
  const composition = await selectComposition({
    serveUrl, id: "CenaHeroiManchete", browserExecutable: CHROME, chromiumOptions: { gl: GL },
  });
  if (modo === "still") {
    for (const f of [8, 30, 90, 170]) {
      const output = path.resolve(`scripts/output/v2-teste-f${f}.png`);
      await renderStill({ composition, serveUrl, output, frame: f, browserExecutable: CHROME, chromiumOptions: { gl: GL } });
      console.log("still:", output);
    }
  } else {
    const output = path.resolve("scripts/output/v2-cena-teste.mp4");
    await renderMedia({
      composition, serveUrl, codec: "h264", outputLocation: output,
      browserExecutable: CHROME, chromiumOptions: { gl: GL },
      onProgress: ({ progress }) => { if (Math.round(progress * 100) % 20 === 0) process.stdout.write(`\r ${Math.round(progress*100)}% `); },
    });
    console.log("\nvideo:", output);
  }
}
main().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
