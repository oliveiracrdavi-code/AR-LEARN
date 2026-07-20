// Processador da fila: pega os próximos N episódios 'pendente' e roda a
// etapa de ESTRUTURAÇÃO (legenda -> cérebro OpenRouter -> learn no banco
// respeitando o modo de publicação). O render de vídeo/Ebook/mapa roda
// no workflow do GitHub Actions (compute) e chama learn:subir-ativos ao
// final — este script é o elo transcrição->conteúdo estruturado.
//
// Concorrência: SEQUENCIAL por padrão (limite real de compute/API, não
// escolha de produto — ver docs/fila-geracao-log.md). LOTE controla
// quantos episódios por execução (cron/workflow chama de novo até
// esvaziar a fila).
//
// Uso: npx tsx scripts/processar-fila.ts [--lote 5]
import { baixarLegenda, srtParaTextoCorrido } from "../lib/youtube/legenda";
import { gerarLearnDoEpisodio } from "../lib/openrouter/gerarLearn";
import { melhorThumbnail } from "../lib/youtube/canal";
import { chamarYoutubeApi } from "../lib/youtube/oauth";
import { createServiceRoleSupabaseClient } from "../lib/supabase/serviceRoleClient";

const LOTE = (() => {
  const i = process.argv.indexOf("--lote");
  return i >= 0 ? Math.max(1, Number(process.argv[i + 1]) || 1) : 5;
})();

async function thumbnailDoVideo(videoId: string): Promise<string | null> {
  try {
    const data = await chamarYoutubeApi<{
      items?: { snippet?: { thumbnails?: Record<string, { url?: string }> } }[];
    }>("videos", { part: "snippet", id: videoId });
    return melhorThumbnail(data.items?.[0]?.snippet?.thumbnails);
  } catch {
    return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`; // cascata no card cobre
  }
}

async function main() {
  const supabase = createServiceRoleSupabaseClient();

  const { data: modoCfg } = await supabase
    .from("plataforma_config")
    .select("valor")
    .eq("chave", "modo_publicacao")
    .maybeSingle();
  const statusFinal = modoCfg?.valor === "automatico" ? "publicado" : "em_revisao";

  // Módulo padrão da esteira (primeiro módulo da primeira trilha) — o
  // reagrupamento fino por trilha é curadoria posterior no admin.
  const { data: modulo } = await supabase
    .from("modulos")
    .select("id")
    .order("ordem")
    .limit(1)
    .maybeSingle();
  if (!modulo) throw new Error("Nenhum módulo cadastrado — rode o seed antes.");

  const { data: pendentes, error } = await supabase
    .from("episodios_processados")
    .select("youtube_video_id, titulo")
    .eq("status_pipeline", "pendente")
    .order("data_publicacao_youtube", { ascending: false })
    .limit(LOTE);
  if (error) throw error;
  if (!pendentes?.length) {
    console.log("Fila vazia — nada a processar.");
    return;
  }

  console.log(`Processando ${pendentes.length} episódio(s) (modo: ${statusFinal})...`);
  let ok = 0;
  for (const ep of pendentes) {
    const inicio = Date.now();
    try {
      await supabase
        .from("episodios_processados")
        .update({ status_pipeline: "transcrevendo" })
        .eq("youtube_video_id", ep.youtube_video_id);

      const srt = await baixarLegenda(ep.youtube_video_id);
      if (!srt) {
        throw new Error("sem legenda utilizável (fallback Groq exige áudio-fonte manual)");
      }
      const transcricao = srtParaTextoCorrido(srt);

      await supabase
        .from("episodios_processados")
        .update({ status_pipeline: "estruturando" })
        .eq("youtube_video_id", ep.youtube_video_id);

      const learn = await gerarLearnDoEpisodio(transcricao, {
        videoId: ep.youtube_video_id,
        titulo: ep.titulo ?? ep.youtube_video_id,
      });
      const thumb = await thumbnailDoVideo(ep.youtube_video_id);

      const slug = learn.learn.titulo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60);

      const { data: criado, error: erroLearn } = await supabase
        .from("learns")
        .insert({
          modulo_id: modulo.id,
          slug,
          titulo: learn.learn.titulo,
          resumo: learn.learn.pdf.secoes[0]?.corpo?.slice(0, 280) ?? null,
          status: statusFinal,
          thumbnail_url: thumb,
          mapa_mental_json: { mermaid: learn.learn.mapa_mental_mermaid },
          duracao_segundos: Math.round(
            learn.learn.video_roteiro.cenas.reduce((s, c) => s + c.duracao_seg, 0)
          ),
          publicado_at: statusFinal === "publicado" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();
      if (erroLearn) throw erroLearn;

      await supabase
        .from("episodios_processados")
        .update({
          status_pipeline: "gerando_ativos", // workflow de render assume daqui
          learn_id: criado.id,
          processado_em: new Date().toISOString(),
        })
        .eq("youtube_video_id", ep.youtube_video_id);

      ok += 1;
      console.log(
        `  ok: ${ep.youtube_video_id} -> "${learn.learn.titulo}" em ${Math.round((Date.now() - inicio) / 1000)}s (${statusFinal})`
      );
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      await supabase
        .from("episodios_processados")
        .update({ status_pipeline: "erro", erro_log: msg.slice(0, 1000) })
        .eq("youtube_video_id", ep.youtube_video_id);
      console.error(`  ERRO: ${ep.youtube_video_id} — ${msg}`);
    }
  }
  console.log(`Lote concluído: ${ok}/${pendentes.length} estruturados.`);
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
