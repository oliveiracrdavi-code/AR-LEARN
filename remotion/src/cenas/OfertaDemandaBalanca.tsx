import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { EntradaSpring } from "../animacao/EntradaSpring";
import { IconeCasa, IconePessoa } from "../icones/Icones";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";

// visual_tipo oferta_demanda_balanca: coluna de casas (oferta, pouca) à
// esquerda e coluna de pessoas (demanda, muita) à direita, com uma balança
// no meio cujo braço inclina para o lado da demanda — preço sobe por
// escassez. Ícones entram escalonados; o braço da balança oscila sempre.

export const OfertaDemandaBalanca: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();

  // Braço inclina para a demanda e depois oscila suavemente para sempre
  // ter movimento (nunca congela numa pose).
  const inclinacaoBase = interpolate(frame, [20, 60], [0, 9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const oscila = Math.sin(frame / 25) * 1.6;
  const angulo = inclinacaoBase + oscila;

  const casas = [0, 1]; // oferta escassa
  const pessoas = [0, 1, 2, 3, 4]; // demanda alta

  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
          {/* Oferta: poucas casas */}
          <Coluna titulo="OFERTA">
            {casas.map((c) => (
              <EntradaSpring key={c} delay={10 + c * 8} from="cima">
                <IconeCasa tamanho={90} />
              </EntradaSpring>
            ))}
          </Coluna>

          {/* Balança central */}
          <div
            style={{
              width: 260,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 220,
                height: 12,
                backgroundColor: COR_DESTAQUE,
                borderRadius: 6,
                transform: `rotate(${angulo}deg)`,
                transformOrigin: "center",
              }}
            />
            <div
              style={{
                width: 14,
                height: 150,
                backgroundColor: COR_DESTAQUE,
              }}
            />
            <div
              style={{
                width: 120,
                height: 14,
                backgroundColor: COR_DESTAQUE,
                borderRadius: 7,
              }}
            />
          </div>

          {/* Demanda: muitas pessoas */}
          <Coluna titulo="DEMANDA">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              {pessoas.map((p) => (
                <EntradaSpring key={p} delay={12 + p * 6} from="baixo">
                  <IconePessoa tamanho={64} />
                </EntradaSpring>
              ))}
            </div>
          </Coluna>
        </div>
      </PalcoCentral>
      <Legenda texto={texto} />
    </FundoCena>
  );
};

const Coluna: React.FC<{ titulo: string; children: React.ReactNode }> = ({
  titulo,
  children,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 18,
    }}
  >
    <div
      style={{
        color: COR_DESTAQUE,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 24,
        letterSpacing: 3,
        fontWeight: 700,
      }}
    >
      {titulo}
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {children}
    </div>
    <div style={{ height: 2, width: 140, background: COR_TEXTO, opacity: 0.2 }} />
  </div>
);
