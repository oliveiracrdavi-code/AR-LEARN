// VÍDEO LONGO 16:9 — schema de seções (formato do learn_estruturado.json
// do Workspace 1: 10 seções tipadas) + PAYLOAD STAND-IN do ep. 171.
//
// *** STAND-IN, NÃO CONTEÚDO FINAL ***
// O learn_estruturado.json real do ep. 171 ainda não chegou (aguardando o
// ZIP do Workspace 1). Os DADOS-CHAVE abaixo são os reais fixados nos
// documentos do episódio (entrada 35-40%, recorrência +20-25%, custo m²
// R$ 45.000, manchete oficial); os textos de narração são provisórios,
// escritos para validar o DESIGN — trocar pelo JSON real ao chegar
// (mesma estrutura). Duração total: 12.847 frames @30fps = 428,2s.
export type TipoSecao =
  | "intro"
  | "headline"
  | "dado"
  | "erros"
  | "transicao"
  | "deep_dive"
  | "recap"
  | "cta";

export interface DadoChave {
  label: string;
  valor: number; // parte numérica p/ contador
  prefixo?: string;
  sufixo?: string;
  contexto: string;
  icone: string;
  formato?: "percentual" | "faixa" | "moeda";
  faixaTexto?: string; // exibição literal quando é faixa (ex.: "35-40%")
  donut?: { pct: number; rotulo: string }; // dado 3 usa donut
}

export interface Secao {
  tipo: TipoSecao;
  frames: number;
  titulo?: string;
  linhas?: { texto: string; cor?: "amarelo" | "branco"; peso?: number; tamanho?: number }[];
  narracao: string; // «palavra» marca keyword goldenrod na legenda
  dado?: DadoChave;
  icones?: string[];
}

export const EPISODIO = {
  numero: "171",
  kicker: "MERCADO IMOBILIÁRIO · EPISÓDIO 171",
  titulo: "A conta que ninguém faz antes de investir em imóvel",
};

// 10 seções somando exatamente 12.847 frames.
export const SECOES: Secao[] = [
  {
    tipo: "intro",
    frames: 600,
    narracao: "Bem-vindo ao «Altamente Rentável». Hoje vamos fazer a conta que ninguém faz antes de «investir» em imóvel.",
  },
  {
    tipo: "headline",
    frames: 900,
    linhas: [
      { texto: "A conta que", cor: "branco", tamanho: 96 },
      { texto: "ninguém faz", cor: "amarelo", peso: 800, tamanho: 150 },
      { texto: "antes de investir", cor: "branco", tamanho: 96 },
    ],
    narracao: "Todo mundo olha o preço do imóvel. Quase ninguém olha os «três números» que decidem se o negócio é bom: a «entrada», a «recorrência» e o «custo do metro quadrado».",
  },
  {
    tipo: "dado",
    frames: 1350,
    linhas: [
      { texto: "O peso da", cor: "branco", tamanho: 88 },
      { texto: "entrada", cor: "amarelo", peso: 800, tamanho: 140 },
    ],
    narracao: "O primeiro número é a «entrada»: entre «35 e 40 por cento» do valor do imóvel. É ela que define seu fôlego de caixa — e por isso é «crítica».",
    dado: { label: "Entrada", valor: 40, formato: "faixa", faixaTexto: "35-40%", contexto: "Crítica", icone: "cofre" },
  },
  {
    tipo: "dado",
    frames: 1350,
    linhas: [
      { texto: "A força da", cor: "branco", tamanho: 88 },
      { texto: "recorrência", cor: "amarelo", peso: 800, tamanho: 140 },
    ],
    narracao: "O segundo número é a «recorrência»: aluguel e renda mensal crescendo de «20 a 25 por cento» no ciclo. É ela que paga a conta todo mês — «determinante».",
    dado: { label: "Recorrência", valor: 25, prefixo: "+", formato: "faixa", faixaTexto: "+20-25%", contexto: "Determinante", icone: "calendario" },
  },
  {
    tipo: "dado",
    frames: 1500,
    linhas: [
      { texto: "O teto do", cor: "branco", tamanho: 88 },
      { texto: "custo por m²", cor: "amarelo", peso: 800, tamanho: 140 },
    ],
    narracao: "O terceiro número é o «custo do metro quadrado»: «45 mil reais» é a referência da região. Acima disso, a margem aperta — dentro, o negócio «respira».",
    dado: {
      label: "Custo m²",
      valor: 45,
      formato: "moeda",
      faixaTexto: "R$ 45.000",
      contexto: "Referência",
      icone: "localizacao",
      donut: { pct: 62, rotulo: "dentro do orçamento" },
    },
  },
  {
    tipo: "erros",
    frames: 1350,
    linhas: [
      { texto: "Erros que", cor: "branco", tamanho: 88 },
      { texto: "custam caro", cor: "amarelo", peso: 800, tamanho: 140 },
    ],
    narracao: "Antes de seguir, três «erros» que destroem essa conta: comprar sem analisar a «vacância», ignorar o custo de «manutenção», e esquecer o «prazo» de revenda.",
  },
  {
    tipo: "transicao",
    frames: 450,
    narracao: "Com os três números na mão, a pergunta muda: «onde» você está na jornada do investidor?",
    icones: ["valorizacao", "retorno", "seguranca"],
  },
  {
    tipo: "deep_dive",
    frames: 2700,
    narracao: "A «jornada» tem cinco etapas: começo, consolidação, «crescimento», independência e «liberdade». O ROI real é a bússola: «aluguel menos custos», dividido pelo «capital investido». Enquanto seus investimentos trabalham por você, cada etapa aproxima a renda passiva dos seus custos mensais.",
  },
  {
    tipo: "recap",
    frames: 1800,
    narracao: "Recapitulando: «entrada» de 35 a 40 por cento, «recorrência» de 20 a 25, e custo do m² até «45 mil». Essa é a conta que separa o investidor do apostador.",
  },
  {
    tipo: "cta",
    frames: 847,
    narracao: "O episódio completo aprofunda cada número. «Assista» e faça a conta antes do mercado fazer por você.",
  },
];

export const TOTAL_FRAMES = SECOES.reduce((s, x) => s + x.frames, 0); // 12847
