"use client";

// Montagem das fileiras da vitrine (arquitetura Netflix): fileiras
// nomeadas por RESULTADO, nunca por rótulo técnico. Trilha/Módulo são
// estrutura de DADOS — uma Trilha vira uma fileira porque o TÍTULO dela
// já é um resultado ("Fundamentos do jogo imobiliário"), mas o usuário
// nunca vê a palavra "Trilha".
//
// Fontes (todas gated do jeito certo):
// - learns (RLS)          -> o que o usuário COMPROU (linha completa)
// - learns_publico (view) -> teaser de TODO o catálogo publicado
// - progresso_learns (RLS)-> onde o usuário parou
// - learns_em_alta (view) -> audiência agregada, sem dado pessoal
// - trilhas/modulos       -> públicos (nomeiam/agrupam fileiras)
import { createBrowserSupabaseClient } from "../supabase/client";

export type CardLearn = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  duracao_segundos: number | null;
  publicado_at: string | null;
  comprado: boolean;
  novo: boolean;
  emAlta: boolean;
  progresso: number | null; // 0..1
};

export type Fileira = {
  chave: string;
  titulo: string;
  cards: CardLearn[];
};

export type Vitrine = {
  hero: CardLearn | null;
  fileiras: Fileira[];
};

const DIAS_NOVO = 21;

function ehNovo(publicadoAt: string | null): boolean {
  if (!publicadoAt) return false;
  return Date.now() - new Date(publicadoAt).getTime() < DIAS_NOVO * 86_400_000;
}

export async function montarVitrine(): Promise<Vitrine> {
  const supabase = createBrowserSupabaseClient();

  const [publico, comprados, progresso, emAlta, trilhas, modulos] =
    await Promise.all([
      supabase
        .from("learns_publico")
        .select("id, modulo_id, slug, titulo, resumo, ordem, duracao_segundos, publicado_at, fixado_no_hero")
        .order("ordem"),
      supabase.from("learns").select("id"),
      supabase.from("progresso_learns").select("learn_id, segundos_assistidos, duracao_segundos, concluido, atualizado_at"),
      supabase.from("learns_em_alta").select("learn_id, espectadores"),
      supabase.from("trilhas").select("id, slug, titulo, ordem").order("ordem"),
      supabase.from("modulos").select("id, trilha_id, ordem").order("ordem"),
    ]);

  const idsComprados = new Set((comprados.data ?? []).map((l) => l.id));
  const progPorLearn = new Map(
    (progresso.data ?? []).map((p) => [p.learn_id, p])
  );
  const altaPorLearn = new Map(
    (emAlta.data ?? []).map((a) => [a.learn_id, a.espectadores])
  );
  const trilhaDoModulo = new Map(
    (modulos.data ?? []).map((m) => [m.id, m.trilha_id])
  );

  const cards: (CardLearn & { modulo_id: string; fixado: boolean })[] = (
    publico.data ?? []
  ).map((l) => {
    const p = progPorLearn.get(l.id);
    const fracao =
      p && p.duracao_segundos
        ? Math.min(1, p.segundos_assistidos / p.duracao_segundos)
        : p?.concluido
          ? 1
          : null;
    return {
      id: l.id,
      slug: l.slug,
      titulo: l.titulo,
      resumo: l.resumo,
      duracao_segundos: l.duracao_segundos,
      publicado_at: l.publicado_at,
      comprado: idsComprados.has(l.id),
      novo: ehNovo(l.publicado_at),
      emAlta: (altaPorLearn.get(l.id) ?? 0) >= 3,
      progresso: fracao,
      modulo_id: l.modulo_id,
      fixado: !!l.fixado_no_hero,
    };
  });

  // Hero: fixado pelo admin > mais recente publicado.
  const hero =
    cards.find((c) => c.fixado) ??
    [...cards].sort(
      (a, b) =>
        new Date(b.publicado_at ?? 0).getTime() -
        new Date(a.publicado_at ?? 0).getTime()
    )[0] ??
    null;

  const fileiras: Fileira[] = [];

  // 1. Continue de onde parou — só se houver progresso incompleto.
  const continuar = cards
    .filter((c) => c.progresso !== null && c.progresso < 0.97 && c.comprado)
    .sort((a, b) => {
      const pa = progPorLearn.get(a.id)?.atualizado_at ?? "";
      const pb = progPorLearn.get(b.id)?.atualizado_at ?? "";
      return pb.localeCompare(pa);
    });
  if (continuar.length > 0) {
    fileiras.push({ chave: "continuar", titulo: "Continue de onde parou", cards: continuar });
  }

  // 2. Uma fileira por Trilha (título da trilha = resultado).
  for (const trilha of trilhas.data ?? []) {
    const daTrilha = cards.filter(
      (c) => trilhaDoModulo.get(c.modulo_id) === trilha.id
    );
    if (daTrilha.length > 0) {
      fileiras.push({ chave: `trilha-${trilha.slug}`, titulo: trilha.titulo, cards: daTrilha });
    }
  }

  // 3. Em alta — só quando há audiência agregada de verdade.
  const alta = cards
    .filter((c) => (altaPorLearn.get(c.id) ?? 0) > 0)
    .sort((a, b) => (altaPorLearn.get(b.id) ?? 0) - (altaPorLearn.get(a.id) ?? 0));
  if (alta.length > 0) {
    fileiras.push({ chave: "em-alta", titulo: "Em alta entre investidores", cards: alta });
  }

  // 4. Novos episódios.
  const novos = [...cards].sort(
    (a, b) =>
      new Date(b.publicado_at ?? 0).getTime() -
      new Date(a.publicado_at ?? 0).getTime()
  );
  if (novos.length > 0) {
    fileiras.push({ chave: "novos", titulo: "Novos episódios", cards: novos });
  }

  return { hero, fileiras };
}

// Fileira "Continue explorando" da página do Learn: relacionados da
// mesma trilha primeiro, depois o resto do catálogo — nunca beco sem
// saída (v1 por trilha; v2 futura: tags/palavras-chave, ver log).
export async function montarRelacionados(slugAtual: string): Promise<CardLearn[]> {
  const { fileiras } = await montarVitrine();
  const vistos = new Set<string>();
  const relacionados: CardLearn[] = [];
  for (const f of fileiras) {
    for (const c of f.cards) {
      if (c.slug !== slugAtual && !vistos.has(c.slug)) {
        vistos.add(c.slug);
        relacionados.push(c);
      }
    }
  }
  return relacionados;
}
