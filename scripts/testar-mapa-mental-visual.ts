// Prova visual de verdade (não só estrutural) de que o mapa mental
// interativo renderiza sem erro: monta uma página HTML standalone com
// Markmap + D3 (bundles locais, sem precisar de rede) e abre num
// Chromium headless via Playwright.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { learnContratoSchema } from "../lib/openrouter/schema";
import { mermaidMindmapParaMarkdown } from "../lib/mapa-mental/converter";
import { validarMarkmap } from "../lib/mapa-mental/markmap";

async function main() {
  const caminhoJson = process.argv[2] ?? "scripts/output/fixture-mercado-imobiliario.json";
  const conteudo = await readFile(caminhoJson, "utf-8");
  const contrato = learnContratoSchema.parse(JSON.parse(conteudo));

  const markdown = mermaidMindmapParaMarkdown(contrato.learn.mapa_mental_mermaid);
  const { root } = validarMarkmap(markdown);

  const d3Path = path.resolve("node_modules/d3/dist/d3.js");
  const markmapViewPath = path.resolve("node_modules/markmap-view/dist/browser/index.js");

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0">
  <svg id="mapa" style="width:1200px;height:800px"></svg>
  <script src="file://${d3Path}"></script>
  <script src="file://${markmapViewPath}"></script>
  <script>
    window.__erroMapa = null;
    window.onerror = (msg) => { window.__erroMapa = String(msg); };
    const root = ${JSON.stringify(root)};
    const svgEl = document.getElementById("mapa");
    const mm = markmap.Markmap.create(svgEl, {}, root);
    window.__mmPronto = true;
  </script>
</body>
</html>`;

  const caminhoHtml = "scripts/output/fixture-mercado-imobiliario-mapa-visual.html";
  await writeFile(caminhoHtml, html, "utf-8");

  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined
  );
  try {
    const page = await browser.newPage();
    const errosConsole: string[] = [];
    page.on("pageerror", (erro) => errosConsole.push(String(erro)));
    page.on("console", (msg) => {
      if (msg.type() === "error") errosConsole.push(msg.text());
    });

    await page.goto(`file://${path.resolve(caminhoHtml)}`);
    await page.waitForFunction(() => (window as unknown as { __mmPronto?: boolean }).__mmPronto === true, {
      timeout: 5000,
    });

    const numNosRenderizados = await page.$$eval("#mapa g.markmap-node", (nos) => nos.length);
    const caminhoScreenshot = "scripts/output/fixture-mercado-imobiliario-mapa-visual.png";
    await page.screenshot({ path: caminhoScreenshot });

    console.log("Nós renderizados no SVG interativo:", numNosRenderizados);
    console.log("Erros de console/página:", errosConsole.length === 0 ? "nenhum" : errosConsole);
    console.log("Screenshot salvo em:", caminhoScreenshot);

    if (errosConsole.length > 0) {
      throw new Error(`Renderização do Markmap teve erros: ${errosConsole.join(" | ")}`);
    }
    if (numNosRenderizados === 0) {
      throw new Error("O SVG do Markmap renderizou sem nenhum nó — algo está errado.");
    }

    console.log("\nOK — componente interativo (Markmap) renderiza sem erro.");
  } finally {
    await browser.close();
  }
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
