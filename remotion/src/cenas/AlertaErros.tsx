import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { EntradaSpring } from "../animacao/EntradaSpring";
import { COR_DESTAQUE, COR_FUNDO_CARTAO, COR_TEXTO } from "../cores";

// visual_tipo alerta_erros: ícone de alerta "(!)" com spring de escala e
// um leve tremor contínuo, e itens de "erro comum" surgindo um a um abaixo,
// cada um com deslocamento em X na entrada.

const ERROS = [
  "Comprar sem checar a documentação",
  "Ignorar o custo real (ITBI, cartório)",
  "Não estudar a localização",
  "Esquecer a liquidez na hora de vender",
];

export const AlertaErros: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const escala = spring({ frame, fps, config: { damping: 8, mass: 0.8 } });
  // Tremor sutil e contínuo do ícone (nunca 100% parado).
  const tremor = Math.sin(frame / 3) * 2;

  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
          {/* Ícone de alerta */}
          <div
            style={{
              transform: `scale(${escala}) translateX(${tremor}px)`,
              width: 220,
              height: 220,
              borderRadius: "50%",
              backgroundColor: COR_DESTAQUE,
              color: COR_FUNDO_CARTAO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 150,
              fontWeight: 900,
              fontFamily: "Arial, Helvetica, sans-serif",
              boxShadow: "0 0 60px rgba(223,160,44,0.5)",
            }}
          >
            !
          </div>

          {/* Lista de erros aparecendo um a um */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {ERROS.map((erro, i) => (
              <EntradaSpring key={i} delay={20 + i * 14} from="direita" distancia={80}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    backgroundColor: COR_FUNDO_CARTAO,
                    borderLeft: `5px solid ${COR_DESTAQUE}`,
                    borderRadius: 10,
                    padding: "16px 24px",
                    minWidth: 560,
                  }}
                >
                  <span style={{ fontSize: 30, color: COR_DESTAQUE, fontWeight: 800 }}>
                    ✕
                  </span>
                  <span
                    style={{
                      color: COR_TEXTO,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: 26,
                    }}
                  >
                    {erro}
                  </span>
                </div>
              </EntradaSpring>
            ))}
          </div>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
