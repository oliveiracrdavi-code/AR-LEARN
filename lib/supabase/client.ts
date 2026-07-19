import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client-side (browser): usa a anon key, respeita RLS.
// Singleton: o GoTrue guarda a sessão (magic link) em localStorage e
// detecta o token na URL ao carregar (detectSessionInUrl, default true);
// múltiplas instâncias disputariam o mesmo storage.
let instancia: SupabaseClient | null = null;

export function createBrowserSupabaseClient() {
  if (!instancia) {
    instancia = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return instancia;
}
