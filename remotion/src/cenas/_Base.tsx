import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR_FUNDO, COR_DESTAQUE, COR_DESTAQUE_FRACO } from "../cores";
import { TextoCinetico } from "../animacao/TextoCinetico";

// Props comuns a toda cena temática: o texto narrado (vira legenda
// cinética embaixo) e a duração total da cena em frames (para as animações
// internas se cronometrarem em relação ao tamanho da cena).
export type PropsCena = {
  texto: string;
  duracaoFrames: number;
};

// Fundo padrão de cena: COR_FUNDO + linhas de destaque douradas que
// derivam devagar e continuamente. Garante que NENHUMA janela de 2s fique
// pixel-idêntica, mesmo entre animações de entrada (teste do cliente).
export const FundoCena: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  // Deriva lenta e cíclica (nunca "estaciona").
  const driftA = Math.sin(frame / 90) * 40;
  const driftB = Math.cos(frame / 70) * 30;
  const brilho = interpolate(Math.sin(frame / 60), [-1, 1], [0.18, 0.4]);

  return (
    <AbsoluteFill style={{ backgroundColor: COR_FUNDO, overflow: "hidden" }}>
      {/* Halo dourado difuso que respira devagar no canto superior. */}
      <div
        style={{
          position: "absolute",
          top: -300 + driftB,
          right: -200 + driftA,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(223,160,44,${brilho * 0.25}) 0%, rgba(0,8,20,0) 70%)`,
        }}
      />
      {/* Duas linhas de apoio douradas que deslizam em parallax. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 140 + driftA,
          height: 2,
          background: COR_DESTAQUE_FRACO,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 300 - driftB,
          height: 2,
          background: COR_DESTAQUE_FRACO,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

// Legenda cinética fixa na faixa inferior de toda cena. Usa TextoCinetico
// para o texto narrado "chegar" palavra a palavra (nunca tudo no frame 0).
export const Legenda: React.FC<{ texto: string; delay?: number }> = ({
  texto,
  delay = 6,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 70,
        padding: "0 120px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          borderLeft: `4px solid ${COR_DESTAQUE}`,
          paddingLeft: 28,
        }}
      >
        <TextoCinetico
          texto={texto}
          fontSize={30}
          delay={delay}
          stagger={1.5}
          align="left"
        />
      </div>
    </div>
  );
};

// Área central onde cada cena desenha sua ilustração (acima da legenda).
export const PalcoCentral: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 260,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);
