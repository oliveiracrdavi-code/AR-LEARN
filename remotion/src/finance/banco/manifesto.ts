// MANIFESTO DO BANCO VISUAL AR LEARN — o "banco de dados" de ativos que a
// esteira consulta e que EU (Claude, construtor autônomo) alimento de forma
// contínua: quando um roteiro pedir um conceito sem ativo correspondente,
// o gap é registrado, o ativo novo é criado DENTRO das regras (ícone:
// stroke 2.2/grade 32/ouro; fundo: ouro-e-concreto sem pessoas; componente:
// glass) e este manifesto + docs/banco-visual.md são atualizados no mesmo
// commit. Nada de visual improvisado fora do padrão.
import type { NomeIconeFinance } from "./iconesFinance";

// Conceito de roteiro -> ícone do banco. É a tabela que o gerador de cenas
// usa para resolver "o que mostrar" a partir do texto do Learn.
export const CONCEITO_PARA_ICONE: Record<string, NomeIconeFinance> = {
  valorizacao: "valorizacao",
  apreciacao: "valorizacao",
  rentabilidade: "rentabilidade",
  "cap rate": "rentabilidade",
  juros: "rentabilidade",
  seguranca: "seguranca",
  garantia: "seguranca",
  protecao: "seguranca",
  retorno: "retorno",
  roi: "retorno",
  "fluxo de caixa": "retorno",
  imovel: "ativo_imovel",
  ativo: "ativo_imovel",
  predio: "ativo_imovel",
  apartamento: "ativo_imovel",
  casa: "casa",
  compra: "chave",
  entrega: "chave",
  posse: "chave",
  contrato: "contrato",
  escritura: "contrato",
  financiamento: "contrato",
  localizacao: "localizacao",
  bairro: "localizacao",
  regiao: "localizacao",
  dinheiro: "moedas",
  capital: "moedas",
  patrimonio: "moedas",
  preco: "nota",
  aluguel: "nota",
  tendencia: "grafico_linha",
  mercado: "grafico_linha",
  ciclo: "tempo",
  prazo: "tempo",
  reserva: "cofre",
  poupanca: "cofre",
  erro: "alerta",
  risco: "alerta",
  armadilha: "alerta",
  "janela de entrada": "ampulheta",
  oportunidade: "ampulheta",
  comeco: "bandeira",
  marco: "bandeira",
  meta: "bandeira",
  liberdade: "diamante",
  "liberdade financeira": "diamante",
  patrimonio_consolidado: "diamante",
  recorrencia: "calendario",
  mensal: "calendario",
  calendario: "calendario",
  concluido: "concluido",
  checklist: "concluido",
  feito: "concluido",
};

// Fundos (70%) — catálogo de imagens em public/imagens/. status "pendente"
// = conceito mapeado mas arquivo ainda não adquirido (fica no fallback
// procedural até Davi aprovar a fonte da imagem; imagens de banco externo
// exigem licença — nunca versionar sem origem clara).
export interface FundoCatalogado {
  conceito: string;
  arquivo: string; // relativo a public/
  status: "disponivel" | "pendente";
  descricao: string;
}

export const FUNDOS: FundoCatalogado[] = [
  { conceito: "skyline", arquivo: "imagens/skyline-noturno.jpg", status: "pendente", descricao: "Skyline noturno dourado, longa exposição, desfocado" },
  { conceito: "moedas", arquivo: "imagens/moedas-ouro.jpg", status: "pendente", descricao: "Moedas de ouro sobre superfície escura, macro, bokeh" },
  { conceito: "arquitetura", arquivo: "imagens/fachada-luxo.jpg", status: "pendente", descricao: "Fachada dark luxury real estate, concreto e luz quente" },
  { conceito: "chave", arquivo: "imagens/chave-dourada.jpg", status: "pendente", descricao: "Chave dourada em fundo onyx, profundidade de campo" },
  { conceito: "residencial", arquivo: "imagens/casa-noturna.jpg", status: "pendente", descricao: "Casa à noite com janelas acesas em âmbar" },
];

// Resolve o ícone de um conceito livre do roteiro (minúsculas, sem acento
// tratado pelo chamador). undefined = GAP: registrar e criar ícone novo.
export function iconeParaConceito(conceito: string): NomeIconeFinance | undefined {
  return CONCEITO_PARA_ICONE[conceito.toLowerCase().trim()];
}
