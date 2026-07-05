import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR_DESTAQUE } from "../cores";

// Uma barra cuja altura cresce de 0 → alvo via spring-ease, com um leve
// "respiro" contínuo no topo depois de crescer, para nunca ficar 100%
// parada. Usada isoladamente ou dentro de GraficoBarras.

export const BarraAnimada: React.FC<{
  alturaAlvo: number; // px (altura final)
  largura: number;
  delay?: number;
  cor?: string;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ alturaAlvo, largura, delay = 0, cor = COR_DESTAQUE, radius = 8, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progresso = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 110 },
  });
  // Clamp defensivo: spring pode passar de 1 momentaneamente.
  const p = interpolate(progresso, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const respiro = Math.sin(frame / 20) * 2 * p; // ondinha só depois de crescer
  const altura = Math.max(0, alturaAlvo * p + respiro);

  return (
    <div
      style={{
        width: largura,
        height: altura,
        backgroundColor: cor,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        alignSelf: "flex-end",
        ...style,
      }}
    />
  );
};
