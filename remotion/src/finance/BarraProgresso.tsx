import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AMARELO } from "./tokens";

// Barra de progresso inferior — enche 0→100% de forma CONTÍNUA nos 30s.
// Além de fiel ao preview, garante que nunca há intervalo de diff zero.
export const BarraProgresso: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = Math.min(1, frame / (durationInFrames - 1));
  return (
    <div style={{ position: "absolute", left: 110, right: 110, bottom: 54, height: 8 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.10)", borderRadius: 999 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${p * 100}%`,
          background: AMARELO,
          borderRadius: 999,
          boxShadow: `0 0 18px rgba(248,200,72,0.6)`,
        }}
      />
    </div>
  );
};
