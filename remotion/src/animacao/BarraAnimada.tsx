import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COR_DESTAQUE } from "../cores";

// Uma barra cuja altura cresce de 0 → alvo via interpolate com
// Easing.out(cubic) (Seção 2.2 — nunca linear, desacelera no final =
// "assenta"). Depois de crescer, ESTÁVEL (sem respiro contínuo — regra da
// Seção 1). Usada dentro de GraficoBarras.

export const BarraAnimada: React.FC<{
  alturaAlvo: number; // px (altura final)
  largura: number;
  delay?: number;
  duracao?: number;
  cor?: string;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ alturaAlvo, largura, delay = 0, duracao = 20, cor = COR_DESTAQUE, radius = 8, style }) => {
  const frame = useCurrentFrame();

  const altura = interpolate(frame, [delay, delay + duracao], [0, alturaAlvo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

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
