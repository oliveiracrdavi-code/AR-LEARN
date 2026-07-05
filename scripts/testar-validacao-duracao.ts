// Teste RÁPIDO e BARATO da validação de piso de duração REAL (não
// precisa do cérebro/OpenRouter — nenhum custo de LLM, só Edge TTS com
// textos curtos). Confirma que um roteiro deliberadamente curto é
// REJEITADO por sintetizarRoteiro() em vez de gerar um vídeo abaixo do
// piso de 420s (7 min) silenciosamente — bug real encontrado por Davi
// (fixture "mercado imobiliário" saiu com 355s reais).
import { sintetizarRoteiro } from "../lib/tts/sintetizar";
import { DURACAO_MINIMA_VIDEO_SEG } from "../lib/constantes";

// Textos curtos de propósito — poucos segundos de fala real cada,
// muito abaixo do piso de 420s somados.
const CENAS_CURTAS_DE_PROPOSITO = [
  "Olá, bem-vindos ao novo episódio.",
  "Hoje vamos falar rapidamente sobre um assunto.",
  "É isso, até a próxima.",
];

async function main() {
  console.log(`Piso de duração: ${DURACAO_MINIMA_VIDEO_SEG}s`);
  console.log(`Testando roteiro deliberadamente curto (${CENAS_CURTAS_DE_PROPOSITO.length} cenas)...`);

  try {
    const resultado = await sintetizarRoteiro(CENAS_CURTAS_DE_PROPOSITO);
    const total = resultado.duracoesPorCena.reduce((soma, d) => soma + d, 0);
    console.error(
      `TESTE FALHOU: sintetizarRoteiro() deveria ter rejeitado um roteiro curto, mas retornou normalmente ` +
        `(duração real: ${total.toFixed(2)}s). A validação NÃO está funcionando.`
    );
    process.exit(1);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (mensagem.includes("abaixo do piso")) {
      console.log("TESTE PASSOU: roteiro curto foi corretamente REJEITADO.");
      console.log("Mensagem de erro recebida:", mensagem);
    } else {
      console.error("TESTE FALHOU: rejeitou, mas por um motivo inesperado (não é a validação de piso):");
      console.error(mensagem);
      process.exit(1);
    }
  }
}

main().catch((erro) => {
  console.error("Falhou (erro inesperado no próprio teste):", erro);
  process.exit(1);
});
