import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

// VARIEDADE de transições 3D (v3): 3 apresentações diferentes que se
// alternam ao longo do vídeo, para nenhuma troca repetir demais (o que
// leria como corte disfarçado). Todas são PROFUNDIDADE real (perspective
// + translateZ/rotate), não fade 2D. A opacidade é parcial de propósito
// (não zera a tela toda de uma vez) para a troca não virar um "pico"
// isolado no frame-diff.
type Props = Record<string, never>;

const PERSPECTIVA = 1500;

// (a) PROFUNDIDADE: sai recuando no Z + leve rotateY; entra avançando do
// fundo. O "empurrão" clássico em profundidade.
const CompProfundidade: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
}) => {
  const style: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "entering") {
      return {
        opacity: 0.5 + 0.5 * p,
        transform: `perspective(${PERSPECTIVA}px) translateZ(${-180 * (1 - p)}px) rotateY(${-8 * (1 - p)}deg) scale(${0.94 + 0.06 * p})`,
      };
    }
    return {
      opacity: 1 - 0.4 * p,
      transform: `perspective(${PERSPECTIVA}px) translateZ(${-180 * p}px) rotateY(${8 * p}deg) scale(${1 - 0.06 * p})`,
    };
  }, [p, presentationDirection]);
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

// (b) PÁGINA: leve rotação em torno do eixo Y com origem na borda, como
// uma página virando. Ângulo maior que a (a), mas ainda sem cambalhota.
const CompPagina: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
}) => {
  const style: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "entering") {
      return {
        opacity: 0.55 + 0.45 * p,
        transformOrigin: "left center",
        transform: `perspective(${PERSPECTIVA}px) rotateY(${-22 * (1 - p)}deg) translateZ(${-90 * (1 - p)}px)`,
      };
    }
    return {
      opacity: 1 - 0.45 * p,
      transformOrigin: "right center",
      transform: `perspective(${PERSPECTIVA}px) rotateY(${18 * p}deg) translateZ(${-90 * p}px)`,
    };
  }, [p, presentationDirection]);
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

// (c) SUAVE: fade combinado com pequeno deslocamento em Z (a mais
// discreta das três).
const CompSuave: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
}) => {
  const style: React.CSSProperties = useMemo(() => {
    if (presentationDirection === "entering") {
      return {
        opacity: 0.4 + 0.6 * p,
        transform: `perspective(${PERSPECTIVA}px) translateZ(${-110 * (1 - p)}px)`,
      };
    }
    return {
      opacity: 1 - 0.5 * p,
      transform: `perspective(${PERSPECTIVA}px) translateZ(${70 * p}px)`,
    };
  }, [p, presentationDirection]);
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

const APRESENTACOES = [CompProfundidade, CompPagina, CompSuave];

// Alterna a variação por índice da troca (0,1,2,0,1,2,...).
export function transicaoVariada(indice: number): TransitionPresentation<Props> {
  const component = APRESENTACOES[indice % APRESENTACOES.length];
  return { component, props: {} };
}

export const NUM_TRANSICOES = APRESENTACOES.length;
