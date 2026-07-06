import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena, CamadaApoio } from "./_Base";
import { ChipNumerado } from "../animacao/ChipNumerado";
import { COR_DESTAQUE, COR_FUNDO_CARTAO, COR_TEXTO } from "../cores";

// visual_tipo ciclo_mercado_circular — EXEMPLO 6.2: 4 setores em posições
// FIXAS; cada um, na sua vez, AVANÇA em Z (0→60) e recua quando o próximo
// é destacado (nunca giro de 360°). Chip numerado "1 de 4" (5.3, único
// recurso) marca o progresso na camada de apoio. Entra e estabiliza.

const SETORES = [
  { nome: "Aquecimento", ang: -90 },
  { nome: "Estabilização", ang: 0 },
  { nome: "Retração", ang: 90 },
  { nome: "Recuperação", ang: 180 },
];

const DURACAO_DESTAQUE = 55; // frames por setor

export const CicloMercadoCircular: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrada do diagrama: translateZ + leve rotateX, assenta e para.
  const tEnt = spring({ frame, fps, durationInFrames: 24, config: { damping: 200 } });
  const rotXEnt = 12 * (1 - tEnt);
  const zEnt = -240 * (1 - tEnt);

  const ativo = Math.min(SETORES.length - 1, Math.floor(frame / DURACAO_DESTAQUE));
  const tempo = frame % DURACAO_DESTAQUE;
  const intens = interpolate(tempo, [0, 8, DURACAO_DESTAQUE - 8, DURACAO_DESTAQUE], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FundoCena>
      <PalcoCentral>
        <div
          style={{
            position: "relative",
            width: 460,
            height: 460,
            transformStyle: "preserve-3d",
            transform: `perspective(1000px) translateZ(${zEnt}px) rotateX(${rotXEnt}deg)`,
            opacity: Math.min(1, tEnt * 1.3),
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `4px solid rgba(223,160,44,0.3)` }} />
          {SETORES.map((s, i) => {
            const rad = (s.ang * Math.PI) / 180;
            const raio = 230;
            const x = 230 + Math.cos(rad) * raio;
            const y = 230 + Math.sin(rad) * raio;
            const on = i === ativo ? intens : 0;
            const z = on * 60; // avança em Z (0→60)
            const escala = 1 + on * 0.1;
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
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: COR_DESTAQUE, opacity: on }} />
                  <span style={{ position: "relative", color: on > 0.55 ? COR_FUNDO_CARTAO : COR_TEXTO }}>{s.nome}</span>
                </div>
              </div>
            );
          })}
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

      {/* APOIO: chip numerado "1 de 4" no canto, atualiza conforme o setor */}
      <CamadaApoio>
        <div style={{ position: "absolute", left: 120, top: 150 }}>
          <ChipNumerado atual={ativo + 1} total={SETORES.length} delay={14} />
        </div>
      </CamadaApoio>

      <Legenda texto={texto} />
    </FundoCena>
  );
};
