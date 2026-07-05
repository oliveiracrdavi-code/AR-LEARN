import React from "react";
import { useCurrentFrame } from "remotion";
import { COR_DESTAQUE } from "../cores";

// Decoração compartilhada (v3): SEM grade de linhas nem grade de pontos
// (removidas). Só partículas discretas ✦ (sutis, único movimento
// contínuo permitido — apenas para a imagem não ficar "morta") e uma
// moldura de cantos ESTÁTICA. Nada que compita com o elemento principal.

// Estrelinha ✦ desenhada em SVG (não emoji — determinístico em qualquer
// ambiente de render).
const Estrela: React.FC<{ tamanho: number; cor: string; opacidade: number }> = ({
  tamanho,
  cor,
  opacidade,
}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ opacity: opacidade }}>
    <path
      d="M12 0 C12.6 7 13 8 24 12 C13 16 12.6 17 12 24 C11.4 17 11 16 0 12 C11 8 11.4 7 12 0 Z"
      fill={cor}
    />
  </svg>
);

// Poucas partículas, pequenas, orbitando um raio minúsculo a velocidade
// constante (nunca "estaciona" → nunca zera o frame-diff) + cintilar
// suave. Baixa amplitude: é vida de fundo, não balanço.
const POS_SPARKLES = [
  { x: 0.14, y: 0.22, s: 12, r: 8, f: 66, ph: 0.0 },
  { x: 0.85, y: 0.28, s: 14, r: 9, f: 58, ph: 1.2 },
  { x: 0.72, y: 0.74, s: 11, r: 7, f: 72, ph: 2.1 },
  { x: 0.24, y: 0.72, s: 12, r: 8, f: 63, ph: 3.1 },
  { x: 0.9, y: 0.6, s: 10, r: 7, f: 69, ph: 2.6 },
  { x: 0.1, y: 0.55, s: 11, r: 8, f: 61, ph: 3.6 },
  { x: 0.5, y: 0.13, s: 10, r: 7, f: 74, ph: 0.8 },
  { x: 0.6, y: 0.84, s: 11, r: 8, f: 56, ph: 4.4 },
];

export const Sparkles: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {POS_SPARKLES.map((p, i) => {
        const ang = frame / (p.f / 6) + p.ph;
        const dx = Math.cos(ang) * p.r;
        const dy = Math.sin(ang) * p.r;
        const pulso = 0.35 + (Math.sin(frame / 11 + p.ph * 2) * 0.5 + 0.5) * 0.4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              transform: `translate(${dx}px, ${dy}px)`,
            }}
          >
            <Estrela tamanho={p.s} cor={COR_DESTAQUE} opacidade={pulso} />
          </div>
        );
      })}
    </>
  );
};

// Cantos decorativos (colchetes finos) — ESTÁTICOS, discretos.
export const CantosDecorativos: React.FC = () => {
  const L = 54;
  const M = 56;
  const traco = `2px solid rgba(223,160,44,0.4)`;
  const cantos: React.CSSProperties[] = [
    { top: M, left: M, borderTop: traco, borderLeft: traco },
    { top: M, right: M, borderTop: traco, borderRight: traco },
    { bottom: M, left: M, borderBottom: traco, borderLeft: traco },
    { bottom: M, right: M, borderBottom: traco, borderRight: traco },
  ];
  return (
    <>
      {cantos.map((c, i) => (
        <div key={i} style={{ position: "absolute", width: L, height: L, ...c }} />
      ))}
    </>
  );
};
