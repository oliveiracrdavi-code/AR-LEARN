// Teste isolado do cérebro (OpenRouter): transcrição de exemplo -> JSON
// validado contra o contrato do Learn. Não depende do YouTube.
// Uso: npm run cerebro:teste
import { gerarLearnDoEpisodio } from "../lib/openrouter/gerarLearn";

// Transcrição sintética de exemplo — não é um episódio real do canal
// (a fidelidade ao canal só se aplica a episódios reais processados
// pela esteira; isto é só um fixture pra exercitar o cérebro).
const TRANSCRICAO_EXEMPLO = `
Olha, deixa eu te contar uma coisa que muita gente não sabe sobre short stay
aqui em Feira de Santana. A gente lançou um empreendimento pensado
exatamente pro modelo de locação por temporada, com gestão facilitada,
e o que a gente viu foi uma valorização muito acima do que o mercado local
costuma entregar. Isso não é sorte, é ecossistema: coworking, bem-estar,
segurança, tecnologia, tudo pensado pra gerar renda passiva pro investidor,
não só pra quem mora. Então quando alguém me pergunta "vale a pena investir
no interior?", eu sempre volto pro mesmo ponto: não é sobre comprar um
imóvel, é sobre construir patrimônio que atravessa gerações.
`.trim();

async function main() {
  console.log("Chamando o cérebro (OpenRouter) com a transcrição de exemplo...");
  const learn = await gerarLearnDoEpisodio(TRANSCRICAO_EXEMPLO, {
    videoId: "TESTE_LOCAL",
    titulo: "Transcrição de exemplo (smoke test do cérebro)",
  });

  const duracaoTotal = learn.learn.video_roteiro.cenas.reduce(
    (soma, cena) => soma + cena.duracao_seg,
    0
  );

  console.log("\nOK — JSON validado contra o contrato do Sistema_Autonomo_v2:");
  console.log("  Título:", learn.learn.titulo);
  console.log("  Trilha / Módulo:", learn.learn.trilha, "/", learn.learn.modulo);
  console.log("  Seções do PDF:", learn.learn.pdf.secoes.length);
  console.log("  Cenas do roteiro:", learn.learn.video_roteiro.cenas.length);
  console.log("  Duração estimada:", Math.round(duracaoTotal / 60), "min");
}

main().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
