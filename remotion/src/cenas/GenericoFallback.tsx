import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FundoCena, PropsCena } from "./_Base";
import { TextoCinetico } from "../animacao/TextoCinetico";
import { Entrada3D } from "../animacao/Entrada3D";
import { COR_DESTAQUE } from "../cores";

// visual_tipo generico_fallback (3.12): princípio geral — o bloco central
// (linhas + texto narrado) ENTRA em profundidade e depois fica ESTÁVEL.
// As linhas se estendem uma vez (não derivam para sempre).

export const GenericoFallback: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const largura = interpolate(frame, [8, 34], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FundoCena>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 200px",
        }}
      >
        <Entrada3D eixo="y" angulo={12} distanciaZ={260}>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            {/* Linha superior que se estende uma vez, depois estática */}
            <div
              style={{
                height: 5,
                width: largura,
                backgroundColor: COR_DESTAQUE,
                borderRadius: 3,
                marginBottom: 50,
              }}
            />
            <TextoCinetico
              texto={texto}
              fontSize={44}
              peso={600}
              stagger={2}
              align="center"
              lineHeight={1.5}
            />
            {/* Linha inferior */}
            <div
              style={{
                height: 5,
                width: largura,
                backgroundColor: COR_DESTAQUE,
                borderRadius: 3,
                marginTop: 50,
              }}
            />
          </div>
        </Entrada3D>
      </div>
    </FundoCena>
  );
};
