import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_TEXTO } from "../cores";

// Tipografia cinética (Seção 2.3): texto entra palavra a palavra (ou
// letra a letra), cada unidade com opacidade 0→1 + translateY +10→0 ao
// longo de ~10 frames, com delay = índice × stagger (4 frames padrão).
// Depois de montado, ESTÁVEL — sem respiro/oscilação contínua (regra da
// Seção 1: movimento só na entrada).
export const TextoCinetico: React.FC<{
  texto: string;
  modo?: "palavra" | "letra";
  fontSize?: number;
  cor?: string;
  peso?: number;
  stagger?: number; // frames entre cada unidade (2.3 = 4)
  delay?: number;
  duracaoEntrada?: number; // frames de cada entrada (2.3 = 10)
  lineHeight?: number;
  align?: React.CSSProperties["textAlign"];
  style?: React.CSSProperties;
}> = ({
  texto,
  modo = "palavra",
  fontSize = 34,
  cor = COR_TEXTO,
  peso = 500,
  stagger = 4,
  delay = 0,
  duracaoEntrada = 10,
  lineHeight = 1.4,
  align = "left",
  style,
}) => {
  const frame = useCurrentFrame();
  const unidades = modo === "letra" ? Array.from(texto) : texto.split(/(\s+)/);

  return (
    <div
      style={{
        fontSize,
        color: cor,
        fontWeight: peso,
        lineHeight,
        textAlign: align,
        fontFamily: "Arial, Helvetica, sans-serif",
        ...style,
      }}
    >
      {unidades.map((unidade, i) => {
        const ehEspaco = /^\s+$/.test(unidade);
        const inicio = delay + i * stagger;
        const progresso = interpolate(
          frame,
          [inicio, inicio + duracaoEntrada],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const y = (1 - progresso) * 10; // +10px → 0
        if (ehEspaco) return <span key={i}>{unidade}</span>;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: progresso,
              transform: `translateY(${y}px)`,
              whiteSpace: "pre",
            }}
          >
            {unidade}
          </span>
        );
      })}
    </div>
  );
};
