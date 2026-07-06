import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { z } from "zod";
import { COR_FUNDO, COR_DESTAQUE, VISUAL_TIPOS } from "./cores";
import { CENAS_POR_TIPO, GenericoFallback, SkylineAbertura } from "./cenas";
import { transicaoVariada } from "./animacao/transicaoProfundidade";
import { MonogramaAR } from "./animacao/MonogramaAR";

// Frames de narração de cada cena (arredondado por cena, para casar com o
// cálculo de duração total da composição em Root.tsx).
export function framesDeNarracao(cenas: { duracao_seg: number }[], fps: number): number[] {
  return cenas.map((c) => Math.round(c.duracao_seg * fps));
}

// Paleta oficial re-exportada de ./cores (fonte de verdade única) para
// não haver drift entre este componente, as primitivas e as cenas
// temáticas. Mantidas exportadas aqui por compatibilidade com quem já
// importava daqui.
export { COR_FUNDO, COR_DESTAQUE };

const cenaVideoSchema = z.object({
  texto_narrado: z.string(),
  duracao_seg: z.number(),
  // Dica humana livre (mantida): o cérebro descreve o visual em texto.
  visual: z.string(),
  // Seletor de máquina: escolhe o componente temático animado. Opcional
  // com default "generico_fallback" para fixtures antigas (sem o campo)
  // ainda renderizarem — mas o cérebro deve sempre preencher.
  visual_tipo: z.enum(VISUAL_TIPOS).optional().default("generico_fallback"),
});

// Schema explícito (em vez de só uma interface) pra a Composition do
// Remotion conseguir inferir o tipo das props corretamente.
export const learnVideoPropsSchema = z.object({
  titulo: z.string(),
  trilha: z.string(),
  modulo: z.string(),
  cenas: z.array(cenaVideoSchema),
  // Nome do arquivo de áudio da narração já sintetizada (Edge TTS, voz
  // oficial pt-BR-AntonioNeural), dentro da pasta public/ — resolvido
  // com staticFile() dentro do componente (não no script que prepara
  // as props: staticFile() só calcula o prefixo certo quando chamado
  // em contexto de navegador, que é onde o Remotion de fato renderiza;
  // chamado num script Node puro, cai num fallback sem prefixo que não
  // bate com onde o bundler realmente copia a pasta public/). Também
  // aceita uma URL http(s) direta. Sem isso, o vídeo renderiza mudo —
  // nunca com uma voz substituta.
  audioSrc: z.string().optional(),
});

export type CenaVideo = z.infer<typeof cenaVideoSchema>;
export type LearnVideoProps = z.infer<typeof learnVideoPropsSchema>;

export const DURACAO_INTRO_SEG = 5;

export const learnVideoDefaultProps: LearnVideoProps = {
  titulo: "Título de exemplo",
  trilha: "Trilha de exemplo",
  modulo: "Módulo de exemplo",
  cenas: [
    {
      texto_narrado:
        "Olá, bem-vindos ao novo episódio, eu sou o Magnata Imobiliário e hoje iremos falar sobre valorização de imóveis.",
      duracao_seg: 8,
      visual: "Skyline de abertura com a logo.",
      visual_tipo: "skyline_abertura",
    },
    {
      texto_narrado:
        "Quando a oferta é escassa e a demanda cresce, o preço sobe — é o mercado te mostrando onde está a oportunidade.",
      duracao_seg: 8,
      visual: "Balança entre oferta e demanda.",
      visual_tipo: "oferta_demanda_balanca",
    },
    {
      texto_narrado:
        "Repare como o preço médio do metro quadrado sobe ano após ano: quem entra cedo constrói patrimônio.",
      duracao_seg: 8,
      visual: "Gráfico de barras por ano.",
      visual_tipo: "grafico_precos_anos",
    },
  ],
};

// Intro/título do vídeo: reaproveita a cena de abertura animada
// (SkylineAbertura) — logo entrando com spring e skyline se desenhando.
// Nunca mais um card estático. Mostra também trilha/módulo/título.
function TituloCard({
  titulo,
  trilha,
  modulo,
}: {
  titulo: string;
  trilha: string;
  modulo: string;
}) {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <SkylineAbertura
        texto={`${trilha} / ${modulo} — ${titulo}`}
        duracaoFrames={durationInFrames}
      />
    </AbsoluteFill>
  );
}

// Dispatcher: escolhe o componente temático animado pelo visual_tipo da
// cena, caindo em GenericoFallback (também animado) se faltar/for
// desconhecido. Cada cena recebe seu texto_narrado (vira legenda cinética)
// e a duração em frames (para cronometrar as animações internas).
function CenaView({ cena, duracaoFrames }: { cena: CenaVideo; duracaoFrames: number }) {
  const Componente = CENAS_POR_TIPO[cena.visual_tipo] ?? GenericoFallback;
  return <Componente texto={cena.texto_narrado} duracaoFrames={duracaoFrames} />;
}

export function LearnVideo({ titulo, trilha, modulo, cenas, audioSrc }: LearnVideoProps) {
  const { fps } = useVideoConfig();
  const introFrames = Math.round(DURACAO_INTRO_SEG * fps);
  const nCenas = cenas.length;
  const framesCena = framesDeNarracao(cenas, fps);

  // Transição ANTES da cena i = variação alternada (0=A,1=B,2=C,...) —
  // nunca a mesma duas vezes seguidas (Seção 3.5). Cada variação tem sua
  // própria duração (400-800ms).
  const trans = cenas.map((_, i) => transicaoVariada(i));
  const durTrans = (i: number) => trans[i].durationInFrames;

  const audioResolvido = audioSrc
    ? audioSrc.startsWith("http://") || audioSrc.startsWith("https://")
      ? audioSrc
      : staticFile(audioSrc)
    : undefined;

  // Sincronia de áudio com transições de duração VARIÁVEL: cada cena é
  // "padada" pela duração da transição que a SUCEDE, e a sobreposição da
  // transição consome esse padding — de modo que cena_i sempre começa em
  // introFrames + Σ narrações anteriores (áudio começa em introFrames),
  // sem drift, para quaisquer durações de transição. (Prova no histórico.)
  return (
    <AbsoluteFill style={{ backgroundColor: COR_FUNDO }}>
      {audioResolvido ? (
        <Sequence from={introFrames}>
          <Audio src={audioResolvido} />
        </Sequence>
      ) : null}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={introFrames + durTrans(0)}>
          <TituloCard titulo={titulo} trilha={trilha} modulo={modulo} />
        </TransitionSeries.Sequence>

        {cenas.map((cena, indice) => {
          const ehUltima = indice === nCenas - 1;
          const dur = framesCena[indice] + (ehUltima ? 0 : durTrans(indice + 1));
          return (
            <React.Fragment key={indice}>
              <TransitionSeries.Transition
                timing={linearTiming({
                  durationInFrames: durTrans(indice),
                  easing: Easing.inOut(Easing.cubic),
                })}
                presentation={trans[indice].presentation}
              />
              <TransitionSeries.Sequence durationInFrames={dur}>
                <CenaView cena={cena} duracaoFrames={dur} />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>

      {/* Motivo de continuidade: assinatura AR persistente (não
          transiciona com as cenas). */}
      <MonogramaAR />
    </AbsoluteFill>
  );
}
