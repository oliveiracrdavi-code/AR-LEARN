// Teste ponta a ponta da Fase 1: ingestão + cérebro para 1 episódio.
// Não gera PDF/mapa/vídeo (Fase 2) nem publica nada (Fase 3).
//
// Uso:
//   npm run fase1:teste -- [youtube_video_id]
// Sem argumento, pega o episódio mais recente da uploads playlist.
import { mkdir, writeFile } from "node:fs/promises";
import { obterUploadsPlaylistId, listarVideosDoCanal } from "../lib/youtube/canal";
import { baixarLegenda, srtParaTextoCorrido } from "../lib/youtube/legenda";
import { gerarLearnDoEpisodio } from "../lib/openrouter/gerarLearn";
import {
  jaProcessado,
  registrarInicioProcessamento,
  registrarResultado,
} from "../lib/supabase/episodiosProcessados";

async function main() {
  const videoIdArg = process.argv[2];
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!channelId) {
    throw new Error("Defina YOUTUBE_CHANNEL_ID no .env.local para rodar o teste.");
  }

  const uploadsPlaylistId = await obterUploadsPlaylistId(channelId);
  const videos = await listarVideosDoCanal(uploadsPlaylistId);

  const alvo = videoIdArg
    ? videos.find((v) => v.videoId === videoIdArg)
    : videos[0];

  if (!alvo) {
    throw new Error("Episódio não encontrado na uploads playlist do canal.");
  }

  console.log(`Episódio alvo: "${alvo.titulo}" (${alvo.videoId})`);

  if (await jaProcessado(alvo.videoId)) {
    console.log("Já processado (idempotência) — encerrando sem duplicar.");
    return;
  }

  await registrarInicioProcessamento({
    youtubeVideoId: alvo.videoId,
    titulo: alvo.titulo,
    dataPublicacaoYoutube: alvo.publicadoEm,
  });

  try {
    const srt = await baixarLegenda(alvo.videoId);
    if (!srt) {
      throw new Error(
        "Sem legenda utilizável neste vídeo. O fallback Groq exige o áudio-fonte " +
          "fornecido manualmente (ver nota em lib/groq/transcrever.ts) — escolha um " +
          "episódio com legenda para este teste."
      );
    }
    const transcricao = srtParaTextoCorrido(srt);
    console.log(`Transcrição obtida: ${transcricao.length} caracteres.`);

    const learn = await gerarLearnDoEpisodio(transcricao, {
      videoId: alvo.videoId,
      titulo: alvo.titulo,
    });

    await mkdir("scripts/output", { recursive: true });
    const caminho = `scripts/output/${alvo.videoId}.json`;
    await writeFile(caminho, JSON.stringify(learn, null, 2), "utf-8");

    await registrarResultado({
      youtubeVideoId: alvo.videoId,
      statusPipeline: "estruturando",
    });

    const duracaoTotal = learn.learn.video_roteiro.cenas.reduce(
      (soma, cena) => soma + cena.duracao_seg,
      0
    );

    console.log("\nOK — Learn estruturado:");
    console.log("  Título:", learn.learn.titulo);
    console.log("  Trilha / Módulo:", learn.learn.trilha, "/", learn.learn.modulo);
    console.log("  Seções do PDF:", learn.learn.pdf.secoes.length);
    console.log("  Cenas do roteiro:", learn.learn.video_roteiro.cenas.length);
    console.log("  Duração estimada do vídeo:", Math.round(duracaoTotal / 60), "min");
    console.log("  JSON completo salvo em:", caminho);
  } catch (erro) {
    await registrarResultado({
      youtubeVideoId: alvo.videoId,
      statusPipeline: "erro",
      erroLog: erro instanceof Error ? erro.message : String(erro),
    });
    throw erro;
  }
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
