import React from "react";
import { OURO } from "../tokens";

// BANCO DE ÍCONES "PREMIUM FINANCE LINE" (Diretrizes V3, regra 70/15/15 —
// categoria Ícones 15%). Padrão INEGOCIÁVEL do manual: traço geométrico
// limpo, stroke 2.2px, cantos arredondados, grade 32x32, cor ouro #D4AF37.
// Todo ícone novo DEVE nascer aqui (nunca emoji/fonte/imagem externa) e ser
// registrado no manifesto (manifesto.ts) + docs/banco-visual.md — o acervo
// cresce junto com os Learns que a esteira gerar.

export interface PropsIconeFinance {
  tamanho?: number;
  cor?: string;
  style?: React.CSSProperties;
}

// Base comum: grade 32x32, stroke 2.2, pontas arredondadas, sem fill.
const Svg32: React.FC<PropsIconeFinance & { children: React.ReactNode }> = ({
  tamanho = 64,
  cor = OURO,
  style,
  children,
}) => (
  <svg
    width={tamanho}
    height={tamanho}
    viewBox="0 0 32 32"
    fill="none"
    stroke={cor}
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </svg>
);

// ---- Conjunto-base (manual §2 + páginas "Ícones 15%" do Banco) ----

// Valorização: barras ascendentes + seta subindo.
export const IcValorizacao: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M5 27 V21 M12 27 V16 M19 27 V11" />
    <path d="M23 9 L28 4 M28 4 H23.5 M28 4 V8.5" />
  </Svg32>
);

// Rentabilidade: símbolo % geométrico.
export const IcRentabilidade: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <circle cx="10" cy="10" r="4.4" />
    <circle cx="22" cy="22" r="4.4" />
    <path d="M23.5 7 L8.5 25" />
  </Svg32>
);

// Segurança: escudo com check.
export const IcSeguranca: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M16 3.5 L26.5 7.5 V15 C26.5 21.5 22 26 16 28.5 C10 26 5.5 21.5 5.5 15 V7.5 Z" />
    <path d="M11.5 15.5 L14.8 18.8 L20.5 12.5" />
  </Svg32>
);

// Retorno: setas em ciclo + cifrão central.
export const IcRetorno: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M26 16 A10 10 0 1 1 20.5 7.1" />
    <path d="M20.5 3.5 V7.5 H24.5" />
    <path d="M16 11 V21 M18.8 12.8 H14.6 C13.3 12.8 12.4 13.7 12.4 14.9 C12.4 16.1 13.3 16.9 14.6 16.9 H17.4 C18.7 16.9 19.6 17.8 19.6 19 C19.6 20.2 18.7 21.1 17.4 21.1 H13.1" />
  </Svg32>
);

// Ativo/Imóvel: prédio com janelas.
export const IcAtivoImovel: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <rect x="8" y="4.5" width="16" height="23" rx="2" />
    <path d="M12.5 10 H14.5 M17.5 10 H19.5 M12.5 15 H14.5 M17.5 15 H19.5 M12.5 20 H14.5 M17.5 20 H19.5" />
    <path d="M14.5 27.5 V24 H17.5 V27.5" />
  </Svg32>
);

// Casa: telhado + corpo + porta.
export const IcCasa: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M5 15 L16 5.5 L27 15" />
    <path d="M8 13 V26.5 H24 V13" />
    <path d="M13.7 26.5 V19.5 H18.3 V26.5" />
  </Svg32>
);

// Chave: cabeça circular + haste com dentes.
export const IcChave: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <circle cx="10" cy="12" r="5.5" />
    <path d="M14 16 L26 28 M22 24 L25 21 M18.5 20.5 L21 18" />
  </Svg32>
);

// Contrato: documento com linhas + assinatura.
export const IcContrato: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M9 3.5 H19.5 L25 9 V28.5 H9 Z" />
    <path d="M19.5 3.5 V9 H25" />
    <path d="M12.5 14 H21.5 M12.5 18 H21.5" />
    <path d="M12.5 23.5 C14 22 15 24.5 16.5 23 C18 21.5 19 24 21.5 22.5" />
  </Svg32>
);

// Localização: pin de mapa.
export const IcLocalizacao: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M16 28.5 C16 28.5 25 19.8 25 12.8 C25 7.6 21 3.5 16 3.5 C11 3.5 7 7.6 7 12.8 C7 19.8 16 28.5 16 28.5 Z" />
    <circle cx="16" cy="12.5" r="3.4" />
  </Svg32>
);

// Moedas: pilha de moedas.
export const IcMoedas: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <ellipse cx="16" cy="8" rx="9" ry="3.6" />
    <path d="M7 8 V16 C7 18 11 19.6 16 19.6 C21 19.6 25 18 25 16 V8" />
    <path d="M7 16 V24 C7 26 11 27.6 16 27.6 C21 27.6 25 26 25 24 V16" />
  </Svg32>
);

// Nota (dinheiro): cédula com círculo central.
export const IcNota: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <rect x="3.5" y="9" width="25" height="14" rx="2" />
    <circle cx="16" cy="16" r="3.6" />
    <path d="M7.5 13 V19 M24.5 13 V19" />
  </Svg32>
);

// Gráfico de linha: tendência de alta com nós.
export const IcGraficoLinha: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M4.5 25 L11 18.5 L16.5 21.5 L27.5 9" />
    <path d="M27.5 9 H22.8 M27.5 9 V13.7" />
  </Svg32>
);

// Tempo: relógio.
export const IcTempo: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <circle cx="16" cy="16" r="11.5" />
    <path d="M16 9.5 V16 L21 19" />
  </Svg32>
);

// Cofre: caixa com mostrador circular.
export const IcCofre: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <rect x="4.5" y="6" width="23" height="19" rx="2.5" />
    <circle cx="16" cy="15.5" r="4.5" />
    <path d="M16 11 V13 M16 18 V20 M11.5 15.5 H13.5 M18.5 15.5 H20.5" />
    <path d="M8.5 25 V28 M23.5 25 V28" />
  </Svg32>
);

// Alerta: triângulo com exclamação (usado no Toast de erro comum).
export const IcAlerta: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M16 4.5 L29 26.5 H3 Z" />
    <path d="M16 12.5 V19 M16 22.5 V22.6" />
  </Svg32>
);

// Ampulheta: tempo/janela de entrada (página do Banco).
export const IcAmpulheta: React.FC<PropsIconeFinance> = (p) => (
  <Svg32 {...p}>
    <path d="M9 4.5 H23 M9 27.5 H23" />
    <path d="M10.5 4.5 V9 C10.5 12.5 16 14.5 16 16 C16 17.5 10.5 19.5 10.5 23 V27.5" />
    <path d="M21.5 4.5 V9 C21.5 12.5 16 14.5 16 16 C16 17.5 21.5 19.5 21.5 23 V27.5" />
  </Svg32>
);

// REGISTRO POR NOME — o "banco de dados" consultável pela esteira. Roteiro
// pede um conceito; se não existir aqui, o conceito é FLAGRADO e um ícone
// novo é desenhado (nunca inventar visual fora do padrão, nunca emoji).
export const ICONES_FINANCE = {
  valorizacao: IcValorizacao,
  rentabilidade: IcRentabilidade,
  seguranca: IcSeguranca,
  retorno: IcRetorno,
  ativo_imovel: IcAtivoImovel,
  casa: IcCasa,
  chave: IcChave,
  contrato: IcContrato,
  localizacao: IcLocalizacao,
  moedas: IcMoedas,
  nota: IcNota,
  grafico_linha: IcGraficoLinha,
  tempo: IcTempo,
  cofre: IcCofre,
  alerta: IcAlerta,
  ampulheta: IcAmpulheta,
} as const;

export type NomeIconeFinance = keyof typeof ICONES_FINANCE;

// Dispatcher por nome com fallback seguro (ativo_imovel) — nunca quebra o
// render; um nome desconhecido indica gap a preencher no banco.
export const IconeFinance: React.FC<PropsIconeFinance & { nome: string }> = ({ nome, ...p }) => {
  const Comp = (ICONES_FINANCE as Record<string, React.FC<PropsIconeFinance>>)[nome] ?? IcAtivoImovel;
  return <Comp {...p} />;
};
