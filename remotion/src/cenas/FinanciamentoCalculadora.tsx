import React from "react";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { Entrada3D } from "../animacao/Entrada3D";
import { COR_DESTAQUE, COR_FUNDO_CARTAO, COR_TEXTO } from "../cores";

// visual_tipo financiamento_calculadora: uma calculadora central (entra
// com spring de escala) e, ao redor, "chips" de documentos/custos (ITBI,
// escritura, condomínio, parcelas) surgindo em sequência com delays
// incrementais — os custos que compõem o financiamento.

const CHIPS = [
  { txt: "ITBI", ang: -140 },
  { txt: "Escritura", ang: -70 },
  { txt: "Condomínio", ang: 0 },
  { txt: "Parcelas", ang: 70 },
  { txt: "Juros", ang: 140 },
];

export const FinanciamentoCalculadora: React.FC<PropsCena> = ({ texto }) => {
  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ position: "relative", width: 700, height: 480, transformStyle: "preserve-3d" }}>
          {/* Chips: cada um numa profundidade Z distinta (cartões
              flutuando em profundidade), entrando um a um com leve
              rotateY; depois ESTÁTICOS. */}
          {CHIPS.map((chip, i) => {
            const rad = (chip.ang * Math.PI) / 180;
            const raio = 260;
            const x = 350 + Math.cos(rad) * raio;
            const y = 240 + Math.sin(rad) * (raio * 0.62);
            const zChip = -40 + (i % 3) * 45; // profundidades distintas
            return (
              <div
                key={chip.txt}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) translateZ(${zChip}px)`,
                }}
              >
                <Entrada3D delay={20 + i * 10} eixo="y" angulo={14} distanciaZ={200} sombra>
                  <div
                    style={{
                      backgroundColor: COR_FUNDO_CARTAO,
                      border: `2px solid ${COR_DESTAQUE}`,
                      color: COR_TEXTO,
                      borderRadius: 12,
                      padding: "14px 22px",
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: 26,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chip.txt}
                  </div>
                </Entrada3D>
              </div>
            );
          })}

          {/* Calculadora central (camada principal) — entra em
              profundidade e fica ESTÁTICA. */}
          <div
            style={{
              position: "absolute",
              left: 350,
              top: 240,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Entrada3D eixo="y" angulo={12} distanciaZ={300} sombra glint>
              <div
                style={{
                  width: 170,
                  height: 220,
                  backgroundColor: COR_FUNDO_CARTAO,
                  border: `3px solid ${COR_DESTAQUE}`,
                  borderRadius: 18,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    height: 44,
                    background: "rgba(223,160,44,0.18)",
                    borderRadius: 8,
                  }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                    flex: 1,
                  }}
                >
                  {Array.from({ length: 9 }).map((_, k) => (
                    <div
                      key={k}
                      style={{
                        background: COR_DESTAQUE,
                        opacity: 0.85,
                        borderRadius: 6,
                      }}
                    />
                  ))}
                </div>
              </div>
            </Entrada3D>
          </div>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
