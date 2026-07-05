// Stills para auditoria visual da v3: usa as 3 cenas do clipe (com
// duração pela fórmula de leitura) e renderiza um quadro NO MEIO de cada
// uma das 3 variações de transição (profundidade / página / suave) para
// confirmar profundidade 3D real, + o meio de cada cena para conferir
// densidade e o princípio "entrou, ficou estável".
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, openBrowser } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { duracaoCenaSegundos, PISO_DURACAO_CENA_SEG } from "../lib/constantes";

const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const FPS = 30;
const INTRO = PISO_DURACAO_CENA_SEG; // DURACAO_INTRO_SEG = 5

const CENAS_BRUTAS = [
  {
    texto_narrado:
      "Repare como o preço médio do metro quadrado subiu, ano após ano, nessa região. Quem entrou cedo, construiu patrimônio.",
    visual: "Gráfico de preços por ano",
    visual_tipo: "grafico_precos_anos",
  },
  {
    texto_narrado:
      "O mercado se move em ciclos: aquecimento, estabilização, retração e recuperação. Entender a fase separa o investidor do apostador.",
    visual: "Ciclo do mercado",
    visual_tipo: "ciclo_mercado_circular",
  },
  {
    texto_narrado:
      "Pouca oferta e muita procura empurram o preço para cima. É a lei mais básica, e a mais lucrativa, do mercado imobiliário.",
    visual: "Balança de oferta e demanda",
    visual_tipo: "oferta_demanda_balanca",
  },
];

const cenas = CENAS_BRUTAS.map((c) => ({ ...c, duracao_seg: duracaoCenaSegundos(c.texto_narrado) }));
const PROPS = {
  titulo: "Como funciona o mercado imobiliário",
  trilha: "Fundamentos",
  modulo: "Mercado Imobiliário",
  cenas,
};

async function main() {
  const outDir = path.resolve("scripts/output/inspecao-v2");
  await mkdir(outDir, { recursive: true });

  // Início de cada cena = INTRO + soma das narrações anteriores. Cada
  // troca acontece em torno desse instante (a transição de ~0,8s é
  // centrada no limite). Também pego o meio de cada cena.
  let acc = INTRO;
  const alvos: [string, number][] = [];
  const nomeTrans = ["profundidade", "pagina", "suave"];
  cenas.forEach((c, i) => {
    alvos.push([`trans-${i}-${nomeTrans[i % 3]}`, acc]); // meio da troca
    alvos.push([`cena-${i}-${c.visual_tipo}-meio`, acc + c.duracao_seg / 2]);
    acc += c.duracao_seg;
  });

  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/index.ts") });
  const composition = await selectComposition({
    serveUrl,
    id: "LearnVideo",
    inputProps: PROPS,
    browserExecutable: CHROME,
  });
  const browser = await openBrowser("chrome", { browserExecutable: CHROME });

  try {
    for (const [label, t] of alvos) {
      const frame = Math.round(t * FPS);
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
      console.log("still:", output, `(t=${t.toFixed(1)}s)`);
    }
  } finally {
    await browser.close({ silent: true });
  }
}

main().catch((e) => {
  console.error("Falhou:", e);
  process.exit(1);
});
