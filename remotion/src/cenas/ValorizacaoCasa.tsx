import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { LineArtDraw } from "../animacao/LineArtDraw";
import { COR_DESTAQUE } from "../cores";

// visual_tipo valorizacao_casa: uma casa em line-art com uma seta
// ascendente e rótulos de percentual (+18%, +25%, +34%) surgindo em
// sequência, cada um mais alto que o anterior — o imóvel valorizando ao
// longo do tempo.

const CASA_D =
  "M20 55 L50 30 L80 55 M28 50 L28 82 L72 82 L72 50 M44 82 L44 64 L56 64 L56 82";
const SETA_D = "M15 85 L85 20 M85 20 L70 22 M85 20 L83 35";

const MARCOS = [
  { pct: "+18%", x: 30, y: 62 },
  { pct: "+25%", x: 52, y: 44 },
  { pct: "+34%", x: 74, y: 26 },
];

export const ValorizacaoCasa: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const flutua = Math.sin(frame / 35) * 6;

  return (
    <FundoCena>
      <PalcoCentral>
        <div
          style={{
            position: "relative",
            width: 820,
            height: 480,
            transform: `translateY(${flutua}px)`,
          }}
        >
          {/* Casa desenhada primeiro */}
          <div style={{ position: "absolute", left: 40, bottom: 20, width: 360, height: 360 }}>
            <LineArtDraw
              paths={[{ d: CASA_D, comprimento: 320 }]}
              viewBox="0 0 100 100"
              delay={4}
              duracao={36}
              strokeWidth={2.2}
            />
          </div>
          {/* Seta ascendente desenhada depois */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 820, height: 480 }}>
            <LineArtDraw
              paths={[{ d: SETA_D, comprimento: 200 }]}
              viewBox="0 0 100 100"
              delay={30}
              duracao={40}
              strokeWidth={2}
            />
          </div>
          {/* Rótulos de % surgindo em sequência sobre a trajetória da seta */}
          {MARCOS.map((m, i) => {
            const inicio = 44 + i * 16;
            const p = interpolate(frame, [inicio, inicio + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                  transform: `translate(-50%, -50%) translateY(${(1 - p) * 20}px)`,
                  opacity: p,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 44,
                  fontWeight: 800,
                  color: COR_DESTAQUE,
                }}
              >
                {m.pct}
              </div>
            );
          })}
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
