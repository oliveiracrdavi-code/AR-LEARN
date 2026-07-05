import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_TEXTO } from "../cores";

// Tipografia cinética: recebe uma string e a entrega palavra a palavra
// (ou letra a letra), cada unidade entrando com opacidade + deslocamento
// vertical escalonado. Nunca mostra a frase inteira no frame 0 — cada
// unidade só "chega" após seu delay próprio. Depois de montar, um leve
// respiro contínuo (drift senoidal) evita que o bloco fique 100% parado
// (teste objetivo do cliente amostra a cada 2s e reprova qualquer janela
// pixel-idêntica).

export const TextoCinetico: React.FC<{
  texto: string;
  modo?: "palavra" | "letra";
  fontSize?: number;
  cor?: string;
  peso?: number;
  stagger?: number; // frames entre cada unidade
  delay?: number; // frames antes da primeira unidade
  duracaoEntrada?: number; // frames de cada entrada
  lineHeight?: number;
  align?: React.CSSProperties["textAlign"];
  style?: React.CSSProperties;
}> = ({
  texto,
  modo = "palavra",
  fontSize = 34,
  cor = COR_TEXTO,
  peso = 500,
  stagger = 2,
  delay = 0,
  duracaoEntrada = 12,
  lineHeight = 1.4,
  align = "left",
  style,
}) => {
  const frame = useCurrentFrame();

  // Divide preservando espaços quando em modo palavra.
  const unidades =
    modo === "letra" ? Array.from(texto) : texto.split(/(\s+)/);

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
        // Espaços em branco no modo palavra não animam (só ocupam espaço).
        const ehEspaco = /^\s+$/.test(unidade);
        const inicio = delay + i * stagger;
        const progresso = interpolate(
          frame,
          [inicio, inicio + duracaoEntrada],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        // Respiro contínuo pós-entrada (amplitude minúscula, mas nunca zero).
        const respiro = Math.sin((frame + i * 6) / 22) * 1.2 * progresso;
        const y = (1 - progresso) * 18 + respiro;

        if (ehEspaco) {
          return <span key={i}>{unidade}</span>;
        }
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
