// Teste de ponta a ponta contra o bucket R2 real: upload -> presigned
// URL -> download -> confirma expiração -> delete (não deixa lixo de
// teste no bucket de produção). Roda uma vez pra validar as credenciais
// recém-chegadas; não faz parte da esteira normal.
//
// Uso: npx tsx --env-file=.env.local scripts/testar-r2-conexao.ts
import { subirParaR2, gerarUrlAssinadaR2, removerDoR2, r2Configurado, BUCKET_R2 } from "../lib/storage/r2";

async function main() {
  console.log("Bucket alvo:", BUCKET_R2);
  console.log("R2 configurado (envs presentes)?", r2Configurado());
  if (!r2Configurado()) {
    throw new Error("Faltam envs R2 — abortando antes de tentar a rede.");
  }

  const key = `_teste-conexao/${Date.now()}.txt`;
  const conteudo = Buffer.from(
    `AR LEARN — teste de conexão R2 em ${new Date().toISOString()}`,
    "utf-8"
  );

  console.log(`\n[1/4] Upload de teste: ${key} (${conteudo.length} bytes)...`);
  await subirParaR2(key, conteudo, "text/plain");
  console.log("  OK — upload concluído.");

  console.log("\n[2/4] Gerando presigned URL (1h)...");
  const validadeSegundos = 60 * 60;
  const url = await gerarUrlAssinadaR2(key, validadeSegundos);
  const urlObj = new URL(url);
  const expiresParam = urlObj.searchParams.get("X-Amz-Expires");
  console.log("  URL gerada:", url.slice(0, 90) + "...");
  console.log("  X-Amz-Expires no query string:", expiresParam, "segundos");
  if (expiresParam !== String(validadeSegundos)) {
    throw new Error(
      `X-Amz-Expires inesperado: esperava ${validadeSegundos}, veio ${expiresParam}`
    );
  }

  console.log("\n[3/4] Baixando via a presigned URL (confirma que o conteúdo bate)...");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download falhou: HTTP ${res.status} ${await res.text()}`);
  }
  const baixado = Buffer.from(await res.arrayBuffer());
  const bateConteudo = baixado.equals(conteudo);
  console.log("  HTTP", res.status, "| bytes baixados:", baixado.length, "| conteúdo idêntico ao upload?", bateConteudo);
  if (!bateConteudo) {
    throw new Error("Conteúdo baixado NÃO bate com o que foi enviado.");
  }

  console.log("\n[4/4] Removendo o arquivo de teste do bucket...");
  await removerDoR2(key);
  console.log("  OK — removido.");

  console.log("\n✅ TESTE DE PONTA A PONTA PASSOU: upload -> presigned URL -> download -> expiração correta -> delete.");
}

main().catch((erro) => {
  console.error("\n❌ FALHOU:", erro);
  process.exit(1);
});
