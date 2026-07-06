import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR_FUNDO, COR_DESTAQUE } from "../cores";
import { TextoCinetico } from "../animacao/TextoCinetico";
import { Sparkles, CantosDecorativos } from "../animacao/decor";

// Props comuns a toda cena: texto narrado (legenda cinética) + duração
// total em frames.
export type PropsCena = {
  texto: string;
  duracaoFrames: number;
};

// ESTRUTURA DE 4 CAMADAS Z (Seção 4.1 da spec definitiva), aplicada em
// TODA cena. perspective 1000px + preserve-3d, com camadas fixas:
//   FUNDO   (translateZ -300): sparkles ✦ + halo, com leve blur (DOF) —
//           movimento quase nulo, fica "atrás".
//   PRINCIPAL (translateZ 0): a ilustração central (PalcoCentral).
//   APOIO   (translateZ 100): selo/chip/grid (via CamadaApoio).
//   TEXTO   (translateZ 200): legenda/termo — sempre a mais à frente.
// Movimento 3D só na ENTRADA/TRANSIÇÃO; depois estável (regra da Seção 1).
export const FundoCena: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const brilho = interpolate(Math.sin(frame / 80), [-1, 1], [0.12, 0.22]);

  return (
    <AbsoluteFill style={{ backgroundColor: COR_FUNDO, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: 1000 }}>
        <AbsoluteFill style={{ transformStyle: "preserve-3d" }}>
          {/* CAMADA FUNDO (-300) — DOF: leve blur para "vender" a
              profundidade real (só nesta camada, aprovado por Davi). */}
          <AbsoluteFill style={{ transform: "translateZ(-300px) scale(1.35)", filter: "blur(2.5px)" }}>
            <div
              style={{
                position: "absolute",
                top: -260,
                right: -180,
                width: 900,
                height: 900,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(223,160,44,${brilho}) 0%, rgba(0,8,20,0) 70%)`,
              }}
            />
            <Sparkles />
          </AbsoluteFill>

          {/* CAMADAS PRINCIPAL (Z 0), APOIO (Z 100) e TEXTO — as cenas as
              posicionam via PalcoCentral, CamadaApoio, Legenda/TermoChave.
              Nota: a camada de TEXTO fica em Z 0 (não 200) e vem por
              último no DOM — a hierarquia "mais à frente/legível" é
              garantida pela ordem de empilhamento; translateZ 200 num
              container com perspective empurraria a legenda (na base) para
              fora da tela. */}
          {children}
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Moldura de cantos, fixa na tela (fora do 3D). */}
      <CantosDecorativos />
    </AbsoluteFill>
  );
};

// CAMADA PRINCIPAL (Z 0): ilustração central da cena. Estática.
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
      transformStyle: "preserve-3d",
      transform: "translateZ(0px)",
    }}
  >
    {children}
  </div>
);

// CAMADA DE APOIO (Z 100): onde ficam selo/chip/grid — um pouco à frente
// do elemento principal (profundidade real, não sobreposição 2D).
export const CamadaApoio: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: "translateZ(100px)", ...style }}>
    {children}
  </div>
);

// Termo-chave curto (2-4 palavras) no topo — CAMADA DE TEXTO (Z 200).
export const TermoChave: React.FC<{ texto: string; delay?: number }> = ({
  texto,
  delay = 4,
}) => (
  <div
    style={{
      position: "absolute",
      top: 96,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 40, height: 1.5, background: COR_DESTAQUE }} />
      <TextoCinetico
        texto={texto.toUpperCase()}
        fontSize={22}
        delay={delay}
        stagger={4}
        align="center"
        cor={COR_DESTAQUE}
        peso={700}
        style={{ letterSpacing: 4 }}
      />
      <div style={{ width: 40, height: 1.5, background: COR_DESTAQUE }} />
    </div>
  </div>
);

// Legenda cinética inferior — CAMADA DE TEXTO (Z 200), a mais à frente.
export const Legenda: React.FC<{ texto: string; delay?: number }> = ({
  texto,
  delay = 6,
}) => (
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
    <div style={{ maxWidth: 1400, borderLeft: `4px solid ${COR_DESTAQUE}`, paddingLeft: 28 }}>
      <TextoCinetico texto={texto} fontSize={30} delay={delay} stagger={4} align="left" />
    </div>
  </div>
);
