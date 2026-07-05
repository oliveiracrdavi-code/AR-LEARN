import React from "react";
import { PropsCena } from "./_Base";
import { VisualTipo } from "../cores";
import { SkylineAbertura } from "./SkylineAbertura";
import { OfertaDemandaBalanca } from "./OfertaDemandaBalanca";
import { ValorizacaoCasa } from "./ValorizacaoCasa";
import { GraficoPrecosAnos } from "./GraficoPrecosAnos";
import { FinanciamentoCalculadora } from "./FinanciamentoCalculadora";
import { LocalizacaoMapa } from "./LocalizacaoMapa";
import { RendaPassivaCalendario } from "./RendaPassivaCalendario";
import { ShortStayCalendario } from "./ShortStayCalendario";
import { CicloMercadoCircular } from "./CicloMercadoCircular";
import { AlertaErros } from "./AlertaErros";
import { ChecklistFinal } from "./ChecklistFinal";
import { GenericoFallback } from "./GenericoFallback";

// Mapa canônico visual_tipo → componente temático. O dispatcher em
// LearnVideo usa este registro; qualquer tipo não mapeado cai em
// GenericoFallback (que também é animado).
export const CENAS_POR_TIPO: Record<VisualTipo, React.FC<PropsCena>> = {
  skyline_abertura: SkylineAbertura,
  oferta_demanda_balanca: OfertaDemandaBalanca,
  valorizacao_casa: ValorizacaoCasa,
  grafico_precos_anos: GraficoPrecosAnos,
  financiamento_calculadora: FinanciamentoCalculadora,
  localizacao_mapa: LocalizacaoMapa,
  renda_passiva_calendario: RendaPassivaCalendario,
  short_stay_calendario: ShortStayCalendario,
  ciclo_mercado_circular: CicloMercadoCircular,
  alerta_erros: AlertaErros,
  checklist_final: ChecklistFinal,
  generico_fallback: GenericoFallback,
};

export { GenericoFallback, SkylineAbertura };
export type { PropsCena };
