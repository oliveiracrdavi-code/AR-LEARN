import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { LineArtDraw } from "../animacao/LineArtDraw";
import { COR_DESTAQUE } from "../cores";

// Cena de abertura (visual_tipo skyline_abertura): logo entrando com
// spring de escala, sublinhado dourado que se estende, e um skyline
// desenhado como line-art (stroke-dashoffset). Ilustra "início do
// episódio".

// Skyline de prédios simples, autoral, em um único path (comprimento
// aproximado grande porque é uma silhueta longa e recortada).
const SKYLINE_D =
  "M0 90 L0 70 L8 70 L8 55 L18 55 L18 70 L26 70 L26 40 L30 34 L34 40 L34 70 L44 70 L44 50 L52 50 L52 70 L60 70 L60 28 L64 24 L68 28 L68 70 L78 70 L78 48 L86 48 L86 70 L94 70 L94 60 L100 60 L100 90 Z";
const JANELAS_D =
  "M12 60 L12 66 M28 46 L28 52 M28 56 L28 62 M62 34 L62 40 M62 44 L62 50 M82 54 L82 60";

export const SkylineAbertura: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo (3.1): vem de LONGE no eixo Z, crescendo, com leve rotateY (~12°)
  // que se acomoda a 0° — profundidade na entrada, depois ESTÁVEL.
  const t = spring({ frame, fps, durationInFrames: 26, config: { damping: 200 } });
  const zLogo = -420 * (1 - t);
  const rotLogo = 12 * (1 - t);
  const larguraSublinhado = interpolate(frame, [22, 48], [0, 420], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FundoCena>
      <PalcoCentral>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transformStyle: "preserve-3d",
          }}
        >
          <Img
            src={staticFile("logo-ar.jpg")}
            style={{
              height: 150,
              transform: `perspective(1400px) translateZ(${zLogo}px) rotateY(${rotLogo}deg)`,
              opacity: Math.min(1, t * 1.3),
              borderRadius: 12,
              boxShadow: "0 16px 30px rgba(0,0,0,0.5)",
            }}
          />
          <div
            style={{
              height: 6,
              width: larguraSublinhado,
              backgroundColor: COR_DESTAQUE,
              marginTop: 28,
              borderRadius: 3,
            }}
          />
          {/* Skyline em camada Z mais distante, se desenha via
              stroke-dashoffset e PARA quando o traço termina (sem
              parallax contínuo). */}
          <div style={{ width: 760, height: 200, marginTop: 40, transform: "translateZ(-140px)" }}>
            <LineArtDraw
              paths={[
                { d: SKYLINE_D, comprimento: 700 },
                { d: JANELAS_D, comprimento: 90 },
              ]}
              viewBox="0 0 100 90"
              delay={30}
              duracao={44}
              strokeWidth={1.4}
            />
          </div>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
