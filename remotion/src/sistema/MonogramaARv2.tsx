import React from "react";
import { AMARELO, ONYX } from "./paleta";
import { FONTE_TITULO } from "./fontes";

// Assinatura A/R (marca) — chip amarelo com o monograma em onyx, discreto
// no canto. Reproduz o logo oficial (preto sobre amarelo) em pequeno.
export const MonogramaARv2: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      background: AMARELO,
      color: ONYX,
      fontFamily: `"${FONTE_TITULO}", sans-serif`,
      fontSize: 30,
      lineHeight: 1,
      padding: "10px 16px 8px",
      borderRadius: 10,
      letterSpacing: "0.02em",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      ...style,
    }}
  >
    A/R
  </div>
);
