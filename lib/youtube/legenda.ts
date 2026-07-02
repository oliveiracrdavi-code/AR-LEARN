import { chamarYoutubeApi, obterAccessToken } from "./oauth";

interface CaptionsListResponse {
  items?: { id?: string; snippet?: { language?: string } }[];
}

// Baixa a legenda (prioriza pt-*) de um vídeo específico. Retorna null
// se o vídeo não tem nenhuma faixa de legenda — nesse caso, quem chama
// deve cair para o fallback Groq.
export async function baixarLegenda(videoId: string): Promise<string | null> {
  const lista = await chamarYoutubeApi<CaptionsListResponse>("captions", {
    part: "snippet",
    videoId,
  });

  const faixas = lista.items ?? [];
  const faixaPt =
    faixas.find((f) => f.snippet?.language?.startsWith("pt")) ?? faixas[0];
  if (!faixaPt?.id) {
    return null;
  }

  const accessToken = await obterAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/captions/${faixaPt.id}?tfmt=srt`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new Error(`Download de legenda falhou: ${res.status} ${await res.text()}`);
  }

  return res.text();
}

// SRT bruto -> texto corrido, sem números de bloco nem timestamps.
export function srtParaTextoCorrido(srt: string): string {
  return srt
    .split(/\r?\n\r?\n/)
    .map((bloco) =>
      bloco
        .split(/\r?\n/)
        .filter(
          (linha) =>
            !/^\d+$/.test(linha.trim()) &&
            !/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(linha)
        )
        .join(" ")
        .trim()
    )
    .filter(Boolean)
    .join(" ");
}
