// Teste ISOLADO do Cloudflare Workers AI (MeloTTS): só "texto em
// português -> áudio", direto no endpoint, antes de plugar no pipeline
// inteiro. Não usa lib/tts/sintetizar.ts de propósito — quero ver o
// resultado bruto da API primeiro.
import { writeFile } from "node:fs/promises";

const TEXTO_TESTE =
  "Olá! Este é um teste de voz em português brasileiro, usando o Cloudflare Workers AI. " +
  "Se você está ouvindo isso claramente, com pronúncia correta e sotaque brasileiro, o teste funcionou.";

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN não configuradas.");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/myshell-ai/melotts`;
  console.log("Chamando:", url);
  console.log("Texto:", TEXTO_TESTE);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: TEXTO_TESTE, lang: "pt" }),
  });

  const bodyText = await res.text();
  console.log("HTTP status:", res.status);

  let json: { success?: boolean; result?: { audio?: string }; errors?: unknown };
  try {
    json = JSON.parse(bodyText);
  } catch {
    console.log("Resposta não é JSON. Primeiros 500 chars:", bodyText.slice(0, 500));
    process.exit(1);
  }

  if (!res.ok || !json.success || !json.result?.audio) {
    console.log("FALHOU. Corpo da resposta:", JSON.stringify(json, null, 2));
    process.exit(1);
  }

  const audioBuffer = Buffer.from(json.result.audio, "base64");
  const caminho = "scripts/output/teste-tts-cloudflare-pt.mp3";
  await writeFile(caminho, audioBuffer);

  console.log("OK — áudio salvo em:", caminho, `(${audioBuffer.length} bytes)`);
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
