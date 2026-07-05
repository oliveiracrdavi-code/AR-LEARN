import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { Entrada3D } from "../animacao/Entrada3D";
import {
  IconeArvore,
  IconeEscola,
  IconeHospital,
  IconeLoja,
  IconeOnibus,
  IconePin,
} from "../icones/Icones";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";

// visual_tipo localizacao_mapa: um pin de mapa central com círculos
// concêntricos expandindo para fora (raio de influência) em loop suave, e
// pequenos ícones (transporte, comércio, saúde) surgindo dentro do raio em
// sequência — localização e infraestrutura ao redor do imóvel.

const POIS: { Icone: React.FC<{ tamanho?: number }>; ang: number }[] = [
  { Icone: IconeOnibus, ang: -120 },
  { Icone: IconeLoja, ang: -40 },
  { Icone: IconeHospital, ang: 40 },
  { Icone: IconeEscola, ang: 120 },
  { Icone: IconeArvore, ang: 180 },
];

export const LocalizacaoMapa: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const escalaPin = spring({ frame, fps, durationInFrames: 22, config: { damping: 200 } });

  // Três anéis (raio de influência) que se EXPANDEM UMA VEZ até um raio
  // fixo (não em loop) — cada um numa camada Z mais AO FUNDO conforme é
  // mais externo (profundidade real ao crescer). Depois, estáticos.
  const aneis = [0, 1, 2].map((i) => {
    const delay = 6 + i * 8;
    const p = interpolate(frame, [delay, delay + 26], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      escala: interpolate(p, [0, 1], [0.3, 0.8 + i * 0.5]),
      opacidade: interpolate(p, [0, 1], [0, 0.55 - i * 0.13]),
      z: -i * 70, // externo mais ao fundo
    };
  });

  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ position: "relative", width: 640, height: 480, transformStyle: "preserve-3d" }}>
          {/* Anéis concêntricos em camadas Z */}
          {aneis.map((o, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 320,
                top: 240,
                width: 300,
                height: 300,
                marginLeft: -150,
                marginTop: -150,
                borderRadius: "50%",
                border: `3px solid ${COR_DESTAQUE}`,
                opacity: o.opacidade,
                transform: `translateZ(${o.z}px) scale(${o.escala})`,
              }}
            />
          ))}

          {/* POIs dentro do raio — entram com leve profundidade, sequencial */}
          {POIS.map((poi, i) => {
            const rad = (poi.ang * Math.PI) / 180;
            const raio = 190;
            const x = 320 + Math.cos(rad) * raio;
            const y = 240 + Math.sin(rad) * (raio * 0.7);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Entrada3D delay={30 + i * 9} eixo="y" angulo={12} distanciaZ={180}>
                  <poi.Icone tamanho={58} />
                </Entrada3D>
              </div>
            );
          })}

          {/* Pin central — camada mais À FRENTE (Z positivo) */}
          <div
            style={{
              position: "absolute",
              left: 320,
              top: 240,
              transform: `translate(-50%, -70%) translateZ(90px) scale(${escalaPin})`,
              filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.5))",
            }}
          >
            <IconePin tamanho={92} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 320,
              top: 320,
              transform: "translateX(-50%)",
              color: COR_TEXTO,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 22,
              opacity: 0.8,
            }}
          >
            raio de valorização
          </div>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
