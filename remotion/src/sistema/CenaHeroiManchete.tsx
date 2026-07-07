import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ONYX, AMARELO, BRANCO, BRANCO_SUAVE, LARANJA } from "./paleta";
import { useFonteTitulo, FONTE_TITULO } from "./fontes";
import { GridUnderlay } from "./GridUnderlay";
import { CasaHero3D } from "./CasaHero3D";
import { MancheteCinetica } from "./MancheteCinetica";
import { MonogramaARv2 } from "./MonogramaARv2";

// CENA DE TESTE — "herói-3D + manchete" no Motion System V2 (estilo do
// Vídeo 1). Quadro CHEIO em zonas: kicker no topo, manchete gigante ao
// centro-esquerda, casa-herói 3D real à direita (sobreposta pela tipografia),
// barra de reforço embaixo, palavra gigante fantasma ao fundo. Texto e
// visual dizem a MESMA coisa (comprar imóvel bem = lucro).
export const CenaHeroiManchete: React.FC = () => {
  useFonteTitulo();
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Entrada dos blocos de UI (kicker, reforço) — deslizam e assentam.
  const entUI = spring({ frame: frame - 2, fps, durationInFrames: 20, config: { damping: 200 } });
  const kickerX = interpolate(entUI, [0, 1], [-40, 0]);
  const reforcoY = interpolate(entUI, [0, 1], [50, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: ONYX, overflow: "hidden" }}>
      <GridUnderlay />

      {/* Palavra-fantasma gigante ao fundo (profundidade tipográfica) */}
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -30,
          fontFamily: `"${FONTE_TITULO}", sans-serif`,
          fontSize: 520,
          lineHeight: 0.8,
          color: BRANCO,
          opacity: 0.035,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        IMÓVEL
      </div>

      {/* Casa-herói 3D REAL (canvas transparente, ocupa o quadro; a casa
          fica à direita via posição da câmera/grupo) */}
      <AbsoluteFill style={{ left: "26%" }}>
        <CasaHero3D width={Math.round(width * 0.74)} height={height} />
      </AbsoluteFill>

      {/* Scrim escuro à esquerda: garante contraste da manchete sobre a casa */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(90deg, rgba(2,2,2,0.92) 0%, rgba(2,2,2,0.7) 34%, rgba(2,2,2,0) 60%)",
        }}
      />

      {/* Kicker de contexto (topo) */}
      <div
        style={{
          position: "absolute",
          top: 84,
          left: 96,
          transform: `translateX(${kickerX}px)`,
          opacity: entUI,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ width: 46, height: 4, background: AMARELO }} />
        <span
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 6,
            color: AMARELO,
            textTransform: "uppercase",
          }}
        >
          Mercado Imobiliário · Aula
        </span>
      </div>

      {/* Manchete gigante (zona de texto, centro-esquerda, sobre a casa) */}
      <div style={{ position: "absolute", left: 96, top: 300, maxWidth: 1250 }}>
        <MancheteCinetica
          fontSize={168}
          linhas={[
            { texto: "Quem compra bem,", cor: BRANCO_SUAVE },
            { texto: "lucra na compra", cor: AMARELO },
          ]}
        />
      </div>

      {/* Barra de reforço (embaixo) — repete a MESMA ideia por outro canal */}
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 76,
          transform: `translateY(${reforcoY}px)`,
          opacity: entUI,
          display: "flex",
          alignItems: "center",
          gap: 26,
        }}
      >
        <MonogramaARv2 />
        <div style={{ width: 2, height: 46, background: "rgba(255,255,255,0.18)" }} />
        <span
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 700,
            fontSize: 34,
            color: BRANCO,
            letterSpacing: 0.5,
          }}
        >
          O lucro nasce no <span style={{ color: LARANJA }}>dia da compra</span>.
        </span>
      </div>
    </AbsoluteFill>
  );
};
