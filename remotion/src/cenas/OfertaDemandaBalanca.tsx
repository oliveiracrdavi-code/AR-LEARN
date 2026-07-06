import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena, CamadaApoio } from "./_Base";
import { MiniGrid, ItemGrid } from "../animacao/MiniGrid";
import { COR_DESTAQUE } from "../cores";

// visual_tipo oferta_demanda_balanca — SEM ícone de pessoa (restrição):
// a comparação vira um MINI-GRID (5.2) de blocos + contador (Oferta pouca
// x Demanda muita). Acima, uma balança pequena entra com rotateX ("posta
// na mesa") e inclina UMA vez para o lado da demanda, depois para. 2D:
// spring. 3D: rotateX na balança. Recurso: 5.2 Mini-grid (único).

const ITENS: ItemGrid[] = [
  { rotulo: "OFERTA", valor: 2 },
  { rotulo: "DEMANDA", valor: 6, destaque: true },
];

export const OfertaDemandaBalanca: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Balança "pousa na mesa": rotateX de entrada assenta a 0.
  const tBal = spring({ frame: frame - 4, fps, durationInFrames: 22, config: { damping: 200 } });
  const rotXBal = 12 * (1 - tBal);
  // Inclina para a demanda: UMA interpolação até o ângulo final, e para.
  const angulo = interpolate(frame, [26, 58], [0, 8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <FundoCena>
      {/* PRINCIPAL: balança pequena (metáfora) acima do grid */}
      <PalcoCentral>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44, transformStyle: "preserve-3d" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: `perspective(1000px) rotateX(${rotXBal}deg)`,
              opacity: Math.min(1, tBal * 1.3),
            }}
          >
            <div style={{ width: 200, height: 10, backgroundColor: COR_DESTAQUE, borderRadius: 5, transform: `rotate(${angulo}deg)`, boxShadow: "0 8px 16px rgba(0,0,0,0.4)" }} />
            <div style={{ width: 12, height: 84, backgroundColor: COR_DESTAQUE }} />
            <div style={{ width: 110, height: 12, backgroundColor: COR_DESTAQUE, borderRadius: 6 }} />
          </div>
        </div>
      </PalcoCentral>

      {/* APOIO (Z 100): mini-grid comparativo Oferta x Demanda */}
      <CamadaApoio>
        <div style={{ position: "absolute", left: 0, right: 0, top: 430, display: "flex", justifyContent: "center" }}>
          <MiniGrid itens={ITENS} delayInicial={30} />
        </div>
      </CamadaApoio>

      <Legenda texto={texto} />
    </FundoCena>
  );
};
