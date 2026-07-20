// "Receita de geração" — o que a alteração GERAL via IA edita e o que
// os geradores LEEM na hora de gerar (nada de valor fixo hardcoded).
// Sem guard server-only: usado por scripts/Actions da esteira também.
import { z } from "zod";
import { createServiceRoleSupabaseClient } from "../supabase/serviceRoleClient";

export const TIPOS_ASSET = ["video", "ebook", "mindmap"] as const;
export type TipoAsset = (typeof TIPOS_ASSET)[number];

// Schemas .strict(): a IA só pode mexer em parâmetros que os geradores
// realmente consomem — instrução fora do vocabulário falha na validação
// em vez de virar config morto.
export const schemaVideo = z
  .object({
    legenda: z
      .object({
        tamanho_fonte: z.number().min(18).max(72),
        altura_linha: z.number().min(1).max(2),
        cor_texto: z.string(),
        cor_palavra_chave: z.string(),
        posicao: z.enum(["rodape", "centro"]),
      })
      .strict(),
    duracao_minima_segundos: z.number().min(420), // piso é regra de produto, não desce
    intro_segundos: z.number().min(5).max(30),
    outro_segundos: z.number().min(5).max(30),
  })
  .strict();

export const schemaEbook = z
  .object({
    corpo: z
      .object({
        tamanho_fonte_px: z.number().min(10).max(20),
        altura_linha: z.number().min(1.1).max(2.4),
      })
      .strict(),
    titulo_px: z.number().min(16).max(40),
    subtitulo_px: z.number().min(12).max(28),
    margem_px: z.number().min(16).max(80),
    espaco_entre_secoes_px: z.number().min(8).max(64),
  })
  .strict();

export const schemaMindmap = z
  .object({
    profundidade_maxima: z.number().min(2).max(8).nullable(),
    indentacao_por_nivel: z.number().min(1).max(4),
    formato_imagem: z.enum(["svg", "png"]),
  })
  .strict();

export const SCHEMAS: Record<TipoAsset, z.ZodTypeAny> = {
  video: schemaVideo,
  ebook: schemaEbook,
  mindmap: schemaMindmap,
};

// Defaults = exatamente o que o código gera hoje (espelho do seed v1).
export const DEFAULTS: Record<TipoAsset, unknown> = {
  video: {
    legenda: {
      tamanho_fonte: 32,
      altura_linha: 1.35,
      cor_texto: "#EDEBE6",
      cor_palavra_chave: "#F8C848",
      posicao: "rodape",
    },
    duracao_minima_segundos: 420,
    intro_segundos: 15,
    outro_segundos: 15,
  },
  ebook: {
    corpo: { tamanho_fonte_px: 13, altura_linha: 1.5 },
    titulo_px: 24,
    subtitulo_px: 17,
    margem_px: 40,
    espaco_entre_secoes_px: 24,
  },
  mindmap: {
    profundidade_maxima: null,
    indentacao_por_nivel: 2,
    formato_imagem: "svg",
  },
};

// Cache em memória (pedido de economia: não rebuscar a cada interação).
const cache = new Map<TipoAsset, { params: unknown; versao: number; em: number }>();
const CACHE_MS = 60_000;

export async function lerConfigAtivo(
  tipo: TipoAsset
): Promise<{ params: unknown; versao: number }> {
  const c = cache.get(tipo);
  if (c && Date.now() - c.em < CACHE_MS) return c;

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data } = await supabase
      .from("generation_config")
      .select("params, versao")
      .eq("tipo", tipo)
      .eq("ativo", true)
      .maybeSingle();
    const resultado = data
      ? { params: data.params, versao: data.versao }
      : { params: DEFAULTS[tipo], versao: 0 };
    cache.set(tipo, { ...resultado, em: Date.now() });
    return resultado;
  } catch {
    return { params: DEFAULTS[tipo], versao: 0 }; // sem banco => comportamento atual
  }
}

// Aprovação de uma alteração geral: desativa a versão vigente e grava a
// nova como ativa — histórico completo permanece (reversível).
export async function criarNovaVersao(
  tipo: TipoAsset,
  params: unknown,
  instrucao: string
): Promise<number> {
  const validado = SCHEMAS[tipo].parse(params);
  const supabase = createServiceRoleSupabaseClient();

  const { data: atual } = await supabase
    .from("generation_config")
    .select("versao")
    .eq("tipo", tipo)
    .order("versao", { ascending: false })
    .limit(1)
    .maybeSingle();
  const proxima = (atual?.versao ?? 0) + 1;

  await supabase.from("generation_config").update({ ativo: false }).eq("tipo", tipo).eq("ativo", true);
  const { error } = await supabase.from("generation_config").insert({
    tipo,
    versao: proxima,
    params: validado,
    origem: "admin",
    instrucao_origem: instrucao,
    ativo: true,
  });
  if (error) throw new Error(`Falha ao gravar versão: ${error.message}`);
  cache.delete(tipo);
  return proxima;
}
