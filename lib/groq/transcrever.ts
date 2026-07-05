// Fallback de transcrição (Manual das Ferramentas, seção 4) — só entra
// em jogo quando baixarLegenda() devolve null.
//
// Nota importante: a YouTube Data API não expõe download de mídia/áudio
// bruto (só legendas). "Use o arquivo de áudio de origem" (a frase do
// manual) só faz sentido como o arquivo-fonte que a produção do canal já
// tem da gravação — não um download automático do YouTube. Por isso esta
// função recebe o áudio como parâmetro (Blob), em vez de tentar buscá-lo
// sozinha. Quem chama decide de onde vem esse Blob (upload manual,
// Supabase Storage etc.) — confirmar esse fluxo antes de usar em produção.
export async function transcreverAudioComGroq(
  audio: Blob,
  nomeArquivo: string
): Promise<string> {
  const form = new FormData();
  form.append("file", audio, nomeArquivo);
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "pt");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (res.status === 429) {
    throw new Error(
      "Groq rate limit (429) — free tier é ~2.000 transcrições/dia; usar fila/backoff."
    );
  }
  if (!res.ok) {
    throw new Error(`Groq transcrição falhou: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { text: string };
  return json.text;
}
