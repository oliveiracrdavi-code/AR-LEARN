import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";

// Selo/badge de apoio (número, %, ou termo curto) que entra com spring e
// flutua de leve continuamente. Elemento SECUNDÁRIO da composição —
// menor e mais discreto que o principal, para dar densidade sem poluir
// (hierarquia visual clara). Use só quando fizer sentido com o que a
// cena narra.
export const SeloFlutuante: React.FC<{
  rotulo?: string;
  valor: string;
  delay?: number;
  cor?: string;
  style?: React.CSSProperties;
}> = ({ rotulo, valor, delay = 0, cor = COR_DESTAQUE, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - delay, fps, config: { damping: 13 } });
  const flut = Math.sin((frame - delay) / 30) * 6 * t;

  return (
    <div
      style={{
        transform: `translateY(${flut}px) scale(${0.6 + 0.4 * t})`,
        opacity: Math.min(1, t * 1.5),
        backgroundColor: "rgba(223,160,44,0.12)",
        border: `1.5px solid ${cor}`,
        borderRadius: 12,
        padding: rotulo ? "8px 16px" : "6px 14px",
        textAlign: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        backdropFilter: "blur(2px)",
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
