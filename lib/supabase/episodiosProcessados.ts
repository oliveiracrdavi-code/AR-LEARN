import { createServiceRoleSupabaseClient } from "./serviceRoleClient";

export async function jaProcessado(youtubeVideoId: string): Promise<boolean> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("episodios_processados")
    .select("id")
    .eq("youtube_video_id", youtubeVideoId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function registrarInicioProcessamento(params: {
  youtubeVideoId: string;
  titulo: string;
  dataPublicacaoYoutube: string;
}): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("episodios_processados").insert({
    youtube_video_id: params.youtubeVideoId,
    titulo: params.titulo,
    data_publicacao_youtube: params.dataPublicacaoYoutube,
    status_pipeline: "transcrevendo",
  });
  if (error) throw error;
}

export async function registrarResultado(params: {
  youtubeVideoId: string;
  statusPipeline: "estruturando" | "erro";
  erroLog?: string;
}): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("episodios_processados")
    .update({
      status_pipeline: params.statusPipeline,
      processado_em: new Date().toISOString(),
      erro_log: params.erroLog ?? null,
    })
    .eq("youtube_video_id", params.youtubeVideoId);
  if (error) throw error;
}
