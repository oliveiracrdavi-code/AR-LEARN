// Sobe os ativos de um Learn pro Storage e preenche as colunas no banco.
// É o passo final da esteira (o workflow do YouTube chama isso depois de
// renderizar o vídeo e gerar o Ebook/mapa). Também serve manualmente:
//
//   npx tsx scripts/subir-ativos-learn.ts <slug> \
//     [--video caminho.mp4] [--ebook caminho.pdf] [--mapa caminho.png]
//
// Requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY no env.
import { subirAtivosDoLearn } from "../lib/storage/ativosLearn";

function argumento(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const slug = process.argv[2];
  if (!slug || slug.startsWith("--")) {
    throw new Error("Uso: subir-ativos-learn.ts <slug> [--video ...] [--ebook ...] [--mapa ...]");
  }

  const ativos = {
    video: argumento("--video"),
    ebook: argumento("--ebook"),
    mapa: argumento("--mapa"),
  };
  if (!ativos.video && !ativos.ebook && !ativos.mapa) {
    throw new Error("Nada pra subir: passe pelo menos um de --video/--ebook/--mapa.");
  }

  await subirAtivosDoLearn(slug, ativos);
  console.log(`OK — ativos do learn "${slug}" no Storage e colunas preenchidas:`);
  for (const [tipo, caminho] of Object.entries(ativos)) {
    if (caminho) console.log(`  ${tipo}: ${caminho}`);
  }
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
