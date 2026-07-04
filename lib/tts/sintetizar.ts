// Voz das videoaulas via Edge TTS (biblioteca msedge-tts, serviço "Read
// Aloud" do Microsoft Edge). Troca de ferramenta registrada em
// docs/historico.md: Cloudflare Workers AI (MeloTTS) foi testado com
// credencial real e REPROVADO por ouvido (misturava fonética de outro
// idioma). Edge TTS foi testado com a voz feminina (aprovada) e depois
// com 3 vozes masculinas candidatas — só pt-BR-AntonioNeural existe de
// fato no catálogo real (consultado via tts.getVoices(), não por
// documentação; pt-BR-HumbertoNeural e pt-BR-DonatoNeural não existem).
// Antonio foi ouvido e APROVADO por Davi como voz oficial e definitiva
// do projeto — não trocar sem aprovação explícita.
//
// RESSALVA (ver docs/regras.md): Edge TTS não é uma API oficial/paga da
// Microsoft — é o mesmo endpoint não documentado usado pelo recurso
// "Ler em voz alta" do navegador Edge. Sem SLA, pode ser bloqueado sem
// aviso. Plano C documentado (não implementado): Google Cloud TTS.
//
// Sem guard "server-only" de propósito: este módulo roda em scripts e
// no render Remotion via GitHub Actions, fora da árvore do Next.js
// (mesmo motivo registrado pros outros módulos de pipeline na Fase 1).
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const VOZ_OFICIAL = "pt-BR-AntonioNeural";

// Bitrate fixo do formato escolhido (AUDIO_24KHZ_96KBITRATE_MONO_MP3) —
// usado pra medir a duração real do áudio por matemática de bitrate
// constante (bytes*8/bitrate), em vez de sniffing de MIME-type
// (tentamos com a lib music-metadata, mas ela falhou de forma
// inconsistente em CI — "Guessed MIME-type not supported: audio/mpeg"
// mesmo com o hint de MIME explícito — mistério não vale a pena
// perseguir quando temos matemática exata disponível: MP3 CBR garante
// duração determinística a partir do tamanho em bytes; validado contra
// a mesma amostra que a music-metadata mediu, batendo exatamente
// 13.272s nos dois métodos).
const BITRATE_BPS = 96_000;

async function sintetizarTexto(texto: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOZ_OFICIAL, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(texto);
  const partes: Buffer[] = [];
  for await (const parte of audioStream) {
    partes.push(parte as Buffer);
  }
  return Buffer.concat(partes);
}

export interface CenaNarrada {
  buffer: Buffer;
  duracaoSegundos: number;
}

// Sintetiza o texto de uma cena e mede a duração REAL do áudio gerado
// (matemática de bitrate constante, não estimativa) — usado pra
// recalcular a duração do Sequence do Remotion com base na narração de
// verdade, em vez de confiar na estimativa do roteiro gerado pelo
// cérebro (OpenRouter só "chuta" a duração; quem manda é o áudio real).
export async function sintetizarCena(texto: string): Promise<CenaNarrada> {
  const buffer = await sintetizarTexto(texto);
  const duracaoSegundos = (buffer.length * 8) / BITRATE_BPS;
  return { buffer, duracaoSegundos };
}

export interface RoteiroNarrado {
  audioCompleto: Buffer;
  duracoesPorCena: number[];
}

// Sintetiza um roteiro inteiro (lista de textos de cena), concatenando
// os áudios na ordem (concatenação simples de frames MP3, sem
// re-encode — mesmo risco já registrado antes: revisitar com ffmpeg se
// algum player tiver problema de clique entre blocos) e retornando
// também a duração real medida de cada cena.
export async function sintetizarRoteiro(textosCenas: string[]): Promise<RoteiroNarrado> {
  const cenas: CenaNarrada[] = [];
  for (const texto of textosCenas) {
    cenas.push(await sintetizarCena(texto));
  }
  return {
    audioCompleto: Buffer.concat(cenas.map((c) => c.buffer)),
    duracoesPorCena: cenas.map((c) => c.duracaoSegundos),
  };
}
