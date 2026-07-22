# Auditoria Final Completa — 2026-07-22

Objetivo: confirmar com evidência real (não suposição) que só faltam 3
ações externas — chave YouTube, configurar Stripe, deploy na Vercel —
antes de produção. Cada item abaixo foi testado nesta rodada; o que não
pôde ser testado está listado à parte, fora do checklist, como
"aguardando decisão/ação do usuário".

## Correção de escala

Catálogo real: **~700 episódios** (não 150-300 como estimado antes).
Impacto tratado nas Seções E e F abaixo.

---

## SEÇÃO A — Auditoria Geral do Código

### 1. Build de produção
`npm run build` → **✅ passa limpo**, sem erros nem warnings novos.
Rodado 2x nesta rodada (antes e depois das correções abaixo) — ambas
limpas.

### 2. `npm audit`
Estado ANTES desta rodada: 5 vulnerabilidades (1 moderada, 4 altas) —
`brace-expansion`, `fast-uri`, `postcss`, `sharp`. As duas primeiras
eram **novas** desde a última auditoria (não estavam documentadas).

**Ação tomada**: rodei `npm audit fix` (sem `--force`) — resolveu
`brace-expansion` e `fast-uri` via patch bump do Next (16.2.10 →
16.2.11), sem breaking change. Restam 2, ambas **documentadas e
avaliadas como risco real baixo/nulo**:

| Pacote | Severidade | Por que não foi corrigido | Exploração real |
|---|---|---|---|
| `postcss` (embutido no Next) | Moderada | Fix exigiria downgrade pra Next 9 | Já documentado em `docs/security-audit-log.md` — CSS é 100% autoral, sem input de usuário no build |
| `sharp` (embutido no Next, via `next/image`) | Alta (CVSSv4 7.0) | Mesma causa — embutido, não dependência direta | **Confirmado inexplorável**: `next.config.ts` tem `images.unoptimized: true` (a única rota que invoca `sharp` em runtime, `/_next/image`, está desligada) e `grep -rl sharp app lib scripts` não retorna nenhum import — `sharp` é código morto nesta implantação. A CVE em si (GHSA-f88m-g3jw-g9cj) afeta só quem processa GIF/TIFF/VIPS não confiáveis, o que nunca acontece aqui. |

`npm audit` final: **1 moderada + 1 alta, ambas documentadas e
inexploráveis no nosso deployment** (evidência acima, não suposição).

### 3. `console.log` de debug em código de produção
`grep -rn "console\.(log|debug)" app/` → **zero ocorrências**. Nenhum
log de debug em nenhuma rota Next.js (server ou client).

Em `lib/` só existem 2 ocorrências (`lib/openrouter/gerarLearn.ts`,
`lib/util/log.ts`), e ambas são **inalcançáveis pelo app implantado na
Vercel** — só são importadas por `scripts/processar-fila.ts` e
similares, que rodam exclusivamente no GitHub Actions (esteira), nunca
dentro de uma rota `app/`. Confirmado via grep: nenhum arquivo em
`app/` importa `gerarLearn` ou `logComTimestamp`. Conferi também que
nenhuma das mensagens logadas interpola valor de chave/segredo — são só
strings de status ("Chamando OpenRouter...", "Kroki não respondeu em
Xs").

### 4. `.env.example` completo e atualizado
Comparei `grep -rhoE "process\.env\.[A-Z_]+"` em `app/lib/scripts` (27
vars distintas) contra o `.env.example` existente. Encontrei e
corrigi:

- **Faltava**: `OPENROUTER_MODEL_ALTERACOES` (usado em
  `lib/generation/traduzirAlteracao.ts`, feature de alterações via IA)
  — adicionado, documentado como opcional.
- **Estava errado**: `YOUTUBE_API_KEY` listado como necessário, mas o
  código **nunca lê essa variável** — a ingestão usa só OAuth
  (`YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN`, ver
  `lib/youtube/oauth.ts`). Corrigido: removida a entrada enganosa,
  comentário explicando que só OAuth é necessário.
- **Morto**: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`,
  `ASAAS_API_KEY`, `NEXT_PUBLIC_EP171_VIDEO_URL` — zero ocorrências em
  `process.env.*` em todo o código (`grep` confirmou). Restos da fase
  Mercado Pago/pré-thumbnail-real, antes da virada pra Stripe/R2.
  Removidos.
- **Plano C (TTS Google Cloud)**: código existe em
  `lib/tts/obsoleto/sintetizarGoogleCloudTts.ts` mas não é importado
  por nenhum caminho ativo — documentado como opcional/comentado no
  `.env.example`, não como obrigatório.

`.env.example` agora reflete exatamente o que o código lê, sem
entradas fantasma nem faltantes.

### 5. TODO/FIXME honesto
`grep -rn "TODO\|FIXME\|XXX:\|HACK:" app lib scripts` → **1 ocorrência
real** (as outras 3 eram a palavra "TODO" em português dentro de
comentários, não marcador de pendência):

- `app/(members)/layout.tsx`: `// TODO (Fase de Auth): validar sessão
  Supabase...` — **investigado e corrigido nesta rodada**. Era um
  comentário desatualizado: a proteção real não fica no layout, fica
  em cada página (`useSessao()` + RLS na consulta) e na API de ativos
  (`/api/learns/[slug]/ativos`, revalida a compra antes de assinar
  URL) — confirmado lendo `dashboard/page.tsx` e `learns/[slug]/page.tsx`,
  as duas já implementam esse padrão corretamente. Risco real: **zero**
  (a proteção de dados sempre existiu via RLS; só o comentário estava
  errado). Troquei o TODO por um comentário que descreve o padrão real.

**Achado extra durante essa checagem** (fora do TODO, mas relacionado):
`app/(members)/modulos/[slug]/page.tsx` e `.../trilhas/[slug]/page.tsx`
eram **stubs órfãos** — sem nenhuma consulta a dado nenhum, sem link
de nenhum lugar do app (`grep` confirmou zero referências), e
contradiziam a decisão de arquitetura já registrada ("Trilha/Módulo
continuam só estrutura de banco, nunca virem rótulo de UI"). Risco de
segurança: nulo (não expunham dado nenhum). Removidos como limpeza —
não fazem parte do produto final.

Build de produção rodado de novo após as remoções — continua limpo
(ver item 1).
