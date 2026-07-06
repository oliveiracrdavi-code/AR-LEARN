import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_DESTAQUE } from "../cores";

// Contador numérico cinético (Seção 2.5): o número sobe visualmente de 0
// até o valor final ao longo de ~25 frames, formatado a cada frame como
// moeda/percentual. É uma das peças que mais atacam o "simples demais" —
// dado concreto animando = sensação de substância (padrão real do canal).
// Depois de atingir o alvo, fica estável.
export type FormatoContador = "moeda" | "percentual" | "numero" | "milhar";

function formatar(valor: number, formato: FormatoContador, prefixoSinal: boolean): string {
  const v = Math.round(valor);
  const sinal = prefixoSinal && v > 0 ? "+" : "";
  switch (formato) {
    case "moeda":
      return `R$ ${v.toLocaleString("pt-BR")}`;
    case "milhar":
      return `R$ ${v.toLocaleString("pt-BR")}k`;
    case "percentual":
      return `${sinal}${v}%`;
    default:
      return `${sinal}${v.toLocaleString("pt-BR")}`;
  }
}

export const ContadorCinetico: React.FC<{
  valorFinal: number;
  formato?: FormatoContador;
  prefixoSinal?: boolean; // "+" quando positivo (ex: +18%)
  delay?: number;
  duracao?: number;
  fontSize?: number;
  cor?: string;
  peso?: number;
  style?: React.CSSProperties;
}> = ({
  valorFinal,
  formato = "percentual",
  prefixoSinal = false,
  delay = 0,
  duracao = 25,
  fontSize = 44,
  cor = COR_DESTAQUE,
  peso = 800,
  style,
}) => {
  const frame = useCurrentFrame();
  const valorAtual = interpolate(frame, [delay, delay + duracao], [0, valorFinal], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <span
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize,
        fontWeight: peso,
        color: cor,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {formatar(valorAtual, formato, prefixoSinal)}
    </span>
  );
};
