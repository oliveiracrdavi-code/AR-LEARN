import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { BUCKET_LEARNS } from "@/lib/storage/ativosLearn";

export const dynamic = "force-dynamic";

// URLs assinadas dos ativos de um Learn (bucket privado). O gate de
// acesso é o PRÓPRIO RLS: a consulta ao learn roda com o token do
// usuário (anon key + Authorization) — se a policy não devolver a linha,
// não existe assinatura. A service role só entra DEPOIS, pra assinar.
const VALIDADE_SEGUNDOS = 60 * 60; // 1h — a página re-pede quando expira

function assinavel(valor: string | null): valor is string {
  return !!valor && !/^https?:\/\//.test(valor);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  }

  const comoUsuario = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } }
  );

  const { data: learn, error } = await comoUsuario
    .from("learns")
    .select("video_url, ebook_url, mapa_mental_imagem_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  if (!learn) {
    return NextResponse.json({ erro: "sem acesso" }, { status: 403 });
  }

  const storage = createServiceRoleSupabaseClient().storage.from(BUCKET_LEARNS);
  async function resolver(valor: string | null): Promise<string | null> {
    if (!valor) return null;
    if (!assinavel(valor)) return valor; // URL externa (ex.: YouTube) passa direto
    const { data } = await storage.createSignedUrl(valor, VALIDADE_SEGUNDOS);
    return data?.signedUrl ?? null;
  }

  return NextResponse.json({
    video: await resolver(learn.video_url),
    ebook: await resolver(learn.ebook_url),
    mapa: await resolver(learn.mapa_mental_imagem_url),
  });
}
