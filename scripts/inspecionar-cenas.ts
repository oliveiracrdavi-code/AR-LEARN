// Auditoria visual: renderiza UM quadro (parado) de cada visual_tipo
// pra eu inspecionar a qualidade de cada componente temático antes de
// mostrar qualquer clipe ao Davi — em especial pra pegar "tofu" (emoji
// sem fonte) no Chromium headless, risco sinalizado na implementação.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, openBrowser } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

const TIPOS = [
  "skyline_abertura",
  "oferta_demanda_balanca",
  "valorizacao_casa",
  "grafico_precos_anos",
  "financiamento_calculadora",
  "localizacao_mapa",
  "renda_passiva_calendario",
  "short_stay_calendario",
  "ciclo_mercado_circular",
  "alerta_erros",
  "checklist_final",
  "generico_fallback",
] as const;

async function main() {
  const outDir = path.resolve("scripts/output/inspecao");
  await mkdir(outDir, { recursive: true });

  // Uma cena por tipo, todas de 6s. O intro (5s) fica no começo.
  const cenas = TIPOS.map((tipo) => ({
    texto_narrado: `Exemplo de narração para o visual do tipo ${tipo}, ilustrando o conceito.`,
    duracao_seg: 6,
    visual: tipo,
    visual_tipo: tipo,
  }));

  const inputProps = {
    titulo: "Como funciona o mercado imobiliário",
    trilha: "Fundamentos",
    modulo: "Mercado Imobiliário",
    cenas,
  };

  console.log("Bundle...");
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/index.ts") });
  const composition = await selectComposition({
    serveUrl,
    id: "LearnVideo",
    inputProps,
    browserExecutable: CHROME,
  });
  const { fps } = composition;
  const browser = await openBrowser("chrome", { browserExecutable: CHROME });

  try {
    const INTRO = 5;
    for (let i = 0; i < TIPOS.length; i++) {
      // meio da cena i (intro + cenas anteriores + 3s)
      const t = INTRO + i * 6 + 3;
      const frame = Math.round(t * fps);
      const output = path.join(outDir, `${String(i + 1).padStart(2, "0")}-${TIPOS[i]}.png`);
      await renderStill({
        composition,
        serveUrl,
        output,
        frame,
        inputProps,
        puppeteerInstance: browser,
        browserExecutable: CHROME,
      });
      console.log("still:", output);
    }
  } finally {
    await browser.close({ silent: true });
  }
}

main().catch((e) => {
  console.error("Falhou:", e);
  process.exit(1);
});
