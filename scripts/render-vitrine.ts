import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import path from "node:path";
const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
async function main() {
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/finance/index.ts") });
  const composition = await selectComposition({ serveUrl, id: "VitrineBanco", browserExecutable: CHROME });
  const output = path.resolve("scripts/output/vitrine-banco.png");
  await renderStill({ composition, serveUrl, output, frame: 60, browserExecutable: CHROME });
  console.log("still:", output);
}
main().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
