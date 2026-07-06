import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

// CATÁLOGO DE TRANSIÇÕES (Seção 3), 3 variações que alternam (nunca a
// mesma duas vezes seguidas). Todas são profundidade 3D real (perspective
// + translateZ/rotateY), nunca corte seco. Opacidade parcial de propósito
// para a troca não virar "pico" no frame-diff.
type Props = Record<string, never>;
const PERSP = 1000;

// A — "Recuo e Avanço" (profundidade Z). Sai recuando (Z 0→-200,
// opacidade 1→0), entra avançando do fundo (Z -150→0, opacidade 0→1).
const CompA: React.FC<TransitionPresentationComponentProps<Props>> = ({ children, presentationProgress: p, presentationDirection }) => {
  const style: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "entering") {
      return { opacity: 0.4 + 0.6 * p, transform: `perspective(${PERSP}px) translateZ(${-150 * (1 - p)}px)` };
    }
    return { opacity: 1 - 0.6 * p, transform: `perspective(${PERSP}px) translateZ(${-200 * p}px)` };
  }, [p, presentationDirection]);
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

// B — "Rotação de Página" (eixo Y). A composição gira levemente em torno
// do eixo Y, revelando a próxima cena.
const CompB: React.FC<TransitionPresentationComponentProps<Props>> = ({ children, presentationProgress: p, presentationDirection }) => {
  const style: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "entering") {
      return { opacity: 0.5 + 0.5 * p, transformOrigin: "left center", transform: `perspective(${PERSP}px) rotateY(${-15 * (1 - p)}deg)` };
    }
    return { opacity: 1 - 0.5 * p, transformOrigin: "right center", transform: `perspective(${PERSP}px) rotateY(${15 * p}deg)` };
  }, [p, presentationDirection]);
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

// C — "Fade com Deslocamento Z" (a mais discreta). Fade + pequeno Z (±50),
// sem rotação.
const CompC: React.FC<TransitionPresentationComponentProps<Props>> = ({ children, presentationProgress: p, presentationDirection }) => {
  const style: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "entering") {
      return { opacity: p, transform: `perspective(${PERSP}px) translateZ(${-50 * (1 - p)}px)` };
    }
    return { opacity: 1 - p, transform: `perspective(${PERSP}px) translateZ(${50 * p}px)` };
  }, [p, presentationDirection]);
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

// Cada variação com sua duração (400-800ms). A=20f(~667ms), B=15f(500ms),
// C=16f(~533ms). C subiu de 12f→16f só pra ficar um pouco mais suave e bem
// dentro da faixa; a distinção transição-vs-corte no frame-diff é feita
// pelo zoom quadro-a-quadro do verificador (§10), não pela duração.
const VARIACOES = [
  { nome: "A-recuo-avanco", component: CompA, dur: 20 },
  { nome: "B-pagina", component: CompB, dur: 15 },
  { nome: "C-fade-z", component: CompC, dur: 16 },
];

export const NUM_TRANSICOES = VARIACOES.length;

// Alterna por índice (0=A,1=B,2=C,0=A...) — nunca repete a mesma duas
// vezes seguidas. Retorna a apresentação E a duração da variação.
export function transicaoVariada(indice: number): {
  presentation: TransitionPresentation<Props>;
  durationInFrames: number;
  nome: string;
} {
  const v = VARIACOES[indice % VARIACOES.length];
  return {
    presentation: { component: v.component, props: {} },
    durationInFrames: v.dur,
    nome: v.nome,
  };
}
