import React from "react";
import { FundoCena, Legenda, PalcoCentral, PropsCena, CamadaApoio } from "./_Base";
import { LineArtDraw } from "../animacao/LineArtDraw";
import { SeloBadge } from "../animacao/SeloBadge";

// visual_tipo valorizacao_casa — implementa o EXEMPLO 6.1 frame a frame:
// casa em line-art desenha em partes (telhado → parede → porta, com
// defasagem de ~8f), depois o selo circular (5.1) entra na camada de
// apoio (translateZ 150→100 + rotateY -15°→0°) e o contador conta 0→+18%.
// Depois, estável. 2D principal: stroke-draw + contador. 3D: rotateY no
// selo. Recurso do meio-termo: 5.1 Selo badge (único da cena).

// Casa dividida em 3 partes para desenhar em sequência (Seção 2.1).
const TELHADO_D = "M20 55 L50 30 L80 55";
const PAREDE_D = "M28 50 L28 82 L72 82 L72 50";
const PORTA_D = "M44 82 L44 64 L56 64 L56 82";

export const ValorizacaoCasa: React.FC<PropsCena> = ({ texto }) => {
  return (
    <FundoCena>
      {/* PRINCIPAL: casa em line-art, partes em sequência */}
      <PalcoCentral>
        <div style={{ width: 420, height: 420 }}>
          <LineArtDraw
            paths={[
              { d: TELHADO_D, comprimento: 90 },
              { d: PAREDE_D, comprimento: 130 },
              { d: PORTA_D, comprimento: 60 },
            ]}
            viewBox="0 0 100 100"
            delay={6}
            duracao={20}
            passoEscalonar={8}
            strokeWidth={2.4}
          />
        </div>
      </PalcoCentral>

      {/* APOIO (Z 100): selo de porcentagem com contador, entra depois
          da casa terminar de desenhar (~frame 48). */}
      <CamadaApoio>
        <div style={{ position: "absolute", right: 470, top: 250 }}>
          <SeloBadge valorFinal={18} formato="percentual" prefixoSinal rotulo="ao ano" delay={48} tamanho={150} />
        </div>
      </CamadaApoio>

      <Legenda texto={texto} />
    </FundoCena>
  );
};
