// Ingestão via YouTube Data API v3 usando fetch puro (sem SDK pesado),
// pra ficar portável entre Node (script/GitHub Actions) e runtimes
// serverless (Supabase Edge Functions, Cloudflare Workers) — a camada
// de runtime definitiva só é decidida na Fase 5.
//
// captions.download exige OAuth do dono do canal; API key sozinha não
// funciona (Manual das Ferramentas, seção 3).

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

export async function obterAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Falha ao renovar o access token do YouTube: ${res.status} ${await res.text()}`
    );
  }

  const json = (await res.json()) as TokenResponse;
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return tokenCache.accessToken;
}

export async function chamarYoutubeApi<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const accessToken = await obterAccessToken();
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [chave, valor] of Object.entries(params)) {
    url.searchParams.set(chave, valor);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 403) {
    throw new Error(
      `YouTube API 403 (cota diária excedida ou escopo/permissão errada). Resposta: ${await res.text()}`
    );
  }
  if (!res.ok) {
    throw new Error(`YouTube API falhou: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}
