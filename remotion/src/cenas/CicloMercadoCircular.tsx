import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { COR_DESTAQUE, COR_FUNDO_CARTAO, COR_TEXTO } from "../cores";

// visual_tipo ciclo_mercado_circular (3.9): diagrama circular com 4
// setores em posições FIXAS (sem rotação contínua de 360°). Cada setor,
// na sua vez, AVANÇA levemente no eixo Z (se aproxima da câmera) e
// recua quando o próximo é destacado — profundidade guiada pela
// sequência, não giro. O diagrama entra com leve rotateX e ACOMODA.

const SETORES = [
  { nome: "Aquecimento", ang: -90 },
  { nome: "Estabilização", ang: 0 },
  { nome: "Retração", ang: 90 },
  { nome: "Recuperação", ang: 180 },
];

const DURACAO_DESTAQUE = 34; // frames que cada setor fica em destaque

export const CicloMercadoCircular: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrada do diagrama inteiro: rotateX + Z, assenta e para.
  const tEnt = spring({ frame, fps, durationInFrames: 26, config: { damping: 200 } });
  const rotXEnt = 15 * (1 - tEnt);
  const zEnt = -260 * (1 - tEnt);

  const ativo = Math.floor(frame / DURACAO_DESTAQUE) % SETORES.length;
  const tempo = frame % DURACAO_DESTAQUE;
  // Intensidade contínua do destaque atual (fade in/out) — sem pulo seco.
  const intens = interpolate(
    tempo,
    [0, 8, DURACAO_DESTAQUE - 8, DURACAO_DESTAQUE],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <FundoCena>
      <PalcoCentral>
        <div
          style={{
            position: "relative",
            width: 460,
            height: 460,
            transformStyle: "preserve-3d",
            transform: `perspective(1500px) translateZ(${zEnt}px) rotateX(${rotXEnt}deg)`,
            opacity: Math.min(1, tEnt * 1.3),
          }}
        >
          {/* Anel base */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `4px solid rgba(223,160,44,0.3)`,
            }}
          />
          {SETORES.map((s, i) => {
            const rad = (s.ang * Math.PI) / 180;
            const raio = 230;
            const x = 230 + Math.cos(rad) * raio;
            const y = 230 + Math.sin(rad) * raio;
            const on = i === ativo ? intens : 0;
            // Setor ativo AVANÇA no eixo Z (para a câmera) e cresce um
            // pouco; ao sair do destaque, recua de volta.
            const z = on * 95;
            const escala = 1 + on * 0.12;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) translateZ(${z}px) scale(${escala})`,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    backgroundColor: COR_FUNDO_CARTAO,
                    border: `3px solid ${COR_DESTAQUE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 10,
                    color: COR_TEXTO,
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    overflow: "hidden",
                    boxShadow: `0 ${10 + 20 * on}px ${20 + 24 * on}px rgba(0,0,0,0.4), 0 0 ${40 * on}px rgba(223,160,44,${0.55 * on})`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      backgroundColor: COR_DESTAQUE,
                      opacity: on,
                    }}
                  />
                  <span style={{ position: "relative", color: on > 0.55 ? COR_FUNDO_CARTAO : COR_TEXTO }}>
                    {s.nome}
                  </span>
                </div>
              </div>
            );
          })}
          {/* Núcleo estático */}
          <div
            style={{
              position: "absolute",
              left: 230,
              top: 230,
              transform: "translate(-50%, -50%)",
              color: COR_DESTAQUE,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 2,
              textAlign: "center",
            }}
          >
            CICLO DO
            <br />
            MERCADO
          </div>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
