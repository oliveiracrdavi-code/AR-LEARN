import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR_DESTAQUE, COR_TEXTO, COR_FUNDO_CARTAO } from "../cores";

// Recurso 5.3 — Chip numerado de sequência ("1 de 4"). 2D: spring de
// escala na entrada, estático depois. 3D: camada de apoio, posição fixa
// no canto (não se move ao longo da cena). Usado em ciclo, alerta,
// checklist para marcar progresso.
export const ChipNumerado: React.FC<{
  atual: number;
  total: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ atual, total, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 120 } });
  return (
    <div
      style={{
        transform: `scale(${0.7 + 0.3 * t})`,
        opacity: Math.min(1, t * 1.4),
        backgroundColor: COR_FUNDO_CARTAO,
        border: `2px solid ${COR_DESTAQUE}`,
        borderRadius: 999,
        padding: "8px 20px",
        fontFamily: "Arial, Helvetica, sans-serif",
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        boxShadow: "0 8px 16px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      <span style={{ color: COR_DESTAQUE, fontSize: 30, fontWeight: 800 }}>{atual}</span>
      <span style={{ color: COR_TEXTO, opacity: 0.65, fontSize: 18 }}>de {total}</span>
    </div>
  );
};
