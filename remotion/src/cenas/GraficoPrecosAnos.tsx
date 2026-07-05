import React from "react";
import { FundoCena, Legenda, PalcoCentral, PropsCena } from "./_Base";
import { GraficoBarras, ItemBarra } from "../animacao/GraficoBarras";
import { EntradaSpring } from "../animacao/EntradaSpring";
import { SeloFlutuante } from "../animacao/SeloFlutuante";
import { COR_DESTAQUE } from "../cores";

// visual_tipo grafico_precos_anos: barras de preço médio subindo ano a
// ano. Cada barra e seu rótulo entram um de cada vez (GraficoBarras já faz
// o escalonamento), ilustrando a alta consistente do preço.

const ITENS: ItemBarra[] = [
  { valor: 320, rotuloValor: "R$ 320k", legenda: "2021" },
  { valor: 360, rotuloValor: "R$ 360k", legenda: "2022" },
  { valor: 405, rotuloValor: "R$ 405k", legenda: "2023" },
  { valor: 455, rotuloValor: "R$ 455k", legenda: "2024" },
  { valor: 510, rotuloValor: "R$ 510k", legenda: "2025" },
  { valor: 580, rotuloValor: "R$ 580k", legenda: "2026" },
];

export const GraficoPrecosAnos: React.FC<PropsCena> = ({ texto }) => {
  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <EntradaSpring from="cima" distancia={30}>
            <div
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 30,
                fontWeight: 700,
                color: COR_DESTAQUE,
                letterSpacing: 2,
              }}
            >
              PREÇO MÉDIO DO M² — ANO A ANO
            </div>
          </EntradaSpring>
          <GraficoBarras itens={ITENS} alturaMax={360} delayInicial={14} passo={16} />
        </div>
      </PalcoCentral>
      {/* Selo de apoio: resume a valorização acumulada (elemento
          secundário, menor e discreto — dá densidade sem competir). */}
      <div style={{ position: "absolute", top: 150, right: 170 }}>
        <SeloFlutuante rotulo="em 5 anos" valor="+81%" delay={70} />
      </div>
      <Legenda texto={texto} />
    </FundoCena>
  );
};
