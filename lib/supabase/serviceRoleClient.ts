import { createClient } from "@supabase/supabase-js";

// Fábrica do client com a service role key (ignora RLS). Sem o guard
// "server-only" de propósito: este módulo também é usado por scripts
// standalone (Node) e futuras GitHub Actions da esteira autônoma, que
// não passam pelo bundler do Next.js — o guard quebraria essa execução.
// Dentro do app Next.js, importe de "./server" (que reexporta isto com
// o guard "server-only" ligado).
export function createServiceRoleSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
