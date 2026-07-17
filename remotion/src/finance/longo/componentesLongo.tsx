import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AMARELO, BRANCO, CARD_BG, CARD_BORDA, CINZA_TEXTO, FONTE, LARANJA } from "../tokens";
import { IconeFinance } from "../banco/iconesFinance";

// COMPONENTES DO VÍDEO LONGO — todos na paleta EXATA do clipe de 30s
// aprovado (tokens.ts: onyx #020202, amarelo #F8C848, laranja #F2921E,
// cards "vidro escuro" CARD_BG + borda CARD_BORDA). Nada de paleta nova.

// DONUT na linguagem do clipe: anel se desenha + % conta no centro.
export const DonutOuro: React.FC<{ pct: number; rotulo: string; atraso?: number; tamanho?: number }> = ({
  pct,
  rotulo,
  atraso = 0,
  tamanho = 230,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ent = spring({ frame: frame - atraso, fps, durationInFrames: 18, config: { damping: 200 } });
  const R = 40;
  const C = 2 * Math.PI * R;
  const alvo = C * (pct / 100);
  const prog = interpolate(frame, [atraso + 4, atraso + 34], [0, alvo], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = interpolate(frame, [atraso + 6, atraso + 34], [0, pct], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "relative", width: tamanho, height: tamanho, opacity: ent }}>
      <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r={R} stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
        <circle cx="50" cy="50" r={R} stroke={AMARELO} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${prog} ${C}`} transform="rotate(-90 50 50)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONTE }}>
        <div style={{ fontWeight: 800, fontSize: tamanho * 0.2, color: BRANCO, lineHeight: 1 }}>{Math.round(v)}%</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 10, textAlign: "center", fontFamily: FONTE, fontWeight: 500, fontSize: 22, color: CINZA_TEXTO }}>
        {rotulo}
      </div>
    </div>
  );
};

// FORMULA CARD no estilo do card do clipe (vidro escuro + borda fina).
export const FormulaCard: React.FC<{ atraso?: number; largura?: number }> = ({ atraso = 0, largura = 700 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ent = spring({ frame: frame - atraso, fps, durationInFrames: 18, config: { damping: 200 } });
  return (
    <div
      style={{
        width: largura,
        background: CARD_BG,
        border: `2px solid ${CARD_BORDA}`,
        borderRadius: 26,
        padding: "34px 42px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        opacity: ent,
        transform: `translateY(${interpolate(ent, [0, 1], [36, 0])}px)`,
        fontFamily: FONTE,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 24, letterSpacing: 3, color: CINZA_TEXTO, textTransform: "uppercase" }}>ROI real</div>
      <div style={{ fontWeight: 700, fontSize: 40, color: BRANCO, marginTop: 14, lineHeight: 1.4 }}>
        ROI = <span style={{ color: AMARELO }}>(aluguel &minus; custos)</span>
        <span style={{ color: CINZA_TEXTO }}> &divide; </span>
        <span style={{ color: LARANJA }}>capital investido</span>
      </div>
    </div>
  );
};

// BADGE de contexto (reforço do dado-chave): pílula fina com ícone.
export const BadgeContexto: React.FC<{ icone: string; texto: string; atraso?: number; cor?: string }> = ({
  icone,
  texto,
  atraso = 0,
  cor = LARANJA,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ent = spring({ frame: frame - atraso, fps, durationInFrames: 16, config: { damping: 200 } });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        border: `2px solid ${cor}`,
        borderRadius: 999,
        padding: "12px 26px",
        opacity: ent,
        transform: `translateX(${interpolate(ent, [0, 1], [-26, 0])}px)`,
      }}
    >
      <IconeFinance nome={icone} tamanho={34} cor={cor} />
      <span style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 24, color: BRANCO }}>{texto}</span>
    </div>
  );
};

// ÍCONE CONTEXTUAL com animações DISTINTAS por papel (regra do prompt:
// não repetir a mesma entrada em todos). Variantes: "desenhar" (traço via
// clip-path vertical), "pulsar" (escala 1x e para), "subir" (slide).
export const IconeAnimado: React.FC<{
  nome: string;
  variante: "desenhar" | "pulsar" | "subir";
  atraso?: number;
  tamanho?: number;
  cor?: string;
}> = ({ nome, variante, atraso = 0, tamanho = 120, cor = AMARELO }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - atraso, fps, durationInFrames: 22, config: { damping: variante === "pulsar" ? 11 : 200, stiffness: variante === "pulsar" ? 140 : undefined as unknown as number } });
  const estilo: React.CSSProperties =
    variante === "desenhar"
      ? { clipPath: `inset(0 ${interpolate(p, [0, 1], [100, 0])}% 0 0)`, opacity: Math.min(1, p * 2) }
      : variante === "pulsar"
        ? { transform: `scale(${interpolate(p, [0, 1], [0.5, 1])})`, opacity: Math.min(1, p * 1.6) }
        : { transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px)`, opacity: p };
  return (
    <div style={estilo}>
      <IconeFinance nome={nome} tamanho={tamanho} cor={cor} />
    </div>
  );
};

// LEGENDA CONTÍNUA sincronizada por seção: divide a narração em frases;
// cada frase ocupa janela proporcional ao seu tamanho dentro da seção.
// Off-white com palavras-chave «assim» em goldenrod (estilo do clipe).
export const LegendaSincronizada: React.FC<{ narracao: string; duracaoFrames: number }> = ({ narracao, duracaoFrames }) => {
  const frame = useCurrentFrame();
  const frases = narracao.split(/(?<=[.!?:])\s+/).filter(Boolean);
  const total = frases.reduce((s, f) => s + f.length, 0);
  let acc = 0;
  const janelas = frases.map((f) => {
    const ini = (acc / total) * duracaoFrames;
    acc += f.length;
    const fim = (acc / total) * duracaoFrames;
    return { f, ini, fim };
  });
  const atual = janelas.find((j) => frame >= j.ini && frame < j.fim) ?? janelas[janelas.length - 1];
  const op = interpolate(frame, [atual.ini, atual.ini + 8, atual.fim - 8, atual.fim], [0, 1, 1, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const partes = atual.f.split(/(«[^»]+»)/g);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 96, display: "flex", justifyContent: "center", padding: "0 180px" }}>
      <div style={{ fontFamily: FONTE, fontWeight: 500, fontSize: 32, lineHeight: 1.35, color: "#EDEBE6", textAlign: "center", opacity: op, textShadow: "0 4px 24px rgba(0,0,0,0.9)" }}>
        {partes.map((s, i) =>
          s.startsWith("«") ? (
            <span key={i} style={{ color: AMARELO, fontWeight: 700 }}>{s.slice(1, -1)}</span>
          ) : (
            <span key={i}>{s}</span>
          )
        )}
      </div>
    </div>
  );
};
