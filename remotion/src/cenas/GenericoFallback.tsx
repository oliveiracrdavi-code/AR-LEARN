import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FundoCena, PropsCena } from "./_Base";
import { TextoCinetico } from "../animacao/TextoCinetico";
import { COR_DESTAQUE } from "../cores";

// visual_tipo generico_fallback: usado SÓ quando nenhum tipo específico se
// aplica. Ainda assim nunca é estático — o texto narrado sobe como
// tipografia cinética no centro, com linhas douradas de destaque
// derivando de leve o tempo todo.

export const GenericoFallback: React.FC<PropsCena> = ({ texto }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 50) * 24;
  const largura = interpolate(frame, [0, 30], [0, 300], {
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
        {/* Linha superior que se estende + deriva */}
        <div
          style={{
            height: 5,
            width: largura,
            backgroundColor: COR_DESTAQUE,
            borderRadius: 3,
            marginBottom: 50,
            transform: `translateX(${drift}px)`,
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
        {/* Linha inferior derivando na direção oposta */}
        <div
          style={{
            height: 5,
            width: largura,
            backgroundColor: COR_DESTAQUE,
            borderRadius: 3,
            marginTop: 50,
            transform: `translateX(${-drift}px)`,
          }}
        />
      </div>
    </FundoCena>
  );
};
