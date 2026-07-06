import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";
import { BarraAnimada } from "./BarraAnimada";
import { ContadorCinetico, FormatoContador } from "./ContadorCinetico";

// Gráfico de N barras (Seção 2.2 crescimento + 2.5 contador): cada barra
// cresce com Easing.out(cubic) e seu VALOR sobe via contador cinético, em
// sequência. Leque de profundidade (3.x): barra mais recente ~15px mais à
// frente. Rótulo de ano opcional (por padrão fica na trilha 5.4).

export type ItemBarra = {
  valor: number; // define a altura relativa E o alvo do contador
  formato?: FormatoContador;
  legenda: string; // ano (usado se mostrarLegenda)
};

export const GraficoBarras: React.FC<{
  itens: ItemBarra[];
  alturaMax: number;
  larguraBarra?: number;
  gap?: number;
  delayInicial?: number;
  passo?: number;
  mostrarLegenda?: boolean;
  cor?: string;
  style?: React.CSSProperties;
}> = ({
  itens,
  alturaMax,
  larguraBarra = 90,
  gap = 40,
  delayInicial = 10,
  passo = 14,
  mostrarLegenda = false,
  cor = COR_DESTAQUE,
  style,
}) => {
  const frame = useCurrentFrame();
  const maxValor = Math.max(1, ...itens.map((i) => i.valor));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap, transformStyle: "preserve-3d", ...style }}>
      {itens.map((item, i) => {
        const delay = delayInicial + i * passo;
        const alturaAlvo = (item.valor / maxValor) * alturaMax;
        const apareceRotulo = interpolate(frame, [delay, delay + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const zBarra = i * 15; // leque de profundidade
        return (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transform: `translateZ(${zBarra}px)`, transformStyle: "preserve-3d" }}
          >
            <div style={{ opacity: apareceRotulo }}>
              <ContadorCinetico
                valorFinal={item.valor}
                formato={item.formato ?? "milhar"}
                delay={delay}
                duracao={20}
                fontSize={26}
                cor={cor}
              />
            </div>
            <BarraAnimada alturaAlvo={alturaAlvo} largura={larguraBarra} delay={delay} cor={cor} />
            {mostrarLegenda ? (
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
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
