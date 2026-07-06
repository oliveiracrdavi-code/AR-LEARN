import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_DESTAQUE } from "../cores";

// Efeito "sendo desenhado": recebe um path SVG (ou vários) e anima o
// stroke-dashoffset de pathLength → 0 via interpolate. Como não dá para
// medir getTotalLength de forma confiável no ambiente de render headless,
// passamos o comprimento explicitamente (`comprimento`) e usamos
// strokeDasharray/strokeDashoffset. Fill fica em `none` (line-art puro).
//
// Guarda contra pathLength 0 (divisão/NaN): se comprimento <= 0, cai num
// fallback seguro (1) para não gerar dashoffset inválido.

type PathSpec = {
  d: string;
  comprimento?: number; // comprimento aproximado do traço, em unidades SVG
};

export const LineArtDraw: React.FC<{
  paths: PathSpec[] | string;
  comprimentoPadrao?: number;
  viewBox?: string;
  width?: number | string;
  height?: number | string;
  cor?: string;
  strokeWidth?: number;
  delay?: number; // frames antes de começar a desenhar
  duracao?: number; // frames para completar o traço
  escalonar?: boolean; // se true, cada path começa após o anterior
  passoEscalonar?: number; // frames de defasagem entre partes (2.1: 5-8)
  style?: React.CSSProperties;
  children?: React.ReactNode; // conteúdo SVG extra (círculos, etc.)
}> = ({
  paths,
  comprimentoPadrao = 1000,
  viewBox = "0 0 100 100",
  width = "100%",
  height = "100%",
  cor = COR_DESTAQUE,
  strokeWidth = 2,
  delay = 0,
  duracao = 45,
  escalonar = true,
  passoEscalonar,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const lista: PathSpec[] =
    typeof paths === "string" ? [{ d: paths }] : paths;
  const passo = passoEscalonar ?? duracao;

  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={height}
      style={{ overflow: "visible", ...style }}
    >
      {lista.map((p, i) => {
        const comp = Math.max(1, p.comprimento ?? comprimentoPadrao); // guarda NaN/0
        const inicio = delay + (escalonar ? i * passo : 0);
        const offset = interpolate(
          frame,
          [inicio, inicio + duracao],
          [comp, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={cor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={comp}
            strokeDashoffset={offset}
          />
        );
      })}
      {children}
    </svg>
  );
};
