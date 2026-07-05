import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// Entrada de elemento com "assentamento" 3D: o elemento chega girando de
// leve (rotateY/rotateX) e vindo de uma distância no eixo Z, como um
// objeto físico se acomodando no espaço — não um card plano que só
// aparece. Depois de entrar, mantém um "idle motion" contínuo sutil
// (flutuação vertical + micro-rotação) para nunca ficar 100% parado.
export const Entrada3D: React.FC<{
  children: React.ReactNode;
  delay?: number;
  rotacaoInicial?: number; // graus de rotateY na entrada
  idle?: boolean; // manter flutuação contínua após entrar
  amplitudeIdle?: number; // px de flutuação vertical
  style?: React.CSSProperties;
}> = ({
  children,
  delay = 0,
  rotacaoInicial = 18,
  idle = true,
  amplitudeIdle = 8,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.8 } });

  const rotY = rotacaoInicial * (1 - t);
  const z = -260 * (1 - t);
  const escala = 0.82 + 0.18 * t;

  // idle contínuo (só depois de assentar, ~t≈1)
  const fase = frame - delay;
  const flut = idle ? Math.sin(fase / 34) * amplitudeIdle * t : 0;
  const microRot = idle ? Math.sin(fase / 48) * 1.3 * t : 0;

  return (
    <div
      style={{
        transform: `perspective(1200px) translateZ(${z}px) translateY(${flut}px) rotateY(${
          rotY + microRot
        }deg) scale(${escala})`,
        opacity: Math.min(1, t * 1.4),
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
