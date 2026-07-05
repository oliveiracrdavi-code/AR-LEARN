import React from "react";
import { COR_DESTAQUE, COR_FUNDO } from "../cores";

// Ícones em SVG próprio (path desenhado, NÃO fonte de emoji). Motivo
// (Regra de Ouro, registrado em docs/historico.md): emoji dependem de
// fonte de cor do SISTEMA que renderiza o vídeo. Localmente o Chromium
// do Playwright tem essa fonte, mas o render oficial roda no GitHub
// Actions com o chrome-headless-shell do Remotion, onde a fonte de
// emoji pode não existir — aí o ícone viraria "tofu" (caixa vazia).
// Desenhar em path elimina a dependência de fonte: o render fica
// determinístico e idêntico em qualquer ambiente. Bônus: o line-art
// dourado combina com o resto da identidade (o emoji multicolor
// destoava da paleta ouro/escuro).

interface PropsIcone {
  tamanho?: number;
  cor?: string;
  style?: React.CSSProperties;
}

// Base comum: viewBox 64x64, traço arredondado, sem preenchimento
// (line-art), na cor de destaque por padrão.
function Svg({
  tamanho = 64,
  cor = COR_DESTAQUE,
  style,
  children,
  strokeWidth = 3.2,
}: PropsIcone & { children: React.ReactNode; strokeWidth?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 64 64"
      fill="none"
      stroke={cor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

export const IconeCasa: React.FC<PropsIcone> = (p) => (
  <Svg {...p}>
    <path d="M10 30 L32 12 L54 30" />
    <path d="M16 27 V52 H48 V27" />
    <path d="M27 52 V39 H37 V52" />
  </Svg>
);

export const IconePessoa: React.FC<PropsIcone> = (p) => (
  <Svg {...p}>
    <circle cx="32" cy="20" r="9" />
    <path d="M14 52 C14 40 21 33 32 33 C43 33 50 40 50 52" />
  </Svg>
);

export const IconeCama: React.FC<PropsIcone> = (p) => (
  <Svg {...p}>
    {/* cabeceira + estrutura + colchão + travesseiro + pés */}
    <path d="M8 22 V48 M8 42 H56 V48 M12 42 V34 Q12 31 15 31 H50 Q53 31 53 34 V42" />
    <path d="M15 41 V35 H26 V41" />
    <path d="M13 48 V53 M53 48 V53" />
  </Svg>
);

export const IconeOnibus: React.FC<PropsIcone> = (p) => (
  <Svg {...p}>
    <rect x="10" y="16" width="44" height="30" rx="5" />
    <path d="M14 26 H50" />
    <path d="M23 18 V26 M32 18 V26 M41 18 V26" />
    <circle cx="21" cy="48" r="4" />
    <circle cx="43" cy="48" r="4" />
  </Svg>
);

export const IconeLoja: React.FC<PropsIcone> = (p) => (
  <Svg {...p}>
    {/* toldo + fachada + porta */}
    <path d="M12 26 L16 17 H48 L52 26" />
    <path d="M12 26 H52" />
    <path d="M14 26 V52 H50 V26" />
    <path d="M28 52 V38 H40 V52" />
  </Svg>
);

export const IconeHospital: React.FC<PropsIcone> = (p) => (
  <Svg {...p}>
    <path d="M14 22 V52 H50 V22 Z" />
    {/* cruz */}
    <path d="M32 27 V37 M27 32 H37" />
    <path d="M28 52 V44 H36 V52" />
  </Svg>
);

export const IconeEscola: React.FC<PropsIcone> = (p) => (
  <Svg {...p}>
    <path d="M12 30 L32 16 L52 30" />
    <path d="M15 30 V52 H49 V30" />
    {/* mastro com bandeirinha */}
    <path d="M32 16 V9 M32 9 H41 V13 H32" />
    <path d="M27 52 V41 H37 V52" />
  </Svg>
);

export const IconeArvore: React.FC<PropsIcone> = (p) => (
  <Svg {...p}>
    <circle cx="32" cy="24" r="15" />
    <path d="M28 38 V53 H36 V38" />
  </Svg>
);

// Pin de mapa: preenchido (não line-art) porque um "pin" lê melhor
// cheio. Recebe a cor de destaque no corpo e fura o miolo com a cor de
// fundo, mantendo só duas cores da paleta.
export const IconePin: React.FC<PropsIcone> = ({
  tamanho = 64,
  cor = COR_DESTAQUE,
  style,
}) => (
  <svg
    width={tamanho}
    height={tamanho}
    viewBox="0 0 64 64"
    style={style}
    fill="none"
  >
    <path
      d="M32 6 C21 6 13 14 13 25 C13 39 32 58 32 58 C32 58 51 39 51 25 C51 14 43 6 32 6 Z"
      fill={cor}
    />
    <circle cx="32" cy="24" r="7" fill={COR_FUNDO} />
  </svg>
);
