import React from "react";
import { FundoCena, Legenda, PalcoCentral, PropsCena, CamadaApoio } from "./_Base";
import { GraficoBarras, ItemBarra } from "../animacao/GraficoBarras";
import { TrilhaConectada } from "../animacao/TrilhaConectada";
import { EntradaSpring } from "../animacao/EntradaSpring";
import { COR_DESTAQUE } from "../cores";

// visual_tipo grafico_precos_anos: barras crescem com Easing.out(cubic) e
// os VALORES sobem via contador cinético (2.2 + 2.5). Leque de
// profundidade nas barras. Recurso do meio-termo: 5.4 Trilha conectada
// (os anos como timeline que acende conforme avança) — único recurso.

const ITENS: ItemBarra[] = [
  { valor: 320, formato: "milhar", legenda: "2021" },
  { valor: 360, formato: "milhar", legenda: "2022" },
  { valor: 405, formato: "milhar", legenda: "2023" },
  { valor: 455, formato: "milhar", legenda: "2024" },
  { valor: 510, formato: "milhar", legenda: "2025" },
  { valor: 580, formato: "milhar", legenda: "2026" },
];

const ANOS = ITENS.map((i) => i.legenda);

export const GraficoPrecosAnos: React.FC<PropsCena> = ({ texto }) => {
  return (
    <FundoCena>
      <PalcoCentral>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <EntradaSpring from="cima" distancia={26}>
            <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 30, fontWeight: 700, color: COR_DESTAQUE, letterSpacing: 2 }}>
              PREÇO MÉDIO DO M² — ANO A ANO
            </div>
          </EntradaSpring>
          <GraficoBarras itens={ITENS} alturaMax={320} delayInicial={14} passo={14} larguraBarra={82} gap={34} />
        </div>
      </PalcoCentral>

      {/* APOIO (Z 100): trilha conectada dos anos (recurso 5.4) */}
      <CamadaApoio>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 300, display: "flex", justifyContent: "center" }}>
          <TrilhaConectada nos={ANOS} largura={760} delayInicial={16} passo={14} />
        </div>
      </CamadaApoio>

      <Legenda texto={texto} />
    </FundoCena>
  );
};
