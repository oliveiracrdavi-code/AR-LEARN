import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { EntradaSpring } from "../animacao/EntradaSpring";
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
  const escalaPin = spring({ frame, fps, config: { damping: 10 } });

  // Três ondas concêntricas em loop contínuo (nunca param).
  const ondas = [0, 1, 2].map((i) => {
    const fase = ((frame + i * 30) % 90) / 90; // 0→1 ciclando
    return {
      escala: interpolate(fase, [0, 1], [0.3, 1.8]),
      opacidade: interpolate(fase, [0, 1], [0.5, 0], {
        extrapolateRight: "clamp",
      }),
    };
  });

  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ position: "relative", width: 640, height: 480 }}>
          {/* Ondas concêntricas */}
          {ondas.map((o, i) => (
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
                transform: `scale(${o.escala})`,
              }}
            />
          ))}

          {/* POIs dentro do raio */}
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
                <EntradaSpring delay={25 + i * 9} from="nenhuma" escalaInicial={0.2}>
                  <poi.Icone tamanho={58} />
                </EntradaSpring>
              </div>
            );
          })}

          {/* Pin central */}
          <div
            style={{
              position: "absolute",
              left: 320,
              top: 240,
              transform: `translate(-50%, -70%) scale(${escalaPin})`,
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
