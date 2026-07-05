import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";
import { BarraAnimada } from "./BarraAnimada";

// Gráfico de N barras: cada barra E seu rótulo (valor no topo + legenda
// no eixo) aparecem EM SEQUÊNCIA (delays escalonados), nunca todos de uma
// vez. O rótulo de valor sobe/fade-in junto da barra.

export type ItemBarra = {
  valor: number; // valor bruto (define a altura relativa)
  rotuloValor: string; // texto exibido no topo (ex.: "R$ 380k", "+18%")
  legenda: string; // texto do eixo x (ex.: "2021")
};

export const GraficoBarras: React.FC<{
  itens: ItemBarra[];
  alturaMax: number; // px da barra mais alta
  larguraBarra?: number;
  gap?: number;
  delayInicial?: number;
  passo?: number; // frames entre uma barra e a próxima
  cor?: string;
  style?: React.CSSProperties;
}> = ({
  itens,
  alturaMax,
  larguraBarra = 90,
  gap = 40,
  delayInicial = 10,
  passo = 14,
  cor = COR_DESTAQUE,
  style,
}) => {
  const frame = useCurrentFrame();
  const maxValor = Math.max(1, ...itens.map((i) => i.valor)); // guarda /0

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {itens.map((item, i) => {
        const delay = delayInicial + i * passo;
        const alturaAlvo = (item.valor / maxValor) * alturaMax;
        const apareceRotulo = interpolate(
          frame,
          [delay, delay + 12],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        // Leque de profundidade: barras mais recentes (à direita/mais
        // altas) ficam um pouco mais À FRENTE no eixo Z (3.4).
        const zBarra = i * 15;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              transform: `translateZ(${zBarra}px)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 26,
                fontWeight: 700,
                color: cor,
                opacity: apareceRotulo,
                transform: `translateY(${(1 - apareceRotulo) * 14}px)`,
              }}
            >
              {item.rotuloValor}
            </div>
            <BarraAnimada
              alturaAlvo={alturaAlvo}
              largura={larguraBarra}
              delay={delay}
              cor={cor}
            />
            {/* Rótulo do ano entra com leve rotateX (~10°), sequencial. */}
            <div
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 22,
                color: COR_TEXTO,
                opacity: apareceRotulo,
                borderTop: `2px solid ${cor}`,
                paddingTop: 8,
                width: larguraBarra,
                textAlign: "center",
                transform: `perspective(800px) rotateX(${(1 - apareceRotulo) * 10}deg)`,
              }}
            >
              {item.legenda}
            </div>
          </div>
        );
      })}
    </div>
  );
};
