// Teste isolado do cérebro (OpenRouter): transcrição de exemplo -> JSON
// validado contra o contrato do Learn. Não depende do YouTube.
// Uso: npm run cerebro:teste
import { gerarLearnDoEpisodio } from "../lib/openrouter/gerarLearn";

// Transcrição sintética de exemplo — não é um episódio real do canal
// (a fidelidade ao canal só se aplica a episódios reais processados
// pela esteira; isto é só um fixture pra exercitar o cérebro).
//
// IMPORTANTE: o fixture precisa ter conteúdo SUFICIENTE para que um
// roteiro proporcional atinja o piso de 7 minutos (~8.200 caracteres de
// narração) SEM o modelo precisar encher linguiça — a regra do produto é
// "proporcional ao conteúdo real, nunca encher". A versão curta anterior
// (~600 chars) tornava o piso inatingível honestamente e o teste falhava
// mesmo com a chave OpenRouter funcionando (visto no run 29648554670).
const TRANSCRICAO_EXEMPLO = `
Olha, deixa eu te contar uma coisa que muita gente não sabe sobre short stay
aqui em Feira de Santana. A gente lançou um empreendimento pensado
exatamente pro modelo de locação por temporada, com gestão facilitada,
e o que a gente viu foi uma valorização muito acima do que o mercado local
costuma entregar. Isso não é sorte, é ecossistema: coworking, bem-estar,
segurança, tecnologia, tudo pensado pra gerar renda passiva pro investidor,
não só pra quem mora.

Vamos aos números, porque opinião sem número é achismo. Quando a gente
estruturou esse produto, a diária média da região girava em torno de
duzentos e vinte reais em plataforma, com ocupação média de sessenta e
cinco por cento nos meses normais e passando de oitenta e cinco por cento
em período de evento — Feira de Santana tem a Micareta, tem congresso
médico, tem o fluxo corporativo do polo industrial. Um estúdio de trinta
e dois metros quadrados, comprado na planta por volta de duzentos e
oitenta mil reais, entregava uma receita bruta mensal na casa de quatro
mil e trezentos reais nesse cenário. Tira taxa de administração de vinte
por cento, tira condomínio, tira IPTU, sobra um líquido que representa
perto de um por cento ao mês sobre o capital investido. Compara isso com
aluguel residencial tradicional, que na mesma região entrega zero vírgula
quarenta e cinco, zero vírgula cinco por cento ao mês, e você entende por
que o short stay virou a menina dos olhos do investidor do interior.

Mas atenção, porque aqui mora o primeiro erro clássico: o investidor vê a
diária de duzentos e vinte reais, multiplica por trinta e acha que vai
faturar seis mil e seiscentos por mês. Não vai. Ocupação de cem por cento
não existe, sazonalidade existe, mês de janeiro em cidade de interior sem
praia é deserto. Quem faz a conta com ocupação cheia compra um problema.
A conta séria se faz com três cenários: pessimista com cinquenta por
cento de ocupação, realista com sessenta e cinco, otimista com oitenta.
Se o negócio só para de pé no cenário otimista, o negócio não para de pé.

Segundo erro clássico: ignorar o custo de mobiliar e equipar. Um estúdio
de short stay não se entrega vazio. Enxoval, eletrodomésticos, cama de
qualidade, decoração que fotografa bem — porque no short stay a foto é a
vitrine — isso consome entre vinte e cinco e quarenta mil reais por
unidade. Esse valor tem que entrar no cálculo do capital investido, senão
a rentabilidade que você calculou é ficção. E tem reposição: enxoval em
locação por temporada gira, quebra, some. Uns três por cento da receita
bruta por ano de reserva pra reposição é o mínimo de prudência.

Terceiro ponto, e esse é o que separa o amador do profissional: gestão.
Autogestão de short stay à distância é uma armadilha. Check-in que
falha às onze da noite, hóspede trancado pra fora, ar-condicionado que
pinga em cima da cama — quem mora em outra cidade não resolve isso, e a
avaliação de uma estrela chega no dia seguinte. Avaliação derruba
ranqueamento, ranqueamento derruba ocupação, ocupação derruba a tese
inteira. Por isso a gente defende gestão profissionalizada com taxa de
quinze a vinte por cento: parece caro, mas ocupação bem gerida paga a
taxa e sobra. O nosso empreendimento já nasce com operadora contratada,
padrão hoteleiro de limpeza e precificação dinâmica — em dia de Micareta
a diária não é duzentos e vinte, é quinhentos, e é o algoritmo que captura
isso, não o proprietário de madrugada mudando preço no aplicativo.

Agora, sobre valorização do imóvel em si. O metro quadrado em Feira de
Santana, nas regiões boas, saiu de uma faixa de cinco mil e quinhentos
para perto de sete mil reais em três anos. Isso é valorização de mais de
vinte e cinco por cento no ciclo, acima da inflação do período. E o
short stay bem operado empurra essa valorização: um prédio com ocupação
alta e avaliação alta vira referência de bairro, atrai comércio,
valoriza o entorno. É um ciclo virtuoso que o investidor de primeira
viagem não enxerga porque olha só a unidade dele e não o ecossistema.

E aí entra a pergunta que sempre me fazem: "vale a pena investir no
interior, ou é melhor capital?". A resposta honesta é: depende do
fundamento, não do CEP. Interior com universidade, com polo de saúde,
com indústria e com evento âncora tem demanda de hospedagem o ano
inteiro e tem uma vantagem brutal: o preço de entrada. Os mesmos
duzentos e oitenta mil que compram um estúdio completo em Feira de
Santana não compram nem vaga de garagem em bairro nobre de capital. O
yield percentual no interior costuma ser maior exatamente porque o
denominador é menor. Capital tem liquidez maior na revenda, isso é
verdade, mas paga-se caro por essa liquidez na entrada.

Sobre financiamento: short stay na planta tem uma jogada específica. O
fluxo da obra costuma ser trinta a quarenta por cento durante a
construção e o resto no financiamento das chaves. Quem entra na planta
trava o preço de hoje, paga a entrada parcelada durante a obra sem juro
de banco, e quando o prédio fica pronto o imóvel já valorizou o repasse
da obra — historicamente entre quinze e vinte e cinco por cento. Ou
seja: dá pra ganhar na valorização da obra antes de ganhar na operação.
O risco? Atraso de entrega e distrato. Por isso só se entra na planta
com incorporadora de histórico auditável, patrimônio de afetação e obra
com cronograma público. Sem esses três, a promessa de rentabilidade é
só promessa.

Fecho com o ponto que abre e encerra qualquer conversa séria sobre
imóvel: horizonte. Short stay é operação, e operação tem mês bom e mês
ruim. Quem precisa do dinheiro em doze meses não deveria estar nesse
jogo. O prazo mínimo de maturação de uma tese dessas é um ciclo completo
de três a cinco anos: um ano pra operação ranquear e estabilizar, dois a
quatro pra capturar valorização e compor renda. Então quando alguém me
pergunta "vale a pena?", eu sempre volto pro mesmo ponto: não é sobre
comprar um imóvel, é sobre construir patrimônio que atravessa gerações —
com número na mesa, cenário pessimista calculado e gestão profissional.
Feito assim, o interior não é aposta: é estratégia.
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
