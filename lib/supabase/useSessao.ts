"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "./client";

// Sessão do comprador no client. `carregando` cobre a janela em que o
// GoTrue ainda está lendo o localStorage / o token do magic link na URL —
// sem isso a página piscaria "não logado" pra quem está logado.
export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSessao(s);
      setCarregando(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { sessao, carregando };
}
