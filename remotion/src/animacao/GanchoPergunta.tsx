import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_DESTAQUE } from "../cores";
import { TextoCinetico } from "./TextoCinetico";

// Recurso 5.7 — Gancho de pergunta provocativa. 2D: tipografia cinética
// entra, permanece ~1,5s, sai (opacidade→0 + leve translateY para cima,
// "sobe e desaparece") ANTES do conteúdo principal da cena entrar.
// Camada de texto (mais frontal). Usado na abertura de 2-3 blocos-chave —
// replica o padrão real do canal (pergunta provocativa + número concreto).
export const GanchoPergunta: React.FC<{
  texto: string;
  delay?: number;
  permanencia?: number; // frames que fica na tela (padrão ~45 = 1,5s)
  style?: React.CSSProperties;
}> = ({ texto, delay = 4, permanencia = 45, style }) => {
  const frame = useCurrentFrame();
  const fimEntrada = delay + 16;
  const inicioSaida = fimEntrada + permanencia;
  const entra = interpolate(frame, [delay, fimEntrada], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sai = interpolate(frame, [inicioSaida, inicioSaida + 14], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vis = Math.min(entra, sai);
  const y = -(1 - sai) * 30; // sobe ao sair

  if (vis <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 180px",
        transform: `translateY(${y}px)`,
        opacity: vis,
        ...style,
      }}
    >
      <TextoCinetico texto={texto} fontSize={48} peso={700} align="center" cor={COR_DESTAQUE} delay={delay} lineHeight={1.4} />
    </div>
  );
};
