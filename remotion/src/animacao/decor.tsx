import React from "react";
import { useCurrentFrame } from "remotion";
import { COR_DESTAQUE } from "../cores";

// Camadas decorativas compartilhadas por TODA cena (via FundoCena). Cada
// uma se move de forma contínua e sutil — garantem o "piso de movimento"
// (nenhum trecho fica quase-parado) e a densidade de composição, sem
// competir com o elemento principal. Minimalismo: baixa opacidade, ritmo
// lento, tudo na paleta ouro/escuro. São a camada MAIS DISTANTE da
// profundidade 3D (parallax lento).

// Grade de pontos que deriva devagar na diagonal (parallax de fundo).
// CSS puro (radial-gradient tileado) — leve e determinístico.
export const GradeDePontos: React.FC<{ opacidade?: number }> = ({
  opacidade = 0.12,
}) => {
  const frame = useCurrentFrame();
  const x = (frame * 0.25) % 54;
  const y = (frame * 0.16) % 54;
  return (
    <div
      style={{
        position: "absolute",
        inset: -60,
        backgroundImage: `radial-gradient(circle, rgba(223,160,44,${opacidade}) 1px, transparent 1.6px)`,
        backgroundSize: "54px 54px",
        backgroundPosition: `${x}px ${y}px`,
      }}
    />
  );
};

// Estrelinhas ✦ (desenhadas em SVG, não emoji — determinístico) que
// piscam e ORBITAM continuamente (cada uma num pequeno círculo próprio, a
// velocidade angular constante) — órbita circular nunca "estaciona" (ao
// contrário de um seno, que zera a velocidade nos extremos e deixa o
// trecho parecer parado). Distribuídas pela tela, discretas mas visíveis,
// dão o "glint tech" da referência e garantem movimento contínuo real.
const POS_SPARKLES = [
  { x: 0.12, y: 0.2, s: 16, r: 22, f: 50, ph: 0.0 },
  { x: 0.84, y: 0.26, s: 20, r: 26, f: 44, ph: 1.1 },
  { x: 0.7, y: 0.72, s: 14, r: 18, f: 58, ph: 2.0 },
  { x: 0.22, y: 0.7, s: 17, r: 24, f: 52, ph: 3.0 },
  { x: 0.5, y: 0.14, s: 13, r: 20, f: 46, ph: 0.7 },
  { x: 0.34, y: 0.4, s: 12, r: 16, f: 62, ph: 1.7 },
  { x: 0.9, y: 0.6, s: 15, r: 22, f: 48, ph: 2.5 },
  { x: 0.08, y: 0.52, s: 14, r: 20, f: 55, ph: 3.4 },
  { x: 0.62, y: 0.32, s: 11, r: 18, f: 60, ph: 4.0 },
  { x: 0.44, y: 0.8, s: 16, r: 24, f: 43, ph: 4.7 },
  { x: 0.78, y: 0.46, s: 13, r: 19, f: 57, ph: 5.3 },
];

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

export const Sparkles: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {POS_SPARKLES.map((p, i) => {
        // Órbita circular a velocidade constante (não estaciona).
        const ang = frame / (p.f / 6) + p.ph;
        const dx = Math.cos(ang) * p.r;
        const dy = Math.sin(ang) * p.r;
        // Cintila entre discreto e visível — piso alto (0,5) para o
        // brilho nunca cair abaixo do limiar de detecção do frame-diff.
        const pulso = 0.5 + (Math.sin(frame / 9 + p.ph * 2) * 0.5 + 0.5) * 0.4;
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

// Cantos decorativos (colchetes finos) nos 4 cantos — "moldura tech"
// discreta. Respiram de leve (opacidade) para nunca ficarem 100% estáticos.
export const CantosDecorativos: React.FC = () => {
  const frame = useCurrentFrame();
  const op = 0.3 + (Math.sin(frame / 50) * 0.5 + 0.5) * 0.25;
  const L = 54;
  const M = 56; // margem da borda
  const traco = `2px solid rgba(223,160,44,${op})`;
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
