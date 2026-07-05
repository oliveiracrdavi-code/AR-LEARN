import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Entrada de elemento COM PROFUNDIDADE (v3): o elemento "vem de longe"
// (translateZ) girando de leve num ÚNICO eixo (rotateY OU rotateX, 8-20°)
// e clareando, até se ACOMODAR — e então fica ESTÁVEL (sem balanço/idle
// contínuo). Opcional: um glint (brilho) de relance UMA vez na entrada, e
// uma sombra suave sob o elemento (profundidade). A "vida" contínua da
// cena vem só dos sparkles de fundo, não daqui.
export const Entrada3D: React.FC<{
  children: React.ReactNode;
  delay?: number;
  eixo?: "y" | "x"; // rotateY (padrão) ou rotateX
  angulo?: number; // graus na entrada (8-20)
  distanciaZ?: number; // quão "longe" começa
  duracao?: number; // frames da entrada (mais longa = mais gradual)
  glint?: boolean; // brilho de relance 1x
  sombra?: boolean; // sombra suave sob o elemento
  style?: React.CSSProperties;
}> = ({
  children,
  delay = 0,
  eixo = "y",
  angulo = 14,
  distanciaZ = 320,
  duracao = 26,
  glint = false,
  sombra = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Spring com damping moderado, duração explícita → entrada gradual e
  // suave que assenta em t=1 e PARA (não oscila depois).
  const t = spring({
    frame: frame - delay,
    fps,
    durationInFrames: duracao,
    config: { damping: 200 },
  });

  const rot = angulo * (1 - t);
  const z = -distanciaZ * (1 - t);
  const rotStr = eixo === "y" ? `rotateY(${rot}deg)` : `rotateX(${rot}deg)`;
  const opacity = Math.min(1, t * 1.3);

  // Glint: uma passada de brilho logo depois de assentar, só 1 vez.
  const glintOp = glint
    ? interpolate(frame - delay, [duracao * 0.6, duracao * 0.9, duracao * 1.3], [0, 0.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        position: "relative",
        transform: `perspective(1400px) translateZ(${z}px) ${rotStr}`,
        opacity,
        transformStyle: "preserve-3d",
        filter: sombra ? "drop-shadow(0 18px 26px rgba(0,0,0,0.45))" : undefined,
        ...style,
      }}
    >
      {children}
      {glint ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            pointerEvents: "none",
            background:
              "linear-gradient(115deg, rgba(255,255,255,0) 40%, rgba(255,240,200,0.55) 50%, rgba(255,255,255,0) 60%)",
            opacity: glintOp,
          }}
        />
      ) : null}
    </div>
  );
};
