import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FundoFinance } from "../FundoFinance";

// CAMADA DE FUNDO — 70% da composição (Regra de Ouro do Banco de Ativos).
// Estética "Ouro e Concreto": imagem temática ESCURA, desfocada e rica em
// textura, SEM PESSOAS (regra Humano Zero). A imagem nunca fica parada
// (Combate à Tela Vazia): Ken Burns lentíssimo (scale + drift) mantém o
// quadro vivo. Um scrim de onyx garante a zona de leitura do texto Ivory.
//
// As imagens vivem em public/imagens/<arquivo> e são catalogadas no
// manifesto (manifesto.ts). Sem imagem para o conceito => fallback
// procedural (FundoFinance: grid dourado + starfield), NUNCA tela vazia.
export const FundoImagem: React.FC<{
  arquivo?: string; // relativo a public/ (ex.: "imagens/skyline-noturno.jpg")
  escurecer?: number; // 0..1 força do escurecimento global
  desfoque?: number; // px de blur (manual pede fundo desfocado)
  scrimLado?: "esquerda" | "centro" | "nenhum";
}> = ({ arquivo, escurecer = 0.62, desfoque = 6, scrimLado = "esquerda" }) => {
  const frame = useCurrentFrame();
  // Ken Burns: 1.08 -> 1.16 ao longo de ~40s, com drift diagonal sutil.
  const escala = 1.08 + (frame / 1200) * 0.08;
  const dx = interpolate(Math.sin(frame / 300), [-1, 1], [-12, 12]);
  const dy = interpolate(Math.cos(frame / 340), [-1, 1], [-8, 8]);

  if (!arquivo) {
    return <FundoFinance />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0F14", overflow: "hidden" }}>
      <Img
        src={staticFile(arquivo)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${escala}) translate(${dx}px, ${dy}px)`,
          filter: `blur(${desfoque}px) brightness(${1 - escurecer + 0.38}) saturate(0.9)`,
        }}
      />
      {/* Tonalização ouro-sobre-onyx para unificar qualquer foto à paleta */}
      <AbsoluteFill style={{ background: "rgba(11,15,20,0.45)" }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(60% 60% at 70% 30%, rgba(212,175,55,0.10) 0%, rgba(11,15,20,0) 70%)",
        }}
      />
      {scrimLado !== "nenhum" ? (
        <AbsoluteFill
          style={{
            background:
              scrimLado === "esquerda"
                ? "linear-gradient(90deg, rgba(11,15,20,0.9) 0%, rgba(11,15,20,0.55) 38%, rgba(11,15,20,0.12) 68%)"
                : "radial-gradient(70% 70% at 50% 50%, rgba(11,15,20,0.72) 0%, rgba(11,15,20,0.2) 100%)",
          }}
        />
      ) : null}
      {/* Vinheta de borda */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 100% at 50% 50%, rgba(11,15,20,0) 55%, rgba(11,15,20,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};
