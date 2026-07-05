import { createClient } from "@supabase/supabase-js";

// Client-side (browser): usa a anon key, respeita RLS.
export function createBrowserSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
