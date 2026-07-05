// Renderiza um CLIPE CURTO (intro + 3 cenas) da videoaula, local, para
// aprovação visual do Davi antes do render completo. Sem narração de
// propósito: o Edge TTS precisa de rede externa (bloqueada nesta
// sandbox), e o objetivo aqui é aprovar a ANIMAÇÃO/motion graphics — o
// render completo (CI) adiciona a narração real do Antonio sincronizada.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import path from "node:path";

const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

// 3 cenas que mostram técnicas de animação DIFERENTES + os ícones SVG
// novos. O intro (skyline_abertura, ~5s) entra automático antes delas.
const PROPS = {
  titulo: "Como funciona o mercado imobiliário",
  trilha: "Fundamentos",
  modulo: "Mercado Imobiliário",
  cenas: [
    {
      texto_narrado:
        "Repare como o preço médio do metro quadrado subiu, ano após ano, nessa região. Quem entrou cedo, construiu patrimônio.",
      duracao_seg: 7,
      visual: "Gráfico de preços por ano",
      visual_tipo: "grafico_precos_anos",
    },
    {
      texto_narrado:
        "O mercado se move em ciclos: aquecimento, estabilização, retração e recuperação. Entender a fase é o que separa o investidor do apostador.",
      duracao_seg: 7,
      visual: "Ciclo do mercado",
      visual_tipo: "ciclo_mercado_circular",
    },
    {
      texto_narrado:
        "Pouca oferta e muita procura empurram o preço para cima. É a lei mais básica, e a mais lucrativa, do mercado imobiliário.",
      duracao_seg: 7,
      visual: "Balança de oferta e demanda",
      visual_tipo: "oferta_demanda_balanca",
    },
  ],
};

async function main() {
  console.log("Bundle...");
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/index.ts") });

  console.log("Selecionando composição...");
  const composition = await selectComposition({
    serveUrl,
    id: "LearnVideo",
    inputProps: PROPS,
    browserExecutable: CHROME,
  });
  console.log(
    `Duração do clipe: ${(composition.durationInFrames / composition.fps).toFixed(1)}s ` +
      `(${composition.durationInFrames} frames @ ${composition.fps}fps)`
  );

  const saida = path.resolve("scripts/output/clipe-curto.mp4");
  console.log("Renderizando (sem áudio — aprovação de animação)...");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: saida,
    inputProps: PROPS,
    browserExecutable: CHROME,
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 10 === 0) {
        process.stdout.write(`\r  progresso: ${Math.round(progress * 100)}%   `);
      }
    },
  });
  console.log(`\nClipe salvo em: ${saida}`);
}

main().catch((e) => {
  console.error("Falhou:", e);
  process.exit(1);
});
