// Gera o fixture "real" da Fase 2: transcrição substancial e genérica
// sobre mercado imobiliário -> cérebro (OpenRouter) -> JSON do Learn ->
// imagem do mapa mental (Kroki). Precisa de rede real (OpenRouter +
// Kroki), por isso roda via GitHub Actions, não nesta sandbox.
//
// Imprime JSON e SVG delimitados no stdout pra serem extraídos do log
// da Action depois (não temos artifact download nas ferramentas
// disponíveis nesta sessão).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { gerarLearnDoEpisodio } from "../lib/openrouter/gerarLearn";
import { renderizarMapaMentalKroki } from "../lib/mapa-mental/kroki";
import { logComTimestamp } from "../lib/util/log";

async function main() {
  const transcricao = await readFile(
    "scripts/fixtures/transcricao-mercado-imobiliario.txt",
    "utf-8"
  );

  logComTimestamp("Iniciando geração do fixture (cérebro OpenRouter + mapa mental Kroki)...");
  const learn = await gerarLearnDoEpisodio(transcricao, {
    videoId: "FIXTURE_MERCADO_IMOBILIARIO",
    titulo: "Como funciona o mercado imobiliário",
  });

  await mkdir("scripts/output", { recursive: true });
  const caminhoJson = "scripts/output/fixture-mercado-imobiliario.json";
  await writeFile(caminhoJson, JSON.stringify(learn, null, 2), "utf-8");

  const duracaoTotal = learn.learn.video_roteiro.cenas.reduce(
    (soma, cena) => soma + cena.duracao_seg,
    0
  );
  console.log("Título:", learn.learn.titulo);
  console.log("Seções do PDF:", learn.learn.pdf.secoes.length);
  console.log("Cenas do roteiro:", learn.learn.video_roteiro.cenas.length);
  console.log("Duração total:", duracaoTotal, "s");
  console.log("JSON salvo em:", caminhoJson);

  const svgBuffer = await renderizarMapaMentalKroki(learn.learn.mapa_mental_mermaid, "svg");
  const caminhoSvg = "scripts/output/fixture-mercado-imobiliario-mapa.svg";
  await writeFile(caminhoSvg, svgBuffer);
  console.log("SVG salvo em:", caminhoSvg, `(${svgBuffer.length} bytes)`);

  const pngBuffer = await renderizarMapaMentalKroki(learn.learn.mapa_mental_mermaid, "png");
  const caminhoPng = "scripts/output/fixture-mercado-imobiliario-mapa.png";
  await writeFile(caminhoPng, pngBuffer);
  console.log("PNG salvo em:", caminhoPng, `(${pngBuffer.length} bytes)`);

  console.log("===JSON_START===");
  console.log(JSON.stringify(learn));
  console.log("===JSON_END===");
  console.log("===SVG_START===");
  console.log(svgBuffer.toString("utf-8"));
  console.log("===SVG_END===");
  console.log("===MAPA_PNG_BASE64_START===");
  console.log(pngBuffer.toString("base64"));
  console.log("===MAPA_PNG_BASE64_END===");
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
