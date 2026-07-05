import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

// Transição em PROFUNDIDADE 3D (não é fade/slide 2D): a cena que SAI
// recua no eixo Z (translateZ negativo) com leve rotação e some; a cena
// que ENTRA vem do fundo (translateZ negativo → 0) avançando até a
// posição final. Usada em TODAS as trocas de cena (nada de corte seco).
// perspective() no transform dá a profundidade real de câmera.

type Props = Record<string, never>;

const PERSPECTIVA = 1600;
// Profundidade do empurrão em Z: gentil o bastante para a transição não
// virar um "pico" de movimento (o teste reprova pico > 2x os vizinhos),
// mas visível como deslocamento de profundidade real.
const PROFUNDIDADE = 150;
// Opacidade parcial: a cena que entra vem do fundo já semivisível e a que
// sai não zera de imediato — assim o "crossfade" não muda a tela inteira
// de uma vez (o que viraria pico). A profundidade 3D (translateZ+escala)
// é quem conduz a troca; o fundo opaco da cena que entra cobre a que sai
// conforme avança.
const OP_ENTRA_MIN = 0.55;
const OP_SAI_MIN = 0.62;

const ComponenteProfundidade: React.FC<
  TransitionPresentationComponentProps<Props>
> = ({ children, presentationProgress, presentationDirection }) => {
  const style: React.CSSProperties = useMemo(() => {
    const p = presentationProgress; // 0 → 1
    if (presentationDirection === "entering") {
      // vem do fundo, avançando e clareando (de OP_ENTRA_MIN a 1)
      const z = -PROFUNDIDADE * (1 - p);
      const rot = -8 * (1 - p);
      const escala = 0.92 + 0.08 * p;
      return {
        opacity: OP_ENTRA_MIN + (1 - OP_ENTRA_MIN) * p,
        transform: `perspective(${PERSPECTIVA}px) translateZ(${z}px) rotateY(${rot}deg) scale(${escala})`,
        transformOrigin: "center center",
      };
    }
    // saindo: recua para o fundo (de 1 a OP_SAI_MIN)
    const z = -PROFUNDIDADE * p;
    const rot = 8 * p;
    const escala = 1 - 0.08 * p;
    return {
      opacity: 1 - (1 - OP_SAI_MIN) * p,
      transform: `perspective(${PERSPECTIVA}px) translateZ(${z}px) rotateY(${rot}deg) scale(${escala})`,
      transformOrigin: "center center",
    };
  }, [presentationProgress, presentationDirection]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const transicaoProfundidade = (): TransitionPresentation<Props> => ({
  component: ComponenteProfundidade,
  props: {},
});
