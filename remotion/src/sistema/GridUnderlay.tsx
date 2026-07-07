import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CARBON_LINHA, LARANJA } from "./paleta";

// UNDERLAY TÉCNICO: grid fino + linha-guia + círculo tracejado, bem
// discreto (como os vídeos de referência). Deriva LENTÍSSIMA para manter a
// cena viva (sem congelar) sem chamar atenção. Fica atrás de tudo.
export const GridUnderlay: React.FC = () => {
  const frame = useCurrentFrame();
  const desloca = (frame * 0.15) % 80; // deriva sutil do grid

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Grid quadriculado */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${CARBON_LINHA} 1px, transparent 1px), linear-gradient(90deg, ${CARBON_LINHA} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: `${desloca}px ${desloca}px`,
          opacity: 0.9,
        }}
      />
      {/* Linha-guia diagonal de destaque, bem fraca */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <line x1="0" y1="18%" x2="100%" y2="42%" stroke={LARANJA} strokeWidth={1} strokeOpacity={0.1} />
        <circle cx="78%" cy="30%" r="230" fill="none" stroke={LARANJA} strokeWidth={1} strokeOpacity={0.08} strokeDasharray="4 10" />
      </svg>
      {/* Vinheta radial p/ dar foco ao centro/esquerda */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(120% 90% at 35% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
