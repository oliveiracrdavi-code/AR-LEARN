import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { Entrada3D } from "../animacao/Entrada3D";
import { COR_DESTAQUE, COR_FUNDO_CARTAO, COR_TEXTO } from "../cores";

// visual_tipo alerta_erros (3.10): ícone de alerta "(!)" com spring de
// escala e um "shake" curto na entrada que AMORTECE e para (não fica
// tremendo pra sempre). Itens de erro entram um a um em camada Z
// levemente diferente; depois, parados.

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
  // Shake que AMORTECE: forte na entrada, zera após ~1s. Depois, parado.
  const decaimento = interpolate(frame, [0, 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tremor = Math.sin(frame / 3) * 3 * decaimento;

  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ display: "flex", alignItems: "center", gap: 70, transformStyle: "preserve-3d" }}>
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

          {/* Lista de erros: cada item entra em camada Z levemente
              diferente com leve rotateX, sequencial; depois parado. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, transformStyle: "preserve-3d" }}>
            {ERROS.map((erro, i) => (
              <div key={i} style={{ transform: `translateZ(${(i % 2) * 30}px)` }}>
                <Entrada3D delay={22 + i * 12} eixo="x" angulo={12} distanciaZ={140}>
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
                    <span style={{ fontSize: 30, color: COR_DESTAQUE, fontWeight: 800 }}>✕</span>
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
                </Entrada3D>
              </div>
            ))}
          </div>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
