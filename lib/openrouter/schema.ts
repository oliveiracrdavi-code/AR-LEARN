import { z } from "zod";

// Contrato JSON do Learn — copiado literalmente da seção 9 do
// Sistema_Autonomo_v2. Não adicionar nem remover campos aqui sem
// atualizar o documento fonte primeiro (Regra de Ouro).
const secaoSchema = z
  .object({
    titulo: z.string(),
    corpo: z.string(),
  })
  .strict();

const pdfSchema = z
  .object({
    gancho: z.string(),
    secoes: z.array(secaoSchema),
    erros_comuns: z.array(z.string()),
    checklist: z.array(z.string()),
    fechamento: z.string(),
  })
  .strict();

// Enum de tipos de visual por cena. DEVE ficar idêntico a VISUAL_TIPOS em
// remotion/src/cores.ts (replicado de propósito para não acoplar
// lib/openrouter à pasta remotion) — se mudar aqui, mude lá e no
// systemPrompt.ts (Regra de Ouro). Seleciona o componente animado temático
// que ilustra o que a cena narra.
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

const cenaSchema = z
  .object({
    texto_narrado: z.string(),
    duracao_seg: z.number(),
    // Dica humana livre (mantida): descrição textual do visual.
    visual: z.string(),
    // Seletor de máquina: escolhe o componente animado temático que
    // ilustra a cena. Aditivo em relação ao contrato original.
    visual_tipo: z.enum(VISUAL_TIPOS),
  })
  .strict();

const videoRoteiroSchema = z
  .object({
    cenas: z.array(cenaSchema),
  })
  .strict();

const learnSchema = z
  .object({
    titulo: z.string(),
    trilha: z.string(),
    modulo: z.string(),
    episodios_origem: z.array(z.string()),
    introducao_learn: z.string(),
    pdf: pdfSchema,
    video_roteiro: videoRoteiroSchema,
    mapa_mental_mermaid: z.string(),
  })
  .strict();

export const learnContratoSchema = z
  .object({
    learn: learnSchema,
  })
  .strict();

export type LearnContrato = z.infer<typeof learnContratoSchema>;
