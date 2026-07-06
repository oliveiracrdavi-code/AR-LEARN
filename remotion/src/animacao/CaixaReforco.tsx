import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR_DESTAQUE, COR_TEXTO, COR_FUNDO_CARTAO } from "../cores";
import { TextoCinetico } from "./TextoCinetico";

// Recurso 5.5 — Caixa de reforço: a "última palavra" de um bloco-chave.
// 2D: translateY de baixo pra cima + opacidade; permanece; depois pode
// sair (opacidade→0 + translateY inverso). 3D: camada de texto (mais
// frontal, translateZ 200 — o pai posiciona). Usado no fim de 2-3
// blocos-chave (ex: checklist_final).
export const CaixaReforco: React.FC<{
  texto: string;
  delay?: number;
  fim?: number; // frame em que começa a sair (opcional)
  style?: React.CSSProperties;
}> = ({ texto, delay = 0, fim, style }) => {
  const frame = useCurrentFrame();
  const entra = interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sai = fim ? interpolate(frame, [fim, fim + 14], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const vis = Math.min(entra, sai);
  const y = (1 - entra) * 40 - (1 - sai) * 40;

  return (
    <div
      style={{
        transform: `translateY(${y}px)`,
        opacity: vis,
        backgroundColor: COR_FUNDO_CARTAO,
        border: `1.5px solid ${COR_DESTAQUE}`,
        borderLeft: `5px solid ${COR_DESTAQUE}`,
        borderRadius: 12,
        padding: "18px 30px",
        maxWidth: 900,
        boxShadow: "0 16px 30px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      <TextoCinetico texto={texto} fontSize={28} peso={700} delay={delay + 4} align="center" cor={COR_TEXTO} />
    </div>
  );
};
