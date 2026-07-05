import React from "react";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { LineArtDraw } from "../animacao/LineArtDraw";
import { Entrada3D } from "../animacao/Entrada3D";
import { COR_OK, COR_FUNDO_CARTAO, COR_TEXTO } from "../cores";

// visual_tipo checklist_final: lista de itens onde cada um ganha um "check"
// desenhado via stroke-dashoffset (LineArtDraw de um path de tique) + um
// leve pop de escala, em sequência — o resumo/checklist de fechamento.

const ITENS = [
  "Documentação verificada",
  "Localização analisada",
  "Custos totais calculados",
  "Potencial de valorização",
  "Estratégia de renda definida",
];

const CHECK_D = "M20 52 L42 74 L82 28";
const PASSO = 22; // frames entre um check e o próximo

export const ChecklistFinal: React.FC<PropsCena> = ({ texto }) => {
  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, transformStyle: "preserve-3d" }}>
          {ITENS.map((item, i) => {
            const inicio = 12 + i * PASSO;
            // Sequência clara (3.11): o item INTEIRO chega em profundidade
            // (translateZ + rotateX via Entrada3D), e SÓ DEPOIS o check se
            // desenha (delay = inicio, alguns frames após a chegada).
            return (
              <Entrada3D key={i} delay={inicio - 10} eixo="x" angulo={10} distanciaZ={160} duracao={16}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    backgroundColor: COR_FUNDO_CARTAO,
                    borderRadius: 12,
                    padding: "16px 28px",
                    minWidth: 720,
                  }}
                >
                  {/* Caixa do check com o tique se desenhando */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      border: `3px solid ${COR_OK}`,
                      flexShrink: 0,
                    }}
                  >
                    <LineArtDraw
                      paths={[{ d: CHECK_D, comprimento: 120 }]}
                      viewBox="0 0 100 100"
                      delay={inicio}
                      duracao={14}
                      cor={COR_OK}
                      strokeWidth={9}
                    />
                  </div>
                  <span
                    style={{
                      color: COR_TEXTO,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: 28,
                      fontWeight: 600,
                    }}
                  >
                    {item}
                  </span>
                </div>
              </Entrada3D>
            );
          })}
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
