import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { BUCKET_LEARNS } from "@/lib/storage/ativosLearn";
import { gerarUrlAssinadaR2, r2Configurado } from "@/lib/storage/r2";

export const dynamic = "force-dynamic";

// URLs assinadas dos ativos de um Learn. O gate de acesso é o PRÓPRIO
// RLS: a consulta ao learn roda com o token do usuário (anon key +
// Authorization) — se a policy não devolver a linha, não existe
// assinatura. A service role só entra DEPOIS, pra assinar.
//
// Vídeo agora vive no Cloudflare R2 (video_storage='r2', padrão desde a
// migração); Ebook/mapa seguem no bucket privado do Supabase Storage.
// MESMO modelo de segurança nos dois: presigned URL de 1h gerada sob
// demanda, revalidando a compra a cada request — nunca link direto.
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
    .select("video_url, video_storage, ebook_url, mapa_mental_imagem_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  if (!learn) {
    return NextResponse.json({ erro: "sem acesso" }, { status: 403 });
  }
  const { video_url, video_storage, ebook_url, mapa_mental_imagem_url } = learn;

  const storageSupabase = createServiceRoleSupabaseClient().storage.from(BUCKET_LEARNS);

  async function resolverSupabase(valor: string | null): Promise<string | null> {
    if (!valor) return null;
    if (!assinavel(valor)) return valor; // URL externa (ex.: YouTube) passa direto
    const { data } = await storageSupabase.createSignedUrl(valor, VALIDADE_SEGUNDOS);
    return data?.signedUrl ?? null;
  }

  async function resolverVideo(): Promise<string | null> {
    if (!video_url) return null;
    if (!assinavel(video_url)) return video_url; // URL externa (ex.: YouTube)
    if (video_storage === "supabase") return resolverSupabase(video_url);
    // padrão: R2
    if (!r2Configurado()) return null; // credenciais ainda não chegaram — estado gracioso
    return gerarUrlAssinadaR2(video_url, VALIDADE_SEGUNDOS);
  }

  return NextResponse.json({
    video: await resolverVideo(),
    ebook: await resolverSupabase(ebook_url),
    mapa: await resolverSupabase(mapa_mental_imagem_url),
  });
}
