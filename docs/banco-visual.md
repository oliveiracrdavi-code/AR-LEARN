# Banco Visual AR LEARN — Premium Finance Line

Fonte de verdade operacional do acervo visual (Diretrizes V3: Manual
Unificado + AR LEARN Banco de Imagens). Código em
`remotion/src/finance/banco/`. **Este banco é vivo**: cresce junto com os
Learns. Auditoria visual: composição `VitrineBanco`
(`npx tsx scripts/render-vitrine.ts`).

## Regra de Ouro — mix 70/15/15 por cena
| Camada | % | Regra |
|---|---|---|
| Imagem de fundo | 70% | Estética "Ouro e Concreto": escura, desfocada, rica em textura. **Humano Zero** (proibido pessoas). `FundoImagem.tsx`; sem arquivo => fallback procedural (nunca tela vazia). |
| Ícones Finance Line | 15% | Traço geométrico limpo, **stroke 2.2px**, cantos arredondados, **grade 32×32**, cor ouro `#D4AF37`. `iconesFinance.tsx`. |
| Componentes de UI | 15% | **Glassmorphism obrigatório** (fundo visível através do card), microinteração só na entrada. `componentes.tsx`. |

Princípios de motion: **Desenhar** (strokeDashoffset), **Crescer**
(spring + count-up), **Montar** (cascata/stagger). Texto e componente
surgem **JUNTOS** (aparição sequencial = erro). Nenhum frame estático.

## Inventário atual

### Ícones (18) — `ICONES_FINANCE`
valorizacao · rentabilidade · seguranca · retorno · ativo_imovel · casa ·
chave · contrato · localizacao · moedas · nota · grafico_linha · tempo ·
cofre · alerta · ampulheta · bandeira · diamante *(+2 da Jornada, Banco V2)*

Mapa conceito→ícone (para a esteira resolver roteiro→visual):
`manifesto.ts` (`CONCEITO_PARA_ICONE`, ~35 conceitos).

### Componentes
- `CardCarbon` — card glass base (blur 14px, borda ouro 45%)
- `SeloPercentual` — selo circular: anel se desenha + valor count-up
- `MiniTabela` — comparativo (ex.: Bairros A/B/C), linha destaque ouro
- `BarrasOuro` — barras com degradê `#D4AF37→#C6972F`, spring
- `ToastErro` — pílula glass com `IcAlerta` laranja (erros comuns)
- `TimelineJornada` — linha do tempo de etapas (Jornada do Investidor,
  colhida do Banco V2): círculo+ícone, etapa ativa em ouro, chips de prazo
- `CardCitacao` — card de citação com aspas ouro (Banco V2)

### Fundos (70%)
Catálogo em `manifesto.ts` (`FUNDOS`) — 5 conceitos mapeados, **todos
`pendente`**: os arquivos de imagem reais precisam de fonte licenciada
aprovada pelo Davi antes de versionar (Regra de Ouro: nada sem origem
clara). Até lá o fallback procedural cobre.

### Marca (lockups oficiais em public/)
`logo-ar.jpg` (badge quadrado) · `logo-ar-academy.jpg` (card Academy) ·
`logo-ar-horizontal.jpg` (fundo branco, do Banco V2) ·
`logo-ar-amarelo.jpg` (fundo amarelo, do Banco V2)

## Protocolo de expansão contínua (responsabilidade do Claude)
Quando um roteiro pedir conceito sem ativo:
1. Registrar o gap (nunca inventar visual fora do padrão, nunca emoji).
2. Criar o ícone em `iconesFinance.tsx` (stroke 2.2, grade 32, ouro) ou o
   componente em `componentes.tsx` (glass).
3. Adicionar ao registro + `CONCEITO_PARA_ICONE` no `manifesto.ts`.
4. Atualizar o inventário deste arquivo **no mesmo commit**.
5. Re-renderizar a `VitrineBanco` e conferir visualmente.

## Divergências flagradas (aguardam decisão do Davi)
- **Ouro do manual `#D4AF37`** × amarelo do logo `#F8C848` (usado no clipe
  de 30s aprovado). O banco segue o manual; o clipe segue o logo.
- **Onyx do manual `#0B0F14`** × onyx do card `#020202`.
- **Tipografia do manual (Sora/Space Grotesk + Inter)** × Poppins
  (self-hosted, usada no clipe). Migração só com aprovação.
- Cards do clipe de 30s são sólidos; o manual exige glass. Migrar o clipe
  para `CardCarbon` só depois da aprovação do design.
