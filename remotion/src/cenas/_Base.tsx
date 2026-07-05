import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR_FUNDO, COR_DESTAQUE, COR_TEXTO } from "../cores";
import { TextoCinetico } from "../animacao/TextoCinetico";
import { Sparkles, CantosDecorativos } from "../animacao/decor";

// Props comuns a toda cena temática: o texto narrado (vira legenda
// cinética embaixo) e a duração total da cena em frames.
export type PropsCena = {
  texto: string;
  duracaoFrames: number;
};

// Fundo padrão de cena. FILOSOFIA v3 (diretrizes de Davi): a
// profundidade 3D e o movimento acontecem na ENTRADA e na TRANSIÇÃO —
// depois de acomodado, tudo fica ESTÁVEL (sem balanço/deriva/câmera
// girando em loop). O único movimento contínuo permitido é o dos
// sparkles (partículas discretas ✦), sutis, só para a imagem não ficar
// tecnicamente "morta". Sem grade de linhas de fundo (removida). O
// container tem `perspective` para as entradas 3D dos elementos das
// cenas terem profundidade real.
export const FundoCena: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  // Brilho do halo com variação quase imperceptível (não é "balanço").
  const brilho = interpolate(Math.sin(frame / 80), [-1, 1], [0.14, 0.24]);

  return (
    <AbsoluteFill style={{ backgroundColor: COR_FUNDO, overflow: "hidden" }}>
      {/* Halo dourado difuso, estático de posição (só respira de brilho). */}
      <div
        style={{
          position: "absolute",
          top: -320,
          right: -220,
          width: 950,
          height: 950,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(223,160,44,${brilho}) 0%, rgba(0,8,20,0) 70%)`,
        }}
      />
      {/* Partículas discretas — único movimento contínuo (anti-"imagem
          morta"), baixa amplitude, não competem com o principal. */}
      <Sparkles />

      {/* Camada de conteúdo com perspectiva: as entradas 3D das cenas
          (translateZ/rotateY/rotateX) ganham profundidade real aqui. */}
      <AbsoluteFill style={{ perspective: 1600 }}>
        <AbsoluteFill style={{ transformStyle: "preserve-3d" }}>{children}</AbsoluteFill>
      </AbsoluteFill>

      {/* Moldura de cantos, estática (fixa na tela). */}
      <CantosDecorativos />
    </AbsoluteFill>
  );
};

// Termo-chave curto (2-4 palavras) reforçando o conceito da cena, no
// topo, com entrada cinética — depois estável. Elemento de APOIO.
export const TermoChave: React.FC<{ texto: string; delay?: number }> = ({
  texto,
  delay = 4,
}) => {
  return (
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
          stagger={1.2}
          align="center"
          cor={COR_DESTAQUE}
          peso={700}
          style={{ letterSpacing: 4 }}
        />
        <div style={{ width: 40, height: 1.5, background: COR_DESTAQUE }} />
      </div>
    </div>
  );
};

// Legenda cinética fixa na faixa inferior de toda cena. O texto narrado
// "chega" palavra a palavra na entrada; depois estável.
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

// Área central onde cada cena desenha sua ilustração. ESTÁTICA (sem
// deriva contínua) — o movimento vem das entradas dos elementos e da
// transição de cena.
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
    }}
  >
    {children}
  </div>
);

export { COR_TEXTO };
