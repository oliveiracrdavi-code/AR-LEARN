// Stills para auditoria visual da v2 (transições + profundidade 3D +
// densidade): 3 cenas em momentos diferentes + 1 quadro NO MEIO de uma
// transição (para confirmar deslocamento de profundidade real, não fade
// 2D). Usa as mesmas 3 cenas do clipe de aprovação.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, openBrowser } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

const PROPS = {
  titulo: "Como funciona o mercado imobiliário",
  trilha: "Fundamentos",
  modulo: "Mercado Imobiliário",
  cenas: [
    {
      texto_narrado:
        "Repare como o preço médio do metro quadrado subiu, ano após ano, nessa região.",
      duracao_seg: 7,
      visual: "Gráfico de preços por ano",
      visual_tipo: "grafico_precos_anos",
    },
    {
      texto_narrado:
        "O mercado se move em ciclos: aquecimento, estabilização, retração e recuperação.",
      duracao_seg: 7,
      visual: "Ciclo do mercado",
      visual_tipo: "ciclo_mercado_circular",
    },
    {
      texto_narrado:
        "Pouca oferta e muita procura empurram o preço para cima.",
      duracao_seg: 7,
      visual: "Balança de oferta e demanda",
      visual_tipo: "oferta_demanda_balanca",
    },
  ],
};

// (label, tempo em segundos)
const ALVOS: [string, number][] = [
  ["01-grafico-meio", 8.5],
  ["02-transicao-grafico-ciclo", 12.0],
  ["03-transicao-grafico-ciclo-b", 12.3],
  ["04-ciclo-meio", 15.5],
  ["05-transicao-ciclo-oferta", 19.0],
  ["06-oferta-meio", 22.5],
];

async function main() {
  const outDir = path.resolve("scripts/output/inspecao-v2");
  await mkdir(outDir, { recursive: true });

  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/index.ts") });
  const composition = await selectComposition({
    serveUrl,
    id: "LearnVideo",
    inputProps: PROPS,
    browserExecutable: CHROME,
  });
  const { fps } = composition;
  const browser = await openBrowser("chrome", { browserExecutable: CHROME });

  try {
    for (const [label, t] of ALVOS) {
      const frame = Math.round(t * fps);
      const output = path.join(outDir, `${label}.png`);
      await renderStill({
        composition,
        serveUrl,
        output,
        frame,
        inputProps: PROPS,
        puppeteerInstance: browser,
        browserExecutable: CHROME,
      });
      console.log("still:", output, `(t=${t}s, frame=${frame})`);
    }
  } finally {
    await browser.close({ silent: true });
  }
}

main().catch((e) => {
  console.error("Falhou:", e);
  process.exit(1);
});
