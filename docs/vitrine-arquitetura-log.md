# Vitrine Netflix — log de arquitetura e implementação

Data: 2026-07-19. Base: especificação "Arquitetura Vitrine Netflix —
explicação completa" do prompt de finalização.

## Princípio implementado

O usuário abre a área de membros e está numa **vitrine de streaming**,
não numa árvore de curso. Fileiras horizontais nomeadas por **RESULTADO**
("Continue de onde parou", título da trilha — que já é resultado), nunca
por rótulo técnico. Trilha → Módulo → Learn **continua existindo como
estrutura de dados** (agrupamento, progresso, geração automática de
fileiras), mas as palavras "Trilha"/"Módulo" nunca aparecem na UI. Um
Learn pode aparecer em N fileiras ao mesmo tempo.

## Modelo de dados (migrations `20260719100000_vitrine` + `...100500`)

| Peça | O que é |
|---|---|
| `learns.fixado_no_hero` | Hero curado manualmente pelo admin (requisito de produto: promoção/lançamento sobrepõe o algoritmo). Toggle no /admin, só 1 por vez. |
| `progresso_learns` | (usuario, learn) → segundos assistidos, duração, concluído. RLS own-only (select/insert/update). O `<video>` da página do Learn grava via upsert com throttle de 10s + pause/ended. |
| `learns_publico` (view, estendida) | Teaser do catálogo p/ cards BLOQUEADOS: + duração, publicado_at, preço, fixado_no_hero. Segue sem URL de ativo. |
| `learns_em_alta` (view agregada) | count de espectadores por learn publicado — SEM dado pessoal (SECURITY DEFINER intencional, mesmo racional do teaser; documentado p/ advisors). |

Fileiras são **geradas por query, não tabela física** (decisão permitida
pela spec): `lib/vitrine/fileiras.ts` monta tudo client-side a partir de
5 fontes (learns via RLS = comprados; learns_publico = catálogo;
progresso_learns; learns_em_alta; trilhas+modulos públicos).

## Fileiras implementadas (ordem de prioridade)

1. **Continue de onde parou** — só aparece com progresso incompleto
   (<97%); ordenada por atividade recente; sempre a primeira.
2. **Uma por Trilha** — título = título da trilha (resultado), cards na
   ordem interna; inclui cards bloqueados (teaser) com CTA de compra.
3. **Em alta entre investidores** — só quando há audiência agregada
   real (>0 espectadores); badge EM ALTA no card a partir de 3.
4. **Novos episódios** — publicado_at desc; badge NOVO até 21 dias.
5. *(fase 2 futura, documentada e não implementada por falta de dados:)*
   "Porque você assistiu X" por tags/palavras-chave e fileira por perfil.
   Hoje o "Continue explorando" da página do Learn cumpre o papel de
   recomendação v1 (mesma trilha primeiro, depois catálogo).

## Componentes

- `componentes/vitrine/VitrineRow.tsx` — scroll horizontal (snap,
  swipe nativo no mobile, máscara de borda), setas no hover (desktop),
  **teclado**: container focável, ←/→ rolam (acessibilidade exigida);
  reveal ao scroll (Motion). Nunca vira grid vertical.
- `componentes/vitrine/LearnCard.tsx` — estados normal | comprado
  (barra de progresso goldenrod) | bloqueado (cadeado + CTA no hover);
  badges NOVO/EM ALTA; hover rico: scale 1.06 spring, spotlight/border-
  glow goldenrod seguindo o cursor (técnica MagicBento/React Bits em CSS
  vars), metadados extras revelados. Skeleton shimmer incluso — nunca
  tela em branco.
- `componentes/vitrine/HeroDestaque.tsx` — hero estilo Netflix na
  linguagem Manchete Premium: kicker, título XXL, resumo, CTA "Assistir
  agora", glow em deriva. Hero = fixado_no_hero > mais recente.
- Preview de QA: `/dev-vitrine` (dados fictícios de UI, zero banco;
  404 em produção — só com VITRINE_PREVIEW=1).

## Onde está aplicado

- `/dashboard`: hero + fileiras (era grid simples). Segurança idêntica:
  conteúdo comprado via RLS; bloqueados via teaser.
- `/learns/[slug]`: + fileira "Continue explorando" (nunca beco sem
  saída) e gravação de progresso pelo player.
- `/admin`: coluna Hero com "Fixar no hero / soltar" (server action,
  revalida o token).

## Preparado para N learns (hoje só existe 1)

Com 1 Learn publicado a vitrine mostra hero + 1-2 fileiras — esperado
nesta fase. Nenhuma reconstrução será necessária quando os episódios
172+ chegarem pela esteira: as fileiras preenchem sozinhas (trilha nova
= fileira nova; progresso/audiência ativam "Continuar"/"Em alta").
O preview `/dev-vitrine` demonstra o layout com catálogo cheio.

## Performance

Cada página busca os dados em `Promise.all` (5 queries leves e
paralelas); skeletons de hero + fileira aparecem imediatamente. Quando o
catálogo crescer a ponto de pesar, o ponto de evolução documentado é
paginar por fileira (a montagem já é isolada em `lib/vitrine`).
