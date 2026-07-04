// Testa a camada de ingestão do YouTube (lib/youtube/*) com respostas
// SIMULADAS da API — sem rede real, sem credenciais. Valida paginação,
// extração/priorização de legenda, o gatilho do fallback (retorno null)
// e o tratamento de erro 403 (cota). Roda com: npm run youtube:teste
//
// Define variáveis dummy pra chamarYoutubeApi/obterAccessToken não
// quebrarem por env var ausente (o valor não importa, o fetch é mockado).
process.env.YOUTUBE_CLIENT_ID ??= "mock-client-id";
process.env.YOUTUBE_CLIENT_SECRET ??= "mock-client-secret";
process.env.YOUTUBE_REFRESH_TOKEN ??= "mock-refresh-token";

// ─── Mock do fetch global ──────────────────────────────────────────
type Handler = (url: URL) => Response | null;

const handlers: Handler[] = [];
function mockar(handler: Handler) {
  handlers.push(handler);
}

let chamadasTokenEndpoint = 0;
let chamadasPlaylistItems = 0;

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  for (const handler of handlers) {
    const res = handler(url);
    if (res) return res;
  }
  throw new Error(`Nenhum mock casou com: ${url.toString()}`);
}) as typeof fetch;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function texto(body: string, status = 200) {
  return new Response(body, { status });
}

mockar((url) => {
  if (url.hostname === "oauth2.googleapis.com" && url.pathname === "/token") {
    chamadasTokenEndpoint++;
    return json({ access_token: "mock-access-token", expires_in: 3600 });
  }
  return null;
});

mockar((url) => {
  if (url.pathname === "/youtube/v3/channels") {
    return json({
      items: [
        { contentDetails: { relatedPlaylists: { uploads: "UUmockuploads123" } } },
      ],
    });
  }
  return null;
});

mockar((url) => {
  if (url.pathname === "/youtube/v3/playlistItems") {
    chamadasPlaylistItems++;
    const pageToken = url.searchParams.get("pageToken");

    if (!pageToken) {
      return json({
        items: [
          {
            snippet: { title: "Episódio 1 — mock" },
            contentDetails: { videoId: "vid001", videoPublishedAt: "2026-01-01T00:00:00Z" },
          },
          {
            snippet: { title: "Episódio 2 — mock" },
            contentDetails: { videoId: "vid002", videoPublishedAt: "2026-01-08T00:00:00Z" },
          },
        ],
        nextPageToken: "PAGINA_2",
      });
    }

    if (pageToken === "PAGINA_2") {
      return json({
        items: [
          {
            snippet: { title: "Episódio 3 — mock" },
            contentDetails: { videoId: "vid003", videoPublishedAt: "2026-01-15T00:00:00Z" },
          },
        ],
        // sem nextPageToken: fim da paginação
      });
    }
  }
  return null;
});

mockar((url) => {
  if (url.pathname === "/youtube/v3/captions") {
    const videoId = url.searchParams.get("videoId");

    if (videoId === "vid-com-legenda") {
      return json({
        items: [
          { id: "caption-en", snippet: { language: "en" } },
          { id: "caption-pt", snippet: { language: "pt-BR" } },
        ],
      });
    }
    if (videoId === "vid-sem-legenda") {
      return json({ items: [] });
    }
    if (videoId === "vid-cota-excedida") {
      return json({ error: { message: "quotaExceeded" } }, 403);
    }
  }
  return null;
});

mockar((url) => {
  if (url.pathname === "/youtube/v3/captions/caption-pt") {
    return texto(
      "1\n00:00:00,000 --> 00:00:02,000\nOlá, seja bem-vindo ao Altamente Rentável.\n\n" +
        "2\n00:00:02,500 --> 00:00:05,000\nHoje vamos falar de short stay.\n"
    );
  }
  return null;
});

// ─── Testes ────────────────────────────────────────────────────────
import { obterUploadsPlaylistId, listarVideosDoCanal } from "../lib/youtube/canal";
import { baixarLegenda, srtParaTextoCorrido } from "../lib/youtube/legenda";
import { chamarYoutubeApi } from "../lib/youtube/oauth";

const resultados: boolean[] = [];

function checar(nome: string, condicao: boolean, detalhe?: string) {
  console.log(`[${condicao ? "OK" : "FALHOU"}] ${nome}${detalhe ? " — " + detalhe : ""}`);
  resultados.push(condicao);
}

async function main() {
  const playlistId = await obterUploadsPlaylistId("UCmockchannel");
  checar("obterUploadsPlaylistId retorna o id certo", playlistId === "UUmockuploads123", playlistId);

  const videos = await listarVideosDoCanal(playlistId);
  checar("listarVideosDoCanal segue a paginação (3 vídeos em 2 páginas)", videos.length === 3, `obtidos: ${videos.length}`);
  checar("listarVideosDoCanal chamou playlistItems 2 vezes (paginação real)", chamadasPlaylistItems === 2, `chamadas: ${chamadasPlaylistItems}`);
  checar(
    "ordem/dados dos vídeos preservados",
    videos[0].videoId === "vid001" && videos[2].videoId === "vid003" && videos[2].titulo === "Episódio 3 — mock"
  );

  const srt = await baixarLegenda("vid-com-legenda");
  checar("baixarLegenda prioriza a faixa pt-BR (não a en)", typeof srt === "string" && srt.includes("short stay"));

  const textoCorrido = srtParaTextoCorrido(srt!);
  checar(
    "srtParaTextoCorrido remove números/timestamps",
    !/-->/.test(textoCorrido) && !/^\d+$/m.test(textoCorrido) && textoCorrido.includes("Altamente Rentável")
  );

  const srtAusente = await baixarLegenda("vid-sem-legenda");
  checar("baixarLegenda retorna null quando não há legenda (gatilho do fallback Groq)", srtAusente === null);

  let erroCota: Error | null = null;
  try {
    await chamarYoutubeApi("captions", { part: "snippet", videoId: "vid-cota-excedida" });
  } catch (erro) {
    erroCota = erro as Error;
  }
  checar(
    "chamarYoutubeApi trata 403 com mensagem clara de cota",
    erroCota !== null && /403|cota/i.test(erroCota.message)
  );

  checar("token OAuth foi obtido e cacheado (só 1 chamada ao endpoint de token)", chamadasTokenEndpoint === 1, `chamadas: ${chamadasTokenEndpoint}`);

  globalThis.fetch = originalFetch;

  if (resultados.every(Boolean)) {
    console.log(`\n${resultados.length}/${resultados.length} testes passaram — ingestão YouTube validada com mocks.`);
  } else {
    console.error(`\n${resultados.filter(Boolean).length}/${resultados.length} testes passaram — investigar antes de usar em produção.`);
    process.exit(1);
  }
}

main();
