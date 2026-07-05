import { createSign } from "node:crypto";

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

function base64Url(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function lerServiceAccount(): ServiceAccount {
  const bruto = process.env.GOOGLE_CLOUD_TTS_CREDENTIALS_JSON;
  if (!bruto) {
    throw new Error(
      "GOOGLE_CLOUD_TTS_CREDENTIALS_JSON não configurada — precisa da service account key do Google Cloud TTS."
    );
  }
  return JSON.parse(bruto) as ServiceAccount;
}

// Fluxo OAuth2 de service account (JWT assertion), sem SDK do Google —
// mesma filosofia de fetch puro do resto do pipeline.
export async function obterAccessTokenGoogle(): Promise<string> {
  const conta = lerServiceAccount();
  const agoraSeg = Math.floor(Date.now() / 1000);

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: conta.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: conta.token_uri,
      iat: agoraSeg,
      exp: agoraSeg + 3600,
    })
  );

  const assinatura = base64Url(
    createSign("RSA-SHA256").update(`${header}.${payload}`).sign(conta.private_key)
  );

  const jwt = `${header}.${payload}.${assinatura}`;

  const res = await fetch(conta.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao obter access token do Google: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}
