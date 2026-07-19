"use client";

// Preview da vitrine na landing pública: 3-4 cards REAIS (learns_publico,
// anon) com thumbnail do YouTube — visitante vê o catálogo bloqueado e o
// CTA leva pra compra. Skeleton enquanto carrega; some se não houver
// catálogo (sem estado quebrado).
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { VitrineRow } from "@/componentes/vitrine/VitrineRow";
import type { CardLearn } from "@/lib/vitrine/fileiras";

export function PreviewVitrine() {
  const [cards, setCards] = useState<CardLearn[] | null>(null);

  useEffect(() => {
    createBrowserSupabaseClient()
      .from("learns_publico")
      .select("id, slug, titulo, resumo, duracao_segundos, publicado_at, thumbnail_url")
      .order("publicado_at", { ascending: false })
      .limit(4)
      .then(({ data }) =>
        setCards(
          (data ?? []).map((l) => ({
            ...l,
            comprado: false,
            novo: false,
            emAlta: false,
            progresso: null,
          }))
        )
      );
  }, []);

  if (cards === null) return <VitrineRow titulo="Já disponível na Academy" carregando />;
  if (cards.length === 0) return null;
  return <VitrineRow titulo="Já disponível na Academy" cards={cards} />;
}
