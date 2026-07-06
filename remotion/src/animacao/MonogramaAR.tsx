import React from "react";
import { COR_DESTAQUE, COR_FUNDO } from "../cores";

// MOTIVO DE CONTINUIDADE (aprovado por Davi): assinatura discreta "AR"
// num canto, PERSISTENTE ao longo de todo o vídeo. Renderizado no nível
// do LearnVideo (acima da TransitionSeries), então NÃO transiciona com as
// cenas — dá continuidade/marca sem competir com o conteúdo. Estático,
// baixa presença. Uma finíssima linha-trajetória dourada acompanha o
// monograma como "assinatura".
export const MonogramaAR: React.FC = () => (
  <div
    style={{
      position: "absolute",
      right: 54,
      bottom: 46,
      display: "flex",
      alignItems: "center",
      gap: 12,
      opacity: 0.5,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        width: 90,
        height: 2,
        background: `linear-gradient(90deg, rgba(223,160,44,0) 0%, ${COR_DESTAQUE} 100%)`,
      }}
    />
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COR_DESTAQUE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontWeight: 900,
        fontSize: 20,
        color: COR_FUNDO,
        letterSpacing: -1,
      }}
    >
      AR
    </div>
  </div>
);
