# Design turbinado — log da rodada "todos os MCPs"

Data: 2026-07-19. Referência de padrão de qualidade: PDF 21st.dev +
React Bits enviado pelo Davi (lido antes desta frente, como pedido).
Regra respeitada: paleta/nomes/modelo de vídeo TRAVADOS — turbinar =
nível de acabamento, não reabrir marca.

## O que mudou no código (Motion + técnicas React Bits adaptadas)

- **Motion (motion/react)** virou o motor de animação de interface:
  - Landing: entrada staggered do hero (kicker → manchete → caixa →
    chips com spring), reveal-ao-scroll de todas as seções
    (`componentes/landing/Revelar.tsx`), micro-interações nos chips.
  - Vitrine: reveal por fileira, scale spring nos cards, entrada do hero.
- **Spotlight/border-glow goldenrod seguindo o cursor** (técnica do
  MagicBento/React Bits, reimplementada em CSS vars — sem GSAP, sem
  Tailwind, adaptada à paleta): `componentes/landing/CartaoGlow.tsx`
  (cartões da landing) e `.vitrine-card::before` (cards da vitrine).
- **Glow em deriva no hero** (2 blobs animados + grid oficial) e moldura
  do player com glow no hover (`.moldura-video`).
- **Skeleton shimmer** em hero/fileiras — nunca tela em branco.
- `prefers-reduced-motion` desliga as derivas/shimmer (acessibilidade).
- O que NÃO foi copiado da referência: paleta roxa deles, tipografia,
  shadcn/Tailwind (o projeto segue CSS próprio na identidade AR).

## Uso de cada MCP de mídia (com racional)

| MCP | Uso | Racional |
|---|---|---|
| **Higgsfield** | 1 background hero 16:9 gerado (nano_banana_pro, prompt com a paleta explícita: Black/#141414/#ffcb00, abstrato financeiro, sem pessoas/texto). Job `cdc6fe38-5277-4f70-810b-1f3199f35c33`. | Gerou bem, MAS o egress do sandbox bloqueia o download do CloudFront — o arquivo não pôde entrar em `public/`. URL registrada abaixo; o hero procedural em CSS (grid + blobs goldenrod) já entrega o visual na paleta, então o asset é um upgrade OPCIONAL a baixar depois. |
| **HyperFrames (HeyGen)** | Não usado. | O prompt condicionava o teaser em loop a "não competir/confundir com o player principal" — na landing atual o vídeo do Learn É o centro da página; um segundo vídeo no hero disputaria atenção e banda. Decisão: não fazer. |
| **Canva** | Não usado nesta rodada. | Nenhum asset estático faltante: logos existem, ícones são do Banco Visual (SVG próprio), badges/cards são código. |
| **Figma** | Não usado nesta rodada. | Os componentes foram direto a código sobre referência já recebida em PDF; prototipar antes duplicaria trabalho. Fica disponível para quando o Davi mandar novos componentes pra organizar. |
| **Three.js / 3D** | **NÃO implementado — proposta em aberto (decisão do Davi).** | Regra "zero 3D" é do Blueprint do vídeo; para a web ficou explícito não decidir sozinho. Proposta: NADA de objeto 3D — no máximo um campo de partículas goldenrod muito sutil (~40 pontos, parallax lento com o mouse) atrás do hero da landing, tipo poeira de ouro, 100% na paleta, desligável por prefers-reduced-motion. Se aprovar, implemento em react-three-fiber (já é dependência) ou em canvas 2D puro (mais leve — recomendado). Sem aprovação, fica como está. |

Asset Higgsfield (baixar e salvar como `public/hero-bg.png` se quiser
usar; depois referenciar no hero): job `cdc6fe38-...35c33`, URL exibida
no chat da sessão (CloudFront) — também recuperável no painel Higgsfield.

## Screenshots

- `screenshots_landing_v2.zip` — desktop 1440 + mobile 390 da landing
  turbinada.
- `screenshots_dashboard_vitrine.zip` — desktop + mobile do /dashboard
  em arquitetura vitrine. Como só existe 1 Learn publicado (e sessão
  autenticada não é possível de simular sem criar venda fake — proibido),
  o estado CHEIO da vitrine foi capturado via `/dev-vitrine` (rota de QA
  com dados fictícios de UI, zero banco, 404 em produção) — mesma UI,
  mesmos componentes.
