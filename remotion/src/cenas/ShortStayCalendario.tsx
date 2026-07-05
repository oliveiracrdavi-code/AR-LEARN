import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { EntradaSpring } from "../animacao/EntradaSpring";
import { IconeCama } from "../icones/Icones";
import { COR_DESTAQUE, COR_FUNDO_CARTAO, COR_TEXTO } from "../cores";

// visual_tipo short_stay_calendario: um ícone de cama + uma grade de
// calendário cujos dias vão sendo MARCADOS numa cadência RÁPIDA (várias
// reservas por mês) — locação por temporada / short stay. Contraste
// proposital com a cadência lenta da renda passiva tradicional.

const COLUNAS = 7;
const LINHAS = 5;
const TOTAL = COLUNAS * LINHAS;
const PASSO_MARCA = 4; // frames por dia marcado — cadência rápida

// Alguns dias ficam "reservados" (marcados) e outros não, alternando.
const RESERVADO = new Set([2, 3, 4, 8, 9, 12, 13, 14, 18, 19, 22, 23, 24, 25, 30, 31]);

export const ShortStayCalendario: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const cama = 1 + Math.sin(frame / 24) * 0.03;

  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
          {/* Cama */}
          <EntradaSpring from="esquerda" escalaInicial={0.5}>
            <div style={{ transform: `scale(${cama})` }}>
              <IconeCama tamanho={160} />
            </div>
          </EntradaSpring>

          {/* Calendário */}
          <EntradaSpring delay={8} from="direita">
            <div
              style={{
                backgroundColor: COR_FUNDO_CARTAO,
                borderRadius: 16,
                border: `2px solid ${COR_DESTAQUE}`,
                padding: 22,
              }}
            >
              <div
                style={{
                  color: COR_DESTAQUE,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 14,
                  letterSpacing: 2,
                }}
              >
                RESERVAS DO MÊS
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${COLUNAS}, 46px)`,
                  gap: 8,
                }}
              >
                {Array.from({ length: TOTAL }).map((_, i) => {
                  const reservado = RESERVADO.has(i);
                  // Cada dia "aparece" em cadência rápida; reservados ganham
                  // preenchimento dourado ao serem marcados.
                  const inicio = 14 + i * PASSO_MARCA;
                  const marca = interpolate(frame, [inicio, inicio + 6], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
                  return (
                    <div
                      key={i}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 8,
                        border: `2px solid ${COR_DESTAQUE}`,
                        backgroundColor: reservado
                          ? `rgba(223,160,44,${marca})`
                          : "transparent",
                        opacity: 0.4 + marca * 0.6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: COR_TEXTO,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: 18,
                        transform: `scale(${0.7 + marca * 0.3})`,
                      }}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </EntradaSpring>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
