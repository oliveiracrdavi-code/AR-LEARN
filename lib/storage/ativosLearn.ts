// Upload dos ativos de um Learn (vídeo, Ebook, mapa mental) pro bucket
// PRIVADO `learns` + preenchimento das colunas do banco. É o elo que a
// esteira do YouTube usa quando a chave chegar: renderizou/gerou =>
// chama subirAtivosDoLearn e o site passa a servir tudo via URLs
// assinadas (/api/learns/[slug]/ativos). Sem guard "server-only" de
// propósito: roda em scripts standalone e GitHub Actions.
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createServiceRoleSupabaseClient } from "../supabase/serviceRoleClient";

export const BUCKET_LEARNS = "learns";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".html": "text/html",
};

export async function subirAtivoLearn(
  slug: string,
  caminhoLocal: string
): Promise<string> {
  const supabase = createServiceRoleSupabaseClient();
  const destino = `${slug}/${basename(caminhoLocal)}`;
  const conteudo = await readFile(caminhoLocal);
  const contentType =
    CONTENT_TYPES[extname(caminhoLocal).toLowerCase()] ?? "application/octet-stream";

  const { error } = await supabase.storage
    .from(BUCKET_LEARNS)
    .upload(destino, conteudo, { contentType, upsert: true });
  if (error) {
    throw new Error(`Upload de ${caminhoLocal} falhou: ${error.message}`);
  }
  return destino; // caminho no bucket — é o que vai pra coluna do learn
}

export async function subirAtivosDoLearn(
  slug: string,
  ativos: { video?: string; ebook?: string; mapa?: string }
): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const atualizacao: Record<string, string> = {};

  if (ativos.video) atualizacao.video_url = await subirAtivoLearn(slug, ativos.video);
  if (ativos.ebook) atualizacao.ebook_url = await subirAtivoLearn(slug, ativos.ebook);
  if (ativos.mapa) {
    atualizacao.mapa_mental_imagem_url = await subirAtivoLearn(slug, ativos.mapa);
  }

  if (Object.keys(atualizacao).length === 0) return;

  const { data, error } = await supabase
    .from("learns")
    .update(atualizacao)
    .eq("slug", slug)
    .select("slug");
  if (error) throw new Error(`Update do learn ${slug} falhou: ${error.message}`);
  if (!data?.length) throw new Error(`Learn com slug "${slug}" não existe.`);
}
