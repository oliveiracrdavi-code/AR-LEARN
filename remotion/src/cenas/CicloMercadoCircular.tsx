import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { COR_DESTAQUE, COR_FUNDO_CARTAO, COR_TEXTO } from "../cores";

// visual_tipo ciclo_mercado_circular: diagrama circular com 4 setores
// (aquecimento, estabilização, retração, recuperação). Cada setor
// destaca/expande em sequência e o diagrama inteiro gira devagar e
// continuamente — o giro contínuo garante que a cena NUNCA congela.

const SETORES = [
  { nome: "Aquecimento", ang: -90 },
  { nome: "Estabilização", ang: 0 },
  { nome: "Retração", ang: 90 },
  { nome: "Recuperação", ang: 180 },
];

const DURACAO_DESTAQUE = 30; // frames que cada setor fica em destaque

export const CicloMercadoCircular: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const giro = (frame / 6) % 360; // rotação lenta e contínua
  const ativo = Math.floor(frame / DURACAO_DESTAQUE) % SETORES.length;

  return (
    <FundoCena>
      <PalcoCentral>
        <div
          style={{
            position: "relative",
            width: 460,
            height: 460,
            transform: `rotate(${giro}deg)`,
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
            const destaque = i === ativo;
            const escala = interpolate(destaque ? 1 : 0, [0, 1], [0.85, 1.15]);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  // Contra-rotaciona para o texto ficar legível apesar do giro.
                  transform: `translate(-50%, -50%) rotate(${-giro}deg) scale(${escala})`,
                  transition: "none",
                }}
              >
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    backgroundColor: destaque
                      ? COR_DESTAQUE
                      : COR_FUNDO_CARTAO,
                    border: `3px solid ${COR_DESTAQUE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 10,
                    color: destaque ? COR_FUNDO_CARTAO : COR_TEXTO,
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    boxShadow: destaque
                      ? "0 0 40px rgba(223,160,44,0.6)"
                      : "none",
                  }}
                >
                  {s.nome}
                </div>
              </div>
            );
          })}
          {/* Núcleo (contra-rotaciona para o rótulo ficar reto) */}
          <div
            style={{
              position: "absolute",
              left: 230,
              top: 230,
              transform: `translate(-50%, -50%) rotate(${-giro}deg)`,
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
