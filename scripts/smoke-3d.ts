// DE-RISCO WebGL: prova que o Remotion renderiza Three.js (WebGL real) em
// headless neste ambiente. Usa o chrome-headless-shell (o único binário que
// o Remotion consegue subir aqui) + backend de GL por software (angle =
// ANGLE/SwiftShader). Se sair um cubo sombreado, a esteira 3D funciona.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import path from "node:path";

const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const GL = (process.argv[2] as "angle" | "swiftshader" | "egl" | "vulkan") || "angle";

async function main() {
  console.log(`Bundle... (gl=${GL})`);
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/smoke/index.ts") });
  const composition = await selectComposition({
    serveUrl,
    id: "Smoke3D",
    browserExecutable: CHROME,
    chromiumOptions: { gl: GL },
  });
  const output = path.resolve(`scripts/output/smoke-3d-${GL}.png`);
  await renderStill({
    composition,
    serveUrl,
    output,
    frame: 20,
    browserExecutable: CHROME,
    chromiumOptions: { gl: GL },
  });
  console.log("still:", output);
}
main().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
