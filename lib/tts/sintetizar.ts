// Voz das videoaulas via Cloudflare Workers AI (modelo MeloTTS,
// @cf/myshell-ai/melotts). Troca de ferramenta registrada em
// docs/historico.md (2026-07-04): Google Cloud TTS exigia conta de
// faturamento com verificação de identidade, o que travou o uso na
// prática; Cloudflare já é conta existente (mesma do Pages), tier
// gratuito de 10.000 neurons/dia, sem cartão.
//
// RISCO CONHECIDO, AINDA NÃO VALIDADO: a documentação oficial do
// MeloTTS (Cloudflare e o repositório original myshell-ai/MeloTTS)
// lista suporte a inglês, espanhol, francês, chinês, japonês e
// coreano — português não aparece na lista, e há relato da comunidade
// de que até o espanhol (que está na lista) falha com "Invalid input".
// Por decisão do usuário, isso será testado com a API real assim que
// as credenciais chegarem, em vez de descartado sem testar — mas o
// resultado desse teste pode exigir trocar de modelo/idioma de novo.
//
// Sem guard "server-only" de propósito: este módulo roda em scripts e
// no render Remotion via GitHub Actions, fora da árvore do Next.js
// (mesmo motivo registrado pros outros módulos de pipeline na Fase 1).

const ENDPOINT_BASE = "https://api.cloudflare.com/client/v4/accounts";
const MODELO = "@cf/myshell-ai/melotts";
const IDIOMA = process.env.CLOUDFLARE_TTS_LANG || "pt";

// Limite conservador por requisição — o MeloTTS não documenta um
// limite de caracteres oficial (diferente do Google, que documenta
// ~5.000). Ajustar depois de medir com o modelo de verdade.
const LIMITE_CARACTERES_POR_REQUISICAO = 600;

interface WorkersAiResponse {
  success: boolean;
  result?: { audio: string }; // base64
  errors?: { code: number; message: string }[];
}

async function sintetizarBloco(texto: string): Promise<Buffer> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN não configuradas — precisa das credenciais do Cloudflare Workers AI."
    );
  }

  const res = await fetch(`${ENDPOINT_BASE}/${accountId}/ai/run/${MODELO}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: texto, lang: IDIOMA }),
  });

  const json = (await res.json()) as WorkersAiResponse;

  if (!res.ok || !json.success || !json.result) {
    throw new Error(
      `Cloudflare Workers AI (MeloTTS) falhou: ${res.status} ${JSON.stringify(json.errors ?? json)}`
    );
  }

  return Buffer.from(json.result.audio, "base64");
}

function dividirEmBlocos(texto: string, limite: number): string[] {
  if (texto.length <= limite) return [texto];

  const blocos: string[] = [];
  let restante = texto;
  while (restante.length > limite) {
    const corte = restante.lastIndexOf(". ", limite);
    const pontoDeCorte = corte > 0 ? corte + 1 : limite;
    blocos.push(restante.slice(0, pontoDeCorte).trim());
    restante = restante.slice(pontoDeCorte).trim();
  }
  if (restante) blocos.push(restante);
  return blocos;
}

// Sintetiza um roteiro inteiro, concatenando os blocos de áudio MP3.
// Concatenação simples (sem re-encode) — revisitar com ffmpeg (já
// disponível via Remotion) se algum player tiver problema de clique
// entre blocos.
export async function sintetizarRoteiro(textoCompleto: string): Promise<Buffer> {
  const blocos = dividirEmBlocos(textoCompleto, LIMITE_CARACTERES_POR_REQUISICAO);
  const audios: Buffer[] = [];
  for (const bloco of blocos) {
    audios.push(await sintetizarBloco(bloco));
  }
  return Buffer.concat(audios);
}
