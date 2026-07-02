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

const cenaSchema = z
  .object({
    texto_narrado: z.string(),
    duracao_seg: z.number(),
    visual: z.string(),
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
