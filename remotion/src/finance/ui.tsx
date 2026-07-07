import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTE, AMARELO, LARANJA, BRANCO, CINZA_TEXTO, CARD_BG, CARD_BORDA } from "./tokens";

// Texto cinético 2D: fade + slide vertical (translateY, NUNCA Z/rotação).
export const Kinetico: React.FC<{
  children: React.ReactNode;
  atraso?: number;
  dy?: number;
  style?: React.CSSProperties;
}> = ({ children, atraso = 0, dy = 26, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - atraso, fps, durationInFrames: 18, config: { damping: 200 } });
  return (
    <div style={{ transform: `translateY(${interpolate(p, [0, 1], [dy, 0])}px)`, opacity: p, ...style }}>
      {children}
    </div>
  );
};

// Kicker dourado em caps espaçado ("MERCADO IMOBILIÁRIO · EPISÓDIO 132").
export const Kicker: React.FC<{ texto: string; atraso?: number; cor?: string }> = ({ texto, atraso = 0, cor = AMARELO }) => (
  <Kinetico atraso={atraso}>
    <span style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: cor, textTransform: "uppercase" }}>
      {texto}
    </span>
  </Kinetico>
);

// Manchete: linhas brancas com UMA palavra/linha em destaque + sublinhado.
export const Manchete: React.FC<{
  linhas: { texto: string; cor?: string; peso?: number; tamanho?: number }[];
  atrasoBase?: number;
  sublinhado?: string;
  larguraSublinhado?: number;
}> = ({ linhas, atrasoBase = 0, sublinhado = LARANJA, larguraSublinhado = 440 }) => (
  <div style={{ fontFamily: FONTE, lineHeight: 1.02 }}>
    {linhas.map((l, i) => (
      <Kinetico key={i} atraso={atrasoBase + i * 5}>
        <div
          style={{
            fontWeight: l.peso ?? 500,
            fontSize: l.tamanho ?? 108,
            color: l.cor ?? BRANCO,
            letterSpacing: -1,
          }}
        >
          {l.texto}
        </div>
      </Kinetico>
    ))}
    <Kinetico atraso={atrasoBase + linhas.length * 5}>
      <div style={{ width: larguraSublinhado, height: 6, background: sublinhado, borderRadius: 999, marginTop: 22 }} />
    </Kinetico>
  </div>
);

export const Subtitulo: React.FC<{ texto: string; atraso?: number; largura?: number }> = ({ texto, atraso = 0, largura = 620 }) => (
  <Kinetico atraso={atraso}>
    <div style={{ fontFamily: FONTE, fontWeight: 400, fontSize: 32, color: CINZA_TEXTO, maxWidth: largura, lineHeight: 1.3 }}>
      {texto}
    </div>
  </Kinetico>
);

// Contador cinético para números (ex.: +27%, 6,8%).
function useContador(alvo: number, atraso: number, dur = 26) {
  const frame = useCurrentFrame();
  return interpolate(frame, [atraso, atraso + dur], [0, alvo], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// Chip com "+" em quadrado outline + rótulo de 2 linhas.
export const Chip: React.FC<{ linhas: [string, string]; atraso?: number; cor?: string }> = ({ linhas, atraso = 0, cor = AMARELO }) => (
  <Kinetico atraso={atraso}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `2px solid ${cor}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: cor, fontFamily: FONTE, fontWeight: 700, fontSize: 28 }}>
        +
      </div>
      <div style={{ fontFamily: FONTE, fontWeight: 500, fontSize: 26, color: BRANCO, lineHeight: 1.15 }}>
        {linhas[0]}
        <br />
        {linhas[1]}
      </div>
    </div>
  </Kinetico>
);

// Card de dado: título caps cinza + número grande amarelo (contador) +
// mini-gráfico de barras (cinza subindo p/ 1 amarela).
export const CardDado: React.FC<{
  titulo: string;
  valorAlvo: number;
  sufixo: string;
  prefixo?: string;
  atraso?: number;
}> = ({ titulo, valorAlvo, sufixo, prefixo = "", atraso = 0 }) => {
  const v = useContador(valorAlvo, atraso + 8);
  const barras = [0.42, 0.52, 0.46, 0.62, 0.7, 1];
  const frame = useCurrentFrame();
  return (
    <Kinetico atraso={atraso} dy={40}>
      <div style={{ width: 620, background: CARD_BG, border: `2px solid ${CARD_BORDA}`, borderRadius: 26, padding: "38px 44px", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: CINZA_TEXTO, textTransform: "uppercase" }}>
          {titulo}
        </div>
        <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: 132, color: AMARELO, lineHeight: 1, marginTop: 10 }}>
          {prefixo}
          {Math.round(v)}
          {sufixo}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 130, marginTop: 26 }}>
          {barras.map((h, i) => {
            const cresce = interpolate(frame, [atraso + 12 + i * 4, atraso + 30 + i * 4], [0, h], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ flex: 1, height: `${cresce * 100}%`, background: i === barras.length - 1 ? AMARELO : "#2C3033", borderRadius: 10 }} />
            );
          })}
        </div>
      </div>
    </Kinetico>
  );
};

// Ícone % em outline (dois círculos + barra diagonal) — 2D SVG.
export const IconePercent: React.FC<{ tamanho?: number; cor?: string; atraso?: number }> = ({ tamanho = 240, cor = AMARELO, atraso = 0 }) => (
  <Kinetico atraso={atraso} dy={30}>
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" fill="none" stroke={cor} strokeWidth={5} strokeLinecap="round">
      <circle cx="30" cy="30" r="14" />
      <circle cx="70" cy="70" r="14" />
      <line x1="72" y1="24" x2="28" y2="76" />
    </svg>
  </Kinetico>
);

// Ícone "grade de apês" outline (quadrado com 2x3 pontos) — 2D SVG.
export const IconeGrade: React.FC<{ tamanho?: number; cor?: string; atraso?: number }> = ({ tamanho = 74, cor = LARANJA, atraso = 0 }) => (
  <Kinetico atraso={atraso}>
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" fill="none" stroke={cor} strokeWidth={2.4}>
      <rect x="12" y="6" width="24" height="36" rx="4" />
      {[16, 24, 32].map((y) => [19, 29].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill={cor} stroke="none" />))}
    </svg>
  </Kinetico>
);

// Botão CTA laranja (pílula).
export const BotaoCTA: React.FC<{ texto: string; atraso?: number }> = ({ texto, atraso = 0 }) => (
  <Kinetico atraso={atraso} dy={30}>
    <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: LARANJA, color: "#1A1206", fontFamily: FONTE, fontWeight: 700, fontSize: 30, letterSpacing: 1, padding: "22px 54px", borderRadius: 999, boxShadow: "0 18px 50px rgba(242,146,30,0.4)" }}>
      {texto} <span style={{ fontSize: 30 }}>&rarr;</span>
    </div>
  </Kinetico>
);
