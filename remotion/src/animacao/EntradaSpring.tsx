import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// Primitiva de entrada: envelopa qualquer children e faz eles "montarem"
// com escala + opacidade via spring() (e um deslocamento opcional na
// direção `from`). Nada aparece pronto no frame 0 — o spring parte de 0.
// `delay` desloca o início da animação (em frames) para permitir entradas
// escalonadas (uma coisa depois da outra).

type Direcao = "baixo" | "cima" | "esquerda" | "direita" | "nenhuma";

export const EntradaSpring: React.FC<{
  children: React.ReactNode;
  delay?: number;
  from?: Direcao;
  distancia?: number; // px de deslocamento inicial
  escalaInicial?: number; // escala no frame de partida
  damping?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  delay = 0,
  from = "baixo",
  distancia = 60,
  escalaInicial = 0.7,
  damping = 14,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // spring de 0 → 1. Subtrair o delay atrasa o disparo sem "pular" estado.
  const progresso = spring({
    frame: frame - delay,
    fps,
    config: { damping, mass: 0.9, stiffness: 120 },
  });

  const escala = escalaInicial + (1 - escalaInicial) * progresso;
  const desloc = (1 - progresso) * distancia;

  let translateX = 0;
  let translateY = 0;
  if (from === "baixo") translateY = desloc;
  else if (from === "cima") translateY = -desloc;
  else if (from === "esquerda") translateX = -desloc;
  else if (from === "direita") translateX = desloc;

  return (
    <div
      style={{
        opacity: progresso,
        transform: `translate(${translateX}px, ${translateY}px) scale(${escala})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
