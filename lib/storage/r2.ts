// Cloudflare R2 — S3-compatible, usado SÓ pra vídeo renderizado (10GB
// free + egress zero pra sempre; é o que justifica a troca, já que
// vídeo assistido gera tráfego alto). Ebook e mapa mental continuam no
// Supabase Storage — são pequenos, não estouram nada (ver
// docs/migracao-r2-log.md pelo racional completo).
//
// Sem guard "server-only" de propósito: roda em scripts/Actions da
// esteira também, igual ao padrão do serviceRoleClient.
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const BUCKET_R2 = process.env.R2_BUCKET_NAME || "ar-learn-videos";

function envsPresentes(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

let cliente: S3Client | null = null;

function getR2Client(): S3Client {
  if (!envsPresentes()) {
    throw new Error(
      "R2 não configurado: faltam R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY no ambiente."
    );
  }
  if (!cliente) {
    cliente = new S3Client({
      region: "auto",
      endpoint:
        process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return cliente;
}

// R2 configurado o suficiente pra operar (upload/URL). Usado pelo
// roteamento de upload e pela rota de ativos pra decidir o caminho de
// resolução sem lançar exceção em produção sem as chaves ainda.
export function r2Configurado(): boolean {
  return envsPresentes();
}

export async function subirParaR2(key: string, conteudo: Buffer, contentType: string): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: BUCKET_R2,
      Key: key,
      Body: conteudo,
      ContentType: contentType,
    })
  );
}

// Presigned URL de download — MESMO modelo de segurança do Supabase
// Storage: duração curta (1h), gerada sob demanda, só depois que o
// chamador já revalidou a compra do usuário (a rota de ativos faz isso
// antes de chegar aqui). R2 fala S3 puro, então getSignedUrl funciona
// igual a qualquer bucket S3 — nada de "link direto"/acesso público.
export async function gerarUrlAssinadaR2(key: string, validadeSegundos: number): Promise<string> {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: BUCKET_R2, Key: key }),
    { expiresIn: validadeSegundos }
  );
}

export async function removerDoR2(key: string): Promise<void> {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: BUCKET_R2, Key: key }));
}
