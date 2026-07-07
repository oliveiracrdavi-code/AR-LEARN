import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ONYX, AMARELO, GRID_COR } from "./tokens";

// FUNDO PREMIUM FINANCE (2D PURO): onyx + grid dourado em perspectiva
// (desenhado com math 2D, SEM CSS 3D) + starfield + glow radial âmbar.
// Deriva/pulsa de leve para não congelar (o fundo é contínuo nos 30s).
// glowX/glowY: 0..1 posição relativa do glow (varia por bloco).
const LARGURA = 1920;
const ALTURA = 1080;

// PRNG determinístico p/ o starfield (mesmas estrelas todo render).
function estrelas(n: number) {
  let s = 20260707;
  const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return Array.from({ length: n }, () => ({ x: r() * LARGURA, y: r() * ALTURA, o: 0.25 + r() * 0.6, f: r() * 6.28 }));
}

export const FundoFinance: React.FC<{ glowX?: number; glowY?: number }> = ({ glowX = 0.72, glowY = 0.28 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const dots = useMemo(() => estrelas(130), []);
  const drift = (frame * 0.35) % 96; // scroll lento das horizontais
  const pulso = interpolate(Math.sin(frame / 40), [-1, 1], [0.85, 1.15]);

  // Grid em perspectiva: vanishing point alto-central; verticais leque,
  // horizontais adensando pro topo. Tudo 2D (só x,y).
  const vpx = LARGURA / 2;
  const vpy = 300;
  const verticais: [number, number, number, number][] = [];
  for (let i = -8; i <= 24; i++) {
    const x = (i / 16) * LARGURA;
    const topX = vpx + (x - vpx) * 0.34;
    verticais.push([x, ALTURA, topX, 0]);
  }
  const horizontais: number[] = [];
  const N = 16;
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const y = vpy + (ALTURA - vpy) * Math.pow(t, 1.5);
    horizontais.push(((y + drift) % (ALTURA - vpy)) + vpy);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: ONYX, overflow: "hidden" }}>
      {/* Glow radial dourado */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(52% 52% at ${glowX * 100}% ${glowY * 100}%, rgba(248,200,72,${0.26 * pulso}) 0%, rgba(242,146,30,0.09) 40%, rgba(2,2,2,0) 72%)`,
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${LARGURA} ${ALTURA}`} style={{ position: "absolute", inset: 0 }}>
        {verticais.map(([x1, y1, x2, y2], i) => (
          <line key={`v${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GRID_COR} strokeWidth={1} />
        ))}
        {horizontais.map((y, i) => (
          <line key={`h${i}`} x1={0} y1={y} x2={LARGURA} y2={y} stroke={GRID_COR} strokeWidth={1} />
        ))}
        {dots.map((d, i) => (
          <circle
            key={`s${i}`}
            cx={d.x}
            cy={d.y}
            r={1.3}
            fill="#FFFFFF"
            opacity={d.o * interpolate(Math.sin(frame / 18 + d.f), [-1, 1], [0.35, 1])}
          />
        ))}
      </svg>
      {/* Vinheta sutil nas bordas */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 100% at 50% 50%, rgba(2,2,2,0) 55%, rgba(2,2,2,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};
