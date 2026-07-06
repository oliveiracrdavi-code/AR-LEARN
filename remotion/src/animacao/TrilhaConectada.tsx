import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";

// Recurso 5.4 — Trilha conectada (mini-timeline). 2D: linha entre nós
// desenhada via stroke-dashoffset, avançando conforme a narração menciona
// cada ponto; nós "acendem" (opacidade 0.4→1, escala 0.8→1) quando
// mencionados. 3D: nós na camada de apoio, sem profundidade individual
// (a trilha já comunica progressão). Usado em grafico_precos_anos.
export const TrilhaConectada: React.FC<{
  nos: string[];
  largura?: number;
  delayInicial?: number;
  passo?: number; // frames entre acender um nó e o próximo
  style?: React.CSSProperties;
}> = ({ nos, largura = 900, delayInicial = 10, passo = 14, style }) => {
  const frame = useCurrentFrame();
  const n = nos.length;
  const gap = largura / (n - 1);
  const alturaFim = delayInicial + (n - 1) * passo;
  // Linha desenha da esquerda pra direita acompanhando os nós.
  const avanco = interpolate(frame, [delayInicial, alturaFim], [0, largura], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width: largura, height: 70, ...style }}>
      {/* trilho base */}
      <div style={{ position: "absolute", top: 33, left: 0, width: largura, height: 3, background: "rgba(223,160,44,0.25)", borderRadius: 2 }} />
      {/* trilho preenchido (avança) */}
      <div style={{ position: "absolute", top: 33, left: 0, width: avanco, height: 3, background: COR_DESTAQUE, borderRadius: 2 }} />
      {nos.map((no, i) => {
        const x = i * gap;
        const inicio = delayInicial + i * passo;
        const acende = interpolate(frame, [inicio, inicio + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 33, transform: "translate(-50%, -50%)" }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: `3px solid ${COR_DESTAQUE}`,
                backgroundColor: COR_DESTAQUE,
                opacity: 0.4 + acende * 0.6,
                transform: `scale(${0.8 + acende * 0.2})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 22,
                left: "50%",
                transform: "translateX(-50%)",
                color: COR_TEXTO,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 18,
                opacity: 0.5 + acende * 0.5,
                whiteSpace: "nowrap",
              }}
            >
              {no}
            </div>
          </div>
        );
      })}
    </div>
  );
};
