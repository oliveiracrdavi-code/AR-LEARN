import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTE, IVORY, OURO, OURO_ESCURO, LARANJA } from "../tokens";
import { IcAlerta } from "./iconesFinance";

// COMPONENTES DE UI (Diretrizes V3, categoria 15%): Glassmorphism é
// OBRIGATÓRIO — o fundo (70%) precisa ficar visível através do card
// (backdrop-filter: blur + fundo translúcido). Microinterações na entrada;
// depois o componente ESTABILIZA. Texto em Ivory, destaques em Ouro.

// Entrada padrão: spring 2D (fade + sobe) — reutilizada por todos.
function useEntrada(atraso: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - atraso, fps, durationInFrames: 18, config: { damping: 200 } });
}

// CARD CARBON (base glass): superfície translúcida + blur + borda ouro
// sutil. Todos os componentes funcionais montam em cima dele.
export const CardCarbon: React.FC<{
  children: React.ReactNode;
  atraso?: number;
  largura?: number;
  style?: React.CSSProperties;
}> = ({ children, atraso = 0, largura, style }) => {
  const p = useEntrada(atraso);
  return (
    <div
      style={{
        width: largura,
        background: "rgba(14,17,19,0.55)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1.5px solid rgba(212,175,55,0.45)`,
        borderRadius: 24,
        boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
        padding: "34px 40px",
        transform: `translateY(${interpolate(p, [0, 1], [36, 0])}px)`,
        opacity: p,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// SELO CIRCULAR DE PERCENTUAL: anel que se desenha (strokeDashoffset,
// princípio "Desenhar") + valor count-up (princípio "Crescer").
export const SeloPercentual: React.FC<{
  valorAlvo: number;
  rotulo: string;
  prefixo?: string;
  atraso?: number;
  tamanho?: number;
}> = ({ valorAlvo, rotulo, prefixo = "+", atraso = 0, tamanho = 220 }) => {
  const frame = useCurrentFrame();
  const p = useEntrada(atraso);
  const raio = 44;
  const circ = 2 * Math.PI * raio;
  const desenho = interpolate(frame, [atraso + 4, atraso + 30], [circ, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const v = interpolate(frame, [atraso + 8, atraso + 34], [0, valorAlvo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "relative", width: tamanho, height: tamanho, opacity: p }}>
      <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r={raio} stroke="rgba(212,175,55,0.22)" strokeWidth={3} />
        <circle
          cx="50"
          cy="50"
          r={raio}
          stroke={OURO}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={desenho}
          transform="rotate(-90 50 50)"
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
          fontFamily: FONTE,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: tamanho * 0.24, color: OURO, lineHeight: 1 }}>
          {prefixo}
          {Math.round(v)}%
        </div>
        <div style={{ fontWeight: 500, fontSize: tamanho * 0.075, color: IVORY, opacity: 0.75, marginTop: 6 }}>
          {rotulo}
        </div>
      </div>
    </div>
  );
};

// MINI-TABELA COMPARATIVA (ex.: Bairros A/B/C): linhas montam em cascata
// (princípio "Montar", stagger ~3f); linha destacada ganha ouro.
export const MiniTabela: React.FC<{
  titulo: string;
  linhas: { rotulo: string; valor: string; destaque?: boolean }[];
  atraso?: number;
  largura?: number;
}> = ({ titulo, linhas, atraso = 0, largura = 560 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <CardCarbon atraso={atraso} largura={largura} style={{ padding: "30px 34px" }}>
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 600,
          fontSize: 24,
          letterSpacing: 3,
          color: IVORY,
          opacity: 0.65,
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        {titulo}
      </div>
      {linhas.map((l, i) => {
        const pl = spring({ frame: frame - (atraso + 10 + i * 3), fps, durationInFrames: 14, config: { damping: 200 } });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderRadius: 14,
              marginBottom: 8,
              background: l.destaque ? "rgba(212,175,55,0.14)" : "rgba(255,255,255,0.03)",
              border: l.destaque ? `1.5px solid ${OURO}` : "1.5px solid rgba(255,255,255,0.06)",
              opacity: pl,
              transform: `translateX(${interpolate(pl, [0, 1], [24, 0])}px)`,
              fontFamily: FONTE,
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 26, color: IVORY }}>{l.rotulo}</span>
            <span style={{ fontWeight: 800, fontSize: 28, color: l.destaque ? OURO : IVORY }}>{l.valor}</span>
          </div>
        );
      })}
    </CardCarbon>
  );
};

// BARRAS COM DEGRADÊ OURO (frame "Card de Dado 1"): crescem com spring +
// count-up acompanhando (manual: degradê #D4AF37 -> #C6972F).
export const BarrasOuro: React.FC<{
  valores: number[];
  destaque?: number;
  atraso?: number;
  altura?: number;
}> = ({ valores, destaque = valores.length - 1, atraso = 0, altura = 150 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = Math.max(...valores);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: altura }}>
      {valores.map((v, i) => {
        const pb = spring({ frame: frame - (atraso + i * 4), fps, durationInFrames: 22, config: { damping: 14, stiffness: 130 } });
        const h = (v / max) * pb;
        const ativo = i === destaque;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(0.02, h) * 100}%`,
              borderRadius: 9,
              background: ativo
                ? `linear-gradient(180deg, ${OURO} 0%, ${OURO_ESCURO} 100%)`
                : "rgba(244,241,234,0.14)",
              boxShadow: ativo ? "0 0 22px rgba(212,175,55,0.45)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

// TOAST DE ERRO COMUM: pílula glass com ícone de alerta laranja — usada
// nos blocos "erros que o investidor comete".
export const ToastErro: React.FC<{ texto: string; atraso?: number }> = ({ texto, atraso = 0 }) => {
  const p = useEntrada(atraso);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        background: "rgba(14,17,19,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1.5px solid ${LARANJA}`,
        borderRadius: 16,
        padding: "16px 26px",
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)`,
        boxShadow: "0 14px 44px rgba(0,0,0,0.4)",
      }}
    >
      <IcAlerta tamanho={38} cor={LARANJA} />
      <span style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 26, color: IVORY }}>{texto}</span>
    </div>
  );
};
