import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCena, Legenda, PalcoCentral, PropsCena, TermoChave } from "./_Base";
import { Entrada3D } from "../animacao/Entrada3D";
import { IconeCasa, IconePessoa } from "../icones/Icones";
import { COR_DESTAQUE, COR_TEXTO } from "../cores";

// visual_tipo oferta_demanda_balanca (3.2): balança entra com leve
// rotateX (como "colocada na mesa") e ACOMODA; a inclinação que mostra o
// desequilíbrio é UMA interpolação até o ângulo final e PARA (sem
// balançar em loop). Casas/pessoas em camada Z levemente à frente da
// balança (profundidade real).

export const OfertaDemandaBalanca: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Balança "pousa na mesa": rotateX de entrada que assenta a 0.
  const tBal = spring({ frame: frame - 6, fps, durationInFrames: 24, config: { damping: 200 } });
  const rotXBal = 16 * (1 - tBal);

  // Inclinação do braço: UMA animação até o ângulo final, depois PARA.
  const angulo = interpolate(frame, [30, 64], [0, 9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const casas = [0, 1]; // oferta escassa
  const pessoas = [0, 1, 2, 3, 4]; // demanda alta

  return (
    <FundoCena>
      <TermoChave texto="Oferta e Demanda" />
      <PalcoCentral>
        <div style={{ display: "flex", alignItems: "center", gap: 80, transformStyle: "preserve-3d" }}>
          {/* Oferta: poucas casas — levemente à frente da balança em Z */}
          <div style={{ transform: "translateZ(40px)" }}>
            <Coluna titulo="OFERTA">
              {casas.map((c) => (
                <Entrada3D key={c} delay={14 + c * 8} eixo="x" angulo={12} distanciaZ={220}>
                  <IconeCasa tamanho={90} />
                </Entrada3D>
              ))}
            </Coluna>
          </div>

          {/* Balança central (mais ao fundo) */}
          <div
            style={{
              width: 260,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: `perspective(1400px) rotateX(${rotXBal}deg)`,
              opacity: Math.min(1, tBal * 1.3),
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
                boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
              }}
            />
            <div style={{ width: 14, height: 150, backgroundColor: COR_DESTAQUE }} />
            <div style={{ width: 120, height: 14, backgroundColor: COR_DESTAQUE, borderRadius: 7 }} />
          </div>

          {/* Demanda: muitas pessoas — levemente à frente da balança em Z */}
          <div style={{ transform: "translateZ(40px)" }}>
            <Coluna titulo="DEMANDA">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {pessoas.map((p) => (
                  <Entrada3D key={p} delay={16 + p * 6} eixo="x" angulo={12} distanciaZ={220}>
                    <IconePessoa tamanho={64} />
                  </Entrada3D>
                ))}
              </div>
            </Coluna>
          </div>
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
