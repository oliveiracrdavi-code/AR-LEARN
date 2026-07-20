// Enfileira TODO o catálogo do canal (histórico completo + qualquer
// episódio novo) em episodios_processados como 'pendente' — ordem do
// prompt: a fila nasce com tudo dentro desde o deploy, sem lotes
// manuais. Idempotente: o unique de youtube_video_id ignora repetidos,
// então pode rodar quantas vezes quiser (inclusive agendado).
//
// Uso: npx tsx scripts/enfileirar-catalogo.ts
// Requer: YOUTUBE_API_KEY/OAuth + YOUTUBE_CHANNEL_ID + Supabase envs.
import { obterUploadsPlaylistId, listarVideosDoCanal } from "../lib/youtube/canal";
import { createServiceRoleSupabaseClient } from "../lib/supabase/serviceRoleClient";

async function main() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) throw new Error("Defina YOUTUBE_CHANNEL_ID no ambiente.");

  const playlist = await obterUploadsPlaylistId(channelId);
  const videos = await listarVideosDoCanal(playlist);
  console.log(`Canal tem ${videos.length} vídeo(s) na uploads playlist.`);

  const supabase = createServiceRoleSupabaseClient();
  let novos = 0;
  // Lotes de 100 pra não estourar payload; upsert ignorando existentes
  // preserva o status de quem já está em processamento/concluído.
  for (let i = 0; i < videos.length; i += 100) {
    const lote = videos.slice(i, i + 100).map((v) => ({
      youtube_video_id: v.videoId,
      titulo: v.titulo,
      data_publicacao_youtube: v.publicadoEm,
      status_pipeline: "pendente",
    }));
    const { data, error } = await supabase
      .from("episodios_processados")
      .upsert(lote, { onConflict: "youtube_video_id", ignoreDuplicates: true })
      .select("youtube_video_id");
    if (error) throw new Error(`Lote ${i / 100 + 1} falhou: ${error.message}`);
    novos += data?.length ?? 0;
  }

  console.log(`OK — ${novos} episódio(s) NOVOS enfileirados (os demais já estavam na fila).`);
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
