import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR_DESTAQUE, COR_TEXTO, COR_FUNDO_CARTAO } from "../cores";
import { ContadorCinetico } from "./ContadorCinetico";

// Recurso 5.2 — Mini-grid comparativo. 2D: cada item com spring de escala
// + tipografia cinética no rótulo. 3D: cada item numa profundidade Z
// levemente diferente entre si (±20px), entrada sequencial (delay ~4f).
// Usado em oferta_demanda_balanca (comparação Oferta x Demanda) — SEM
// silhueta humana: quantidades viram barras/blocos + contador.
export type ItemGrid = {
  rotulo: string;
  valor: number; // quantidade relativa (define nº de blocos e o contador)
  destaque?: boolean;
};

export const MiniGrid: React.FC<{
  itens: ItemGrid[];
  delayInicial?: number;
  style?: React.CSSProperties;
}> = ({ itens, delayInicial = 6, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap: 60, transformStyle: "preserve-3d", ...style }}>
      {itens.map((item, i) => {
        const delay = delayInicial + i * 8;
        const t = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 120 } });
        const z = (i % 2 === 0 ? 20 : -20); // profundidades levemente diferentes
        const blocos = Math.max(1, Math.round(item.valor));
        return (
          <div
            key={i}
            style={{
              transform: `translateZ(${z}px) scale(${0.7 + 0.3 * t})`,
              opacity: Math.min(1, t * 1.4),
              backgroundColor: COR_FUNDO_CARTAO,
              border: `2px solid ${item.destaque ? COR_DESTAQUE : "rgba(223,160,44,0.4)"}`,
              borderRadius: 16,
              padding: "22px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              minWidth: 220,
              boxShadow: item.destaque ? "0 0 34px rgba(223,160,44,0.35)" : "0 10px 20px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ color: COR_DESTAQUE, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
              {item.rotulo}
            </div>
            {/* Blocos empilhados representando a quantidade (sem pessoa). */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 22px)", gap: 6, justifyContent: "center" }}>
              {Array.from({ length: blocos }).map((_, k) => {
                const apareceBloco = spring({
                  frame: frame - delay - 6 - k * 2,
                  fps,
                  config: { damping: 14, stiffness: 120 },
                });
                return (
                  <div
                    key={k}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      backgroundColor: COR_DESTAQUE,
                      opacity: 0.35 + 0.65 * apareceBloco,
                      transform: `scale(${0.4 + 0.6 * apareceBloco})`,
                    }}
                  />
                );
              })}
            </div>
            <ContadorCinetico valorFinal={item.valor} formato="numero" delay={delay + 8} fontSize={30} cor={COR_TEXTO} />
          </div>
        );
      })}
    </div>
  );
};
