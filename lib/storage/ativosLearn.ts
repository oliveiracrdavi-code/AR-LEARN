// Upload dos ativos de um Learn: VÍDEO vai pro Cloudflare R2 (10GB free
// + egress zero — o vídeo é o que gera tráfego alto quando as pessoas
// assistem, motivo real da troca); Ebook e mapa mental continuam no
// bucket PRIVADO `learns` do Supabase Storage (pequenos, não estouram
// nada). É o elo que a esteira do YouTube usa: renderizou/gerou =>
// chama subirAtivosDoLearn e o site passa a servir tudo via URLs
// assinadas (/api/learns/[slug]/ativos — cada provedor com seu próprio
// gerador de presigned URL, mesma janela de 1h). Sem guard "server-only"
// de propósito: roda em scripts standalone e GitHub Actions.
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createServiceRoleSupabaseClient } from "../supabase/serviceRoleClient";
import { subirParaR2, r2Configurado } from "./r2";

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

function contentTypeDe(caminho: string): string {
  return CONTENT_TYPES[extname(caminho).toLowerCase()] ?? "application/octet-stream";
}

// Ebook/mapa mental — inalterado, Supabase Storage.
export async function subirAtivoLearn(
  slug: string,
  caminhoLocal: string
): Promise<string> {
  const supabase = createServiceRoleSupabaseClient();
  const destino = `${slug}/${basename(caminhoLocal)}`;
  const conteudo = await readFile(caminhoLocal);

  const { error } = await supabase.storage
    .from(BUCKET_LEARNS)
    .upload(destino, conteudo, { contentType: contentTypeDe(caminhoLocal), upsert: true });
  if (error) {
    throw new Error(`Upload de ${caminhoLocal} falhou: ${error.message}`);
  }
  return destino; // caminho no bucket Supabase — vai pra coluna do learn
}

// Vídeo — R2. Key com o mesmo padrão de path do Supabase (slug/arquivo)
// pra manter previsibilidade entre os dois provedores.
export async function subirVideoLearn(slug: string, caminhoLocal: string): Promise<string> {
  if (!r2Configurado()) {
    throw new Error(
      "R2 não configurado (R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY ausentes) — " +
        "vídeo não foi enviado. Ebook/mapa seguem indo pro Supabase normalmente."
    );
  }
  const key = `${slug}/${basename(caminhoLocal)}`;
  const conteudo = await readFile(caminhoLocal);
  await subirParaR2(key, conteudo, contentTypeDe(caminhoLocal));
  return key; // key no bucket R2 — vai pra learns.video_url com video_storage='r2'
}

export async function subirAtivosDoLearn(
  slug: string,
  ativos: { video?: string; ebook?: string; mapa?: string }
): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const atualizacao: Record<string, string> = {};

  if (ativos.video) {
    atualizacao.video_url = await subirVideoLearn(slug, ativos.video);
    atualizacao.video_storage = "r2";
  }
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
