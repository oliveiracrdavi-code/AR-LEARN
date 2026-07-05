import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { EntradaSpring } from "../animacao/EntradaSpring";
import { IconeCasa } from "../icones/Icones";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";

// visual_tipo renda_passiva_calendario: uma casa com um "$" entrando
// periodicamente, numa cadência LENTA (uma vez por "mês") — aluguel
// tradicional / renda passiva pingando todo mês. Contraste proposital com
// short_stay (cadência rápida).

const CICLO = 45; // frames por "mês" — cadência lenta

export const RendaPassivaCalendario: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();

  // Cifrão que "cai" na casa a cada CICLO frames.
  const faseCiclo = (frame % CICLO) / CICLO; // 0→1
  const quedaY = interpolate(faseCiclo, [0, 0.6], [-140, 40], {
    extrapolateRight: "clamp",
  });
  const opacidadeCifra = interpolate(
    faseCiclo,
    [0, 0.1, 0.6, 0.9],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Contador de meses acumulados (renda que se acumula).
  const mesesAcumulados = Math.floor(frame / CICLO) + 1;
  const flutuaCasa = Math.sin(frame / 30) * 6;

  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ position: "relative", width: 560, height: 460 }}>
          {/* Cifrão caindo */}
          <div
            style={{
              position: "absolute",
              left: 280,
              top: 120,
              transform: `translate(-50%, ${quedaY}px)`,
              opacity: opacidadeCifra,
              fontSize: 84,
              fontWeight: 800,
              color: COR_DESTAQUE,
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            $
          </div>

          {/* Casa que recebe */}
          <div
            style={{
              position: "absolute",
              left: 280,
              top: 250,
              transform: `translate(-50%, ${flutuaCasa}px)`,
            }}
          >
            <IconeCasa tamanho={150} />
          </div>

          {/* Selo de meses acumulados */}
          <div style={{ position: "absolute", left: 380, top: 250 }}>
            <EntradaSpring delay={6} from="direita">
              <div
                style={{
                  backgroundColor: "rgba(223,160,44,0.15)",
                  border: `2px solid ${COR_DESTAQUE}`,
                  borderRadius: 14,
                  padding: "12px 18px",
                  textAlign: "center",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: COR_TEXTO,
                }}
              >
                <div style={{ fontSize: 20, opacity: 0.75 }}>renda mensal</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: COR_DESTAQUE }}>
                  {mesesAcumulados}x
                </div>
              </div>
            </EntradaSpring>
          </div>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
