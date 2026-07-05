// Paleta oficial do projeto (decisão de Davi, 2026-07-05 — extraída por
// análise de pixel real do PDF "Decola com a Carozzo", único elemento
// herdado desse material): fundo quase-preto azulado + dourado/âmbar
// de destaque. Extraída para cá (antes ficava só em LearnVideo.tsx) para
// que TODAS as primitivas de animação e as cenas temáticas importem a
// MESMA fonte de verdade e a paleta nunca "derive" entre arquivos.
export const COR_FUNDO = "#000814";
export const COR_DESTAQUE = "#DFA02C";

// Tons auxiliares derivados do dourado/fundo, para dar profundidade sem
// introduzir cores novas fora da paleta (mantém a identidade visual).
export const COR_TEXTO = "#F5F5F5";
export const COR_DESTAQUE_FRACO = "rgba(223, 160, 44, 0.28)"; // dourado translúcido p/ linhas de apoio
export const COR_FUNDO_CARTAO = "#0A1428"; // painel um tom acima do fundo
export const COR_OK = "#5FBF6A"; // verde discreto só para "check" concluído

// Enum canônico de tipos de visual por cena. Fonte de verdade para o
// dispatcher do LearnVideo. O MESMO conjunto de valores está replicado
// (de propósito, para não acoplar lib/openrouter à pasta remotion) em
// lib/openrouter/schema.ts e documentado em lib/openrouter/systemPrompt.ts
// — se mudar aqui, mude nos três lugares (Regra de Ouro).
export const VISUAL_TIPOS = [
  "skyline_abertura",
  "oferta_demanda_balanca",
  "valorizacao_casa",
  "grafico_precos_anos",
  "financiamento_calculadora",
  "localizacao_mapa",
  "renda_passiva_calendario",
  "short_stay_calendario",
  "ciclo_mercado_circular",
  "alerta_erros",
  "checklist_final",
  "generico_fallback",
] as const;

export type VisualTipo = (typeof VISUAL_TIPOS)[number];
