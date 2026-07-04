// OBSOLETO (2026-07-04) — substituído por Cloudflare Workers AI
// (MeloTTS), ver lib/tts/sintetizar.ts e docs/historico.md.
// Motivo da troca: Google Cloud exige conta de faturamento com
// verificação de identidade/CPF, o que travou o uso na prática.
// Mantido aqui só de referência — não importar em código novo.
import { obterAccessTokenGoogle } from "./googleAuth";

// Voz pt-BR única e fixa pro projeto todo (identidade sonora — Manual
// das Ferramentas, seção 6). Não é clonagem.
const VOZ_PADRAO = process.env.GOOGLE_TTS_VOICE_NAME || "pt-BR-Wavenet-B";
const LIMITE_CARACTERES_POR_REQUISICAO = 4500; // margem sob o limite de ~5.000 da API

interface SynthesizeResponse {
  audioContent: string; // base64
}

async function sintetizarBloco(texto: string): Promise<Buffer> {
  const accessToken = await obterAccessTokenGoogle();

  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: { text: texto },
      voice: { languageCode: "pt-BR", name: VOZ_PADRAO },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Cloud TTS falhou: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as SynthesizeResponse;
  return Buffer.from(json.audioContent, "base64");
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

// Sintetiza um roteiro inteiro (pode passar do limite de ~5.000
// caracteres por requisição), concatenando os blocos de áudio MP3.
// Concatenação simples de MP3 (sem re-encode) — suficiente para
// reprodução sequencial; se algum player tiver problema de clique
// entre blocos, revisitar com ffmpeg (já disponível via Remotion).
export async function sintetizarRoteiro(textoCompleto: string): Promise<Buffer> {
  const blocos = dividirEmBlocos(textoCompleto, LIMITE_CARACTERES_POR_REQUISICAO);
  const audios = await Promise.all(blocos.map(sintetizarBloco));
  return Buffer.concat(audios);
}
