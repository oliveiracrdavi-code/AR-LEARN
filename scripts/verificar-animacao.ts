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
import { duracaoCenaSegundos } from "../lib/constantes";

// Chrome completo pré-instalado no ambiente (Playwright). Remotion
// normalmente baixaria o próprio Chrome Headless Shell; aqui apontamos
// pro que já existe, evitando download.
// chrome-headless-shell (implementação standalone do "old headless"
// que o Remotion espera) — o binário `chrome` completo removeu o old
// headless mode e não sobe. O headless_shell do Playwright serve.
const CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
// Amostragem a cada 0,5s. Critérios v3 (diretrizes de Davi — o piso de
// movimento da v2 foi ABANDONADO de propósito: agora as cenas ficam
// ESTÁVEIS depois da entrada, movimento só nas entradas/transições):
//   1. CONGELADO: nenhum intervalo com diferença ZERO.
//   2. CORTE SECO: nenhum salto isolado desproporcional (pico >> vizinhos
//      E absoluto alto) — seria transição seca.
//   3. OSCILAÇÃO CONTÍNUA (o "balanço"): a MEDIANA do movimento tem que
//      ser BAIXA (holds calmos, com só uns picos nas trocas). Mediana
//      alta = a tela toda se mexendo o tempo todo = balanço, reprovado.
const SEGUNDOS_ENTRE_AMOSTRAS = 0.5;
const RAZAO_CORTE = 4.0; // pico > 4x vizinhos ...
const ABS_CORTE_PCT = 4.0; // ... E acima de 4% = CANDIDATO a corte seco
const MEDIANA_MAX_PCT = 1.2; // mediana acima disso = oscilação contínua
// Ao achar um CANDIDATO a corte na amostragem grossa (0,5s), o verificador
// dá um ZOOM quadro-a-quadro naquele intervalo pra decidir: transição suave
// ou corte seco de verdade? O discriminador é a CONCENTRAÇÃO do movimento:
//   - corte seco = a tela troca de uma vez => QUASE TODA a mudança do
//     intervalo acontece num ÚNICO passo de 1 quadro (maiorPasso/soma ~ 1).
//   - transição (crossfade/Z/rotação) = a mudança se espalha por vários
//     quadros, subindo e descendo em corcova (ex.: dissolve grafico->ciclo
//     tem pico ~7,7%/quadro mas soma ~28% => concentração ~0,28).
// Um crossfade entre cenas bem diferentes gera picos por-quadro altos no
// meio mesmo sendo suave; por isso o teste é a fração concentrada, não um
// teto absoluto por quadro. Acima disto = corte seco real (reprova).
const FRAC_CONCENTRACAO_CORTE = 0.6;

// Props curtas de propósito, cobrindo vários visual_tipo diferentes —
// testa o dispatcher inteiro (cada cena renderiza um componente
// temático diferente) sem custo de um vídeo completo. Cada cena dura
// 5s, então 1s de amostragem dá ~5 amostras por cena (pega
// congelamento dentro da própria cena, não só no corte).
// As MESMAS 4 cenas do clipe (valorizacao, grafico, ciclo, oferta) —
// cobrem as 3 variações de transição (A/B/C) e 4 recursos diferentes
// (5.1 selo, 5.4 trilha, 5.3 chip, 5.2 mini-grid). Duração pela fórmula
// de leitura (aplicada em main()).
const PROPS_VERIFICACAO = {
  titulo: "Como funciona o mercado imobiliário",
  trilha: "Fundamentos",
  modulo: "Mercado Imobiliário",
  cenas: [
    {
      texto_narrado: "Um imóvel bem localizado se valoriza ano após ano — ganho consistente.",
      duracao_seg: 5,
      visual: "Casa valorizando",
      visual_tipo: "valorizacao_casa",
    },
    {
      texto_narrado: "Repare como o preço médio do metro quadrado subiu, ano após ano, nessa região.",
      duracao_seg: 5,
      visual: "Gráfico de preços por ano",
      visual_tipo: "grafico_precos_anos",
    },
    {
      texto_narrado: "O mercado se move em ciclos: aquecimento, estabilização, retração e recuperação.",
      duracao_seg: 5,
      visual: "Ciclo do mercado",
      visual_tipo: "ciclo_mercado_circular",
    },
    {
      texto_narrado: "Pouca oferta e muita procura empurram o preço para cima — a lei mais lucrativa do mercado.",
      duracao_seg: 5,
      visual: "Oferta e demanda",
      visual_tipo: "oferta_demanda_balanca",
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

  // Duração de cada cena pela fórmula de leitura (piso 5s) — testa o
  // mesmo cálculo determinístico usado no clipe/render real.
  for (const c of inputProps.cenas) {
    c.duracao_seg = duracaoCenaSegundos(c.texto_narrado);
  }

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
    type Amostra = { tA: string; tB: string; pct: number; frameA: number; frameB: number };
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
        frameA: caminhos[i - 1].frame,
        frameB: caminhos[i].frame,
      });
    }

    // Zoom quadro-a-quadro num intervalo: renderiza TODOS os quadros de
    // frameA..frameB e devolve o MAIOR salto de 1 quadro e a SOMA de todos
    // os saltos (%). A concentração (maior/soma) diz se foi corte seco (tudo
    // num passo, ~1) ou transição espalhada (bem abaixo). Usado só nos
    // candidatos a corte, pra não pagar o custo no vídeo inteiro.
    async function perfilQuadroAQuadro(frameA: number, frameB: number): Promise<{ maior: number; soma: number }> {
      let anterior: PNG | null = null;
      let maior = 0;
      let soma = 0;
      for (let f = frameA; f <= frameB; f++) {
        const caminho = path.join(dir, `zoom-${String(f).padStart(5, "0")}.png`);
        await renderStill({
          composition,
          serveUrl,
          output: caminho,
          frame: f,
          inputProps,
          puppeteerInstance: browser,
          browserExecutable: CHROME,
        });
        const atual = await carregarRGBA(caminho);
        if (anterior) {
          const d = pixelmatch(anterior.data, atual.data, undefined, width, height, { threshold: 0.1 });
          const pct = (d / totalPixels) * 100;
          maior = Math.max(maior, pct);
          soma += pct;
        }
        anterior = atual;
      }
      return { maior, soma };
    }

    // Análise dos 3 critérios v3.
    const paradosZero: string[] = [];
    const cortes: string[] = [];
    // Candidatos a corte pela amostragem grossa — confirmados só depois,
    // pelo zoom quadro-a-quadro.
    const candidatosCorte: { am: Amostra; ratio: number }[] = [];

    amostras.forEach((am, i) => {
      // vizinhos = até 2 antes e 2 depois, exceto o próprio
      const viz: number[] = [];
      for (let k = i - 2; k <= i + 2; k++) {
        if (k !== i && k >= 0 && k < amostras.length) viz.push(amostras[k].pct);
      }
      const mediaViz = viz.reduce((s, v) => s + v, 0) / (viz.length || 1);
      // Candidato a corte = salto isolado desproporcional E absoluto alto.
      const ehCandidato = am.pct > RAZAO_CORTE * mediaViz && am.pct > ABS_CORTE_PCT;
      const marcas =
        (am.pct === 0 ? "  <<< PARADO (ZERO)" : "") +
        (ehCandidato ? `  <<< CANDIDATO A CORTE (${(am.pct / mediaViz).toFixed(1)}x vizinhos) — checar no zoom` : "");
      console.log(`  ${am.tA}s -> ${am.tB}s : ${am.pct.toFixed(3)}%${marcas}`);
      if (am.pct === 0) paradosZero.push(`${am.tA}->${am.tB}`);
      if (ehCandidato) candidatosCorte.push({ am, ratio: am.pct / mediaViz });
    });

    // ZOOM quadro-a-quadro nos candidatos: transição suave (movimento
    // espalhado) ou corte seco de verdade (tudo num passo só)?
    if (candidatosCorte.length) {
      console.log("\n=== ZOOM QUADRO-A-QUADRO NOS CANDIDATOS A CORTE ===");
      for (const { am, ratio } of candidatosCorte) {
        const { maior, soma } = await perfilQuadroAQuadro(am.frameA, am.frameB);
        const conc = soma > 0 ? maior / soma : 1;
        const ehCorte = conc > FRAC_CONCENTRACAO_CORTE;
        const veredito = ehCorte ? "CORTE SECO" : "transição suave (ok)";
        console.log(
          `  ${am.tA}s -> ${am.tB}s : maior passo ${maior.toFixed(2)}%, soma ${soma.toFixed(2)}%, ` +
            `concentração ${conc.toFixed(2)} (limite ${FRAC_CONCENTRACAO_CORTE}) => ${veredito}`
        );
        if (ehCorte) {
          cortes.push(`${am.tA}->${am.tB} (${ratio.toFixed(1)}x na amostragem, concentração ${conc.toFixed(2)})`);
        }
      }
    }

    // Mediana do movimento (indicador de oscilação contínua / "balanço").
    const ordenadas = amostras.map((a) => a.pct).sort((x, y) => x - y);
    const mediana = ordenadas[Math.floor(ordenadas.length / 2)];
    const mediaGeral = amostras.reduce((s, a) => s + a.pct, 0) / amostras.length;

    console.log("\n=== RESULTADO ===");
    console.log(
      `Média: ${mediaGeral.toFixed(2)}% | Mediana: ${mediana.toFixed(2)}% (holds calmos = mediana baixa)`
    );

    let falhou = false;
    if (paradosZero.length) {
      console.error(`FALHOU (congelado): ${paradosZero.length} intervalo(s) com diferença ZERO: ${paradosZero.join(", ")}.`);
      falhou = true;
    }
    if (cortes.length) {
      console.error(`FALHOU (corte seco): salto(s) desproporcional(is): ${cortes.join(", ")}.`);
      falhou = true;
    }
    if (mediana > MEDIANA_MAX_PCT) {
      console.error(
        `FALHOU (oscilação contínua / balanço): mediana ${mediana.toFixed(2)}% > ${MEDIANA_MAX_PCT}% — a tela se mexe demais o tempo todo, não só nas trocas.`
      );
      falhou = true;
    }
    if (falhou) {
      process.exit(1);
    }
    console.log(
      "PASSOU: sem congelamento, sem corte seco, e sem oscilação contínua (holds estáveis, movimento nas entradas/trocas)."
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
