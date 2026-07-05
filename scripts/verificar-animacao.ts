// VERIFICAÇÃO OBJETIVA DE ANIMAÇÃO (seção 3.6 das Diretrizes Restritas
// de Animação, exigida por Davi): renderiza quadros amostrados da
// composição REAL do Remotion (LearnVideo, passando pelo dispatcher de
// visual_tipo) e compara pixel a pixel amostras consecutivas. Se
// QUALQUER intervalo der diferença zero (quadros idênticos), a
// implementação FALHOU — a tela ficou parada, que é exatamente o bug
// que dois renders anteriores tiveram. Amostro a cada 1s (mais rígido
// que o piso de 2s do documento) pra pegar até congelamentos curtos.
//
// Roda LOCALMENTE (não precisa de CI) usando o Chromium já instalado no
// ambiente e o compositor nativo do Remotion — nenhum ffmpeg externo.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, openBrowser } from "@remotion/renderer";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Chrome completo pré-instalado no ambiente (Playwright). Remotion
// normalmente baixaria o próprio Chrome Headless Shell; aqui apontamos
// pro que já existe, evitando download.
// chrome-headless-shell (implementação standalone do "old headless"
// que o Remotion espera) — o binário `chrome` completo removeu o old
// headless mode e não sobe. O headless_shell do Playwright serve.
const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
// Amostragem a cada 0,5s (critério das diretrizes de animação v2). Dois
// pisos objetivos além do "diferença zero":
//   - PISO_MOVIMENTO: nenhum trecho > 1s pode ficar abaixo desse % de
//     pixels alterados (senão "parece parado" mesmo sem congelar).
//   - RAZAO_PICO: nenhum pico pode ser > 2x a média dos vizinhos (isso
//     seria corte seco; transição suave fica dentro de 2x).
const SEGUNDOS_ENTRE_AMOSTRAS = 0.5;
const PISO_MOVIMENTO_PCT = 1.0;
const RAZAO_PICO = 2.0;

// Props curtas de propósito, cobrindo vários visual_tipo diferentes —
// testa o dispatcher inteiro (cada cena renderiza um componente
// temático diferente) sem custo de um vídeo completo. Cada cena dura
// 5s, então 1s de amostragem dá ~5 amostras por cena (pega
// congelamento dentro da própria cena, não só no corte).
const PROPS_VERIFICACAO = {
  titulo: "Como funciona o mercado imobiliário",
  trilha: "Fundamentos",
  modulo: "Mercado Imobiliário",
  cenas: [
    {
      texto_narrado:
        "Explica como a oferta e a demanda movem os preços dos imóveis em um bairro.",
      duracao_seg: 5,
      visual: "Balança de oferta e demanda",
      visual_tipo: "oferta_demanda_balanca",
    },
    {
      texto_narrado:
        "Mostra como um imóvel bem localizado se valoriza ao longo do tempo, com a porcentagem subindo.",
      duracao_seg: 5,
      visual: "Casa com valorização",
      visual_tipo: "valorizacao_casa",
    },
    {
      texto_narrado:
        "Apresenta o preço médio subindo ano a ano, de 2021 até 2026, em um gráfico de barras.",
      duracao_seg: 5,
      visual: "Gráfico de preços por ano",
      visual_tipo: "grafico_precos_anos",
    },
    {
      texto_narrado:
        "Explica o ciclo do mercado: aquecimento, estabilização, retração e recuperação.",
      duracao_seg: 5,
      visual: "Ciclo do mercado",
      visual_tipo: "ciclo_mercado_circular",
    },
    {
      texto_narrado:
        "Lista os erros mais comuns de quem compra um imóvel sem analisar direito.",
      duracao_seg: 5,
      visual: "Alerta de erros comuns",
      visual_tipo: "alerta_erros",
    },
    {
      texto_narrado:
        "Fecha com o checklist do que avaliar antes de comprar, cada item ganhando um check.",
      duracao_seg: 5,
      visual: "Checklist final",
      visual_tipo: "checklist_final",
    },
  ],
};

async function carregarRGBA(caminho: string): Promise<PNG> {
  const buffer = await readFile(caminho);
  return PNG.sync.read(buffer);
}

async function main() {
  const propsArg = process.argv[2];
  const inputProps = propsArg
    ? JSON.parse(await readFile(propsArg, "utf-8"))
    : PROPS_VERIFICACAO;

  console.log("Empacotando o projeto Remotion (bundle)...");
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/src/index.ts") });

  console.log("Selecionando a composição LearnVideo...");
  // browserExecutable aponta pro Chrome já instalado — sem isso o
  // Remotion tenta baixar o Chrome Headless Shell dele (bloqueado pelo
  // egress do ambiente: remotion.media não está na allowlist).
  const composition = await selectComposition({
    serveUrl,
    id: "LearnVideo",
    inputProps,
    browserExecutable: CHROME,
  });

  const { fps, durationInFrames, width, height } = composition;
  console.log(
    `Composição: ${width}x${height} @ ${fps}fps, ${durationInFrames} frames (${(
      durationInFrames / fps
    ).toFixed(1)}s).`
  );

  const passoFrames = Math.round(SEGUNDOS_ENTRE_AMOSTRAS * fps);
  const framesAmostrados: number[] = [];
  for (let f = 0; f < durationInFrames; f += passoFrames) {
    framesAmostrados.push(f);
  }
  // Garante que o último frame também entra (fim da última cena).
  if (framesAmostrados[framesAmostrados.length - 1] !== durationInFrames - 1) {
    framesAmostrados.push(durationInFrames - 1);
  }

  const dir = await mkdtemp(path.join(os.tmpdir(), "verif-anim-"));
  const browser = await openBrowser("chrome", { browserExecutable: CHROME });

  try {
    console.log(`Renderizando ${framesAmostrados.length} quadros amostrados...`);
    const caminhos: { frame: number; caminho: string }[] = [];
    for (const frame of framesAmostrados) {
      const caminho = path.join(dir, `frame-${String(frame).padStart(5, "0")}.png`);
      await renderStill({
        composition,
        serveUrl,
        output: caminho,
        frame,
        inputProps,
        puppeteerInstance: browser,
        browserExecutable: CHROME,
      });
      caminhos.push({ frame, caminho });
    }

    console.log("\n=== DIFERENÇA ENTRE AMOSTRAS CONSECUTIVAS (a cada 0,5s) ===");
    const totalPixels = width * height;

    // Coleta % de cada intervalo.
    type Amostra = { tA: string; tB: string; pct: number };
    const amostras: Amostra[] = [];
    for (let i = 1; i < caminhos.length; i++) {
      const a = await carregarRGBA(caminhos[i - 1].caminho);
      const b = await carregarRGBA(caminhos[i].caminho);
      const diff = pixelmatch(a.data, b.data, undefined, width, height, { threshold: 0.1 });
      const pct = (diff / totalPixels) * 100;
      amostras.push({
        tA: (caminhos[i - 1].frame / fps).toFixed(1),
        tB: (caminhos[i].frame / fps).toFixed(1),
        pct,
      });
    }

    // Análise dos 3 critérios.
    const paradosZero: string[] = [];
    const abaixoPiso: number[] = []; // índices abaixo do piso de movimento
    const picos: string[] = [];

    amostras.forEach((am, i) => {
      // vizinhos = até 2 antes e 2 depois, exceto o próprio
      const viz: number[] = [];
      for (let k = i - 2; k <= i + 2; k++) {
        if (k !== i && k >= 0 && k < amostras.length) viz.push(amostras[k].pct);
      }
      const mediaViz = viz.reduce((s, v) => s + v, 0) / (viz.length || 1);
      const ehPico = am.pct > RAZAO_PICO * mediaViz && mediaViz > 0.05;
      const marcas =
        (am.pct === 0 ? "  <<< PARADO (ZERO)" : "") +
        (am.pct < PISO_MOVIMENTO_PCT ? "  < piso" : "") +
        (ehPico ? `  <<< PICO (${(am.pct / mediaViz).toFixed(1)}x vizinhos)` : "");
      console.log(
        `  ${am.tA}s -> ${am.tB}s : ${am.pct.toFixed(3)}%${marcas}`
      );
      if (am.pct === 0) paradosZero.push(`${am.tA}->${am.tB}`);
      if (am.pct < PISO_MOVIMENTO_PCT) abaixoPiso.push(i);
      if (ehPico) picos.push(`${am.tA}->${am.tB} (${(am.pct / mediaViz).toFixed(1)}x)`);
    });

    // Trechos contínuos > 1s abaixo do piso (3+ amostras de 0,5s = 1,5s).
    const trechosLongos: string[] = [];
    let run: number[] = [];
    const fechaRun = () => {
      if (run.length >= 3) {
        trechosLongos.push(
          `${amostras[run[0]].tA}s..${amostras[run[run.length - 1]].tB}s (${(
            run.length * SEGUNDOS_ENTRE_AMOSTRAS
          ).toFixed(1)}s)`
        );
      }
      run = [];
    };
    for (let i = 0; i < amostras.length; i++) {
      if (abaixoPiso.includes(i)) run.push(i);
      else fechaRun();
    }
    fechaRun();

    console.log("\n=== RESULTADO ===");
    const mediaGeral = amostras.reduce((s, a) => s + a.pct, 0) / amostras.length;
    console.log(`Média de movimento: ${mediaGeral.toFixed(2)}% por 0,5s`);

    let falhou = false;
    if (paradosZero.length) {
      console.error(`FALHOU (congelado): ${paradosZero.length} intervalo(s) com diferença ZERO.`);
      falhou = true;
    }
    if (trechosLongos.length) {
      console.error(
        `FALHOU (movimento insuficiente): trecho(s) > 1s abaixo de ${PISO_MOVIMENTO_PCT}%: ${trechosLongos.join(
          ", "
        )}.`
      );
      falhou = true;
    }
    if (picos.length) {
      console.error(
        `FALHOU (corte seco): pico(s) > ${RAZAO_PICO}x os vizinhos: ${picos.join(", ")}.`
      );
      falhou = true;
    }
    if (falhou) {
      process.exit(1);
    }
    console.log(
      `PASSOU: sem congelamento, sem trecho > 1s abaixo de ${PISO_MOVIMENTO_PCT}%, e sem pico > ${RAZAO_PICO}x (transições suaves).`
    );
  } finally {
    await browser.close({ silent: true });
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((erro) => {
  console.error("Falhou (erro inesperado na verificação):", erro);
  process.exit(1);
});
