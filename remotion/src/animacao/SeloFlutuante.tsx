import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";

// Selo/badge de apoio (número, %, termo curto). v3: entra com escala +
// leve profundidade (translateZ) e ACOMODA — depois ESTÁVEL (sem
// flutuação contínua). Elemento SECUNDÁRIO: menor e discreto, hierarquia
// clara sob o principal. (Nome mantido por compatibilidade de import.)
export const SeloFlutuante: React.FC<{
  rotulo?: string;
  valor: string;
  delay?: number;
  cor?: string;
  style?: React.CSSProperties;
}> = ({ rotulo, valor, delay = 0, cor = COR_DESTAQUE, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({
    frame: frame - delay,
    fps,
    durationInFrames: 20,
    config: { damping: 200 },
  });
  const z = -120 * (1 - t);

  return (
    <div
      style={{
        transform: `perspective(1200px) translateZ(${z}px) scale(${0.7 + 0.3 * t})`,
        opacity: Math.min(1, t * 1.3),
        backgroundColor: "rgba(223,160,44,0.12)",
        border: `1.5px solid ${cor}`,
        borderRadius: 12,
        padding: rotulo ? "8px 16px" : "6px 14px",
        textAlign: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxShadow: "0 10px 20px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      {rotulo ? (
        <div style={{ fontSize: 15, color: COR_TEXTO, opacity: 0.7, letterSpacing: 1 }}>
          {rotulo}
        </div>
      ) : null}
      <div style={{ fontSize: 30, fontWeight: 800, color: cor }}>{valor}</div>
    </div>
  );
};
