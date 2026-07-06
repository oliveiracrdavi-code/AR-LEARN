import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ContadorCinetico, FormatoContador } from "./ContadorCinetico";
import { COR_DESTAQUE, COR_TEXTO, COR_FUNDO_CARTAO } from "../cores";

// Recurso 5.1 — Selo/Badge circular de apoio: contorno CIRCULAR desenhado
// via stroke-dashoffset (Seção 2.1) + número interno via contador cinético
// (Seção 2.5). Entra com rotateY -15°→0° (camada de apoio, Seção 4.2).
// Depois, estável. Usado em valorizacao_casa, financiamento_calculadora,
// localizacao_mapa.
export const SeloBadge: React.FC<{
  valorFinal: number;
  formato?: FormatoContador;
  prefixoSinal?: boolean;
  rotulo?: string;
  delay?: number;
  tamanho?: number;
  style?: React.CSSProperties;
}> = ({
  valorFinal,
  formato = "percentual",
  prefixoSinal = true,
  rotulo,
  delay = 0,
  tamanho = 150,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const r = tamanho / 2 - 6;
  const circ = 2 * Math.PI * r;
  // Contorno se desenha (2.1): dashoffset de circ → 0 em ~20 frames.
  const desenho = interpolate(frame, [delay, delay + 20], [circ, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Entrada 3D: rotateY -15°→0° + escala spring (2.4: damping 12).
  const t = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 120 } });
  const rotY = -15 * (1 - t);
  const escala = 0.7 + 0.3 * t;

  return (
    <div
      style={{
        width: tamanho,
        height: tamanho,
        position: "relative",
        transform: `perspective(1000px) rotateY(${rotY}deg) scale(${escala})`,
        opacity: Math.min(1, t * 1.4),
        filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.45))",
        ...style,
      }}
    >
      <svg width={tamanho} height={tamanho} style={{ position: "absolute", inset: 0 }}>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill={COR_FUNDO_CARTAO} opacity={0.5} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={COR_DESTAQUE}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={desenho}
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <ContadorCinetico
          valorFinal={valorFinal}
          formato={formato}
          prefixoSinal={prefixoSinal}
          delay={delay + 12}
          fontSize={tamanho * 0.24}
        />
        {rotulo ? (
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: tamanho * 0.1,
              color: COR_TEXTO,
              opacity: 0.7,
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            {rotulo}
          </div>
        ) : null}
      </div>
    </div>
  );
};
