import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTE_TITULO } from "./fontes";

// MANCHETE CINÉTICA GIGANTE (tipografia como parte do design). Cada palavra
// entra com deslize + fade escalonado e ASSENTA (sem tremer depois). Anton
// condensada, caixa alta, tamanho enorme — preenche a zona de texto.
export type LinhaManchete = { texto: string; cor: string };

const Palavra: React.FC<{ texto: string; indice: number; cor: string }> = ({ texto, indice, cor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const atraso = 6 + indice * 4;
  const p = spring({ frame: frame - atraso, fps, durationInFrames: 18, config: { damping: 200 } });
  const y = interpolate(p, [0, 1], [40, 0]);
  const op = interpolate(p, [0, 1], [0, 1]);
  return (
    <span
      style={{
        display: "inline-block",
        marginRight: "0.28em",
        transform: `translateY(${y}px)`,
        opacity: op,
        color: cor,
      }}
    >
      {texto}
    </span>
  );
};

export const MancheteCinetica: React.FC<{
  linhas: LinhaManchete[];
  fontSize?: number;
  indiceBase?: number;
}> = ({ linhas, fontSize = 150, indiceBase = 0 }) => {
  let contador = indiceBase;
  return (
    <div
      style={{
        fontFamily: `"${FONTE_TITULO}", Arial Narrow, sans-serif`,
        fontSize,
        lineHeight: 0.92,
        letterSpacing: "-0.01em",
        textTransform: "uppercase",
        // Sombra + contorno escuro fino garantem leitura da tipografia
        // mesmo quando ela sobrepõe a casa 3D amarela (evita amarelo-no-amarelo).
        textShadow: "0 6px 34px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.9)",
        WebkitTextStroke: "2px rgba(2,2,2,0.55)",
      }}
    >
      {linhas.map((linha, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap" }}>
          {linha.texto.split(" ").map((palavra, wi) => (
            <Palavra key={`${li}-${wi}`} texto={palavra} indice={contador++} cor={linha.cor} />
          ))}
        </div>
      ))}
    </div>
  );
};
