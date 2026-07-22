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

---

## SEÇÃO C — Segurança: Admin + Cada Conta de Usuário

### Admin (re-confirmar que nada regrediu)

Re-rodei os 7 cenários automatizados (`scripts/testar-admin-gate.ts`,
Playwright contra build de produção real, `next start`):

```
ok 1: sem token bloqueia
ok 2: token errado bloqueia com aviso
ok 3: token certo libera o painel
ok 4: sessão por cookie persiste
ok 5: sair volta a bloquear
ok 6: ?token= não libera (removido de propósito)
ok 7: token não vaza no HTML no fluxo form+cookie

GATE DO ADMIN: todos os 7 cenários passaram.
```

Headers de segurança re-confirmados via `curl -I` no build atual —
HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Permissions-Policy`, CSP — todos presentes, sem
regressão. Rate limiting (`lib/seguranca/rateLimit.ts`) confirmado
ainda importado em `app/admin/acoes.ts`.

### Conta de usuário comum (ponto novo desta rodada)

**1. RLS nas tabelas administrativas/novas — testado ao vivo no banco
real** (não só lido no código), simulando `anon` e `authenticated`
via `set local role` + `request.jwt.claims` (mesmo mecanismo que o
PostgREST usa pra aplicar RLS):

```sql
-- role anon
{"admin_access_log":0,"generation_config":0,"plataforma_config":0,"alteracoes_log":0,"episodios_processados":0}
-- role authenticated (usuário comum, uid fictício)
{"admin_access_log":0,"generation_config":0,"plataforma_config":0,"alteracoes_log":0,"episodios_processados":0}
```

Zero linhas em todas as 5 tabelas administrativas, nos dois papéis.
Também testei o caminho de escrita: `insert into admin_access_log`
como `authenticated` → bloqueado com `insufficient_privilege` (RLS
ativo sem nenhuma policy = deny-all pra `anon`/`authenticated`, só
`service_role` — que tem `bypassrls` — passa). Confirmado por leitura
das migrations (`generate table ... enable row level security`, zero
`create policy` pra essas 5 tabelas) e pela query ao vivo acima.

**2. Cookie httpOnly/secure/sameSite da sessão comum — investigado a
fundo, decisão registrada com o Davi.** Hoje a sessão do usuário comum
fica em `localStorage` (supabase-js padrão), não em cookie — diferente
do admin. Tentei implementar paridade real (`@supabase/ssr` + fluxo
PKCE + middleware de renovação) e descobri um obstáculo arquitetural
genuíno: o app faz queries **diretas do browser** ao Supabase
(`dashboard`, `learns/[slug]` chamam `.from('learns').select()` no
client, contando com RLS pra segurança) — um cookie **verdadeiramente**
httpOnly impediria o JS de ler o token pra essas chamadas, quebrando
esse padrão inteiro. A correção completa exigiria mover essas queries
pra rotas server-side, um refactor maior que este round de auditoria.
Além disso, **não consigo testar o fluxo de magic link neste sandbox**
(mesma política de rede que bloqueou o teste do R2/Supabase — ver
`docs/migracao-r2-log.md` — bloquearia qualquer chamada real ao
Supabase Auth) — shippar um refactor de login sem testar seria
irresponsável nesta rodada.

Apresentei 3 opções ao Davi via pergunta direta; ele escolheu **manter
localStorage e reforçar a documentação do trade-off** (opção
recomendada). Mitigação já em vigor: CSP restritiva (`script-src
'self'`, sem scripts de terceiros, sem `dangerouslySetInnerHTML` em
lugar nenhum do código — confirmado por grep) reduz a superfície de
XSS que seria necessária pra roubar o token em primeiro lugar. Decisão
consciente e registrada, não uma pendência esquecida.

**3. Endpoint que vaze dado de outro usuário sem querer** — auditei as
6 rotas de API existentes (`app/api/**/route.ts`). As 3 rotas
`/api/admin/*` (4 handlers) todas checam `autorizado()` antes de
qualquer query — confirmado por grep E por `curl` ao vivo sem cookie:
`401` nas três. `/api/learns/[slug]/ativos` exige `Authorization:
Bearer` e revalida a compra via RLS antes de assinar qualquer URL —
confirmado `401` sem header. Não existe rota "usuários" nem nenhuma
outra rota que devolva dado sem gate. `/api/stripe/webhook` valida
assinatura Stripe antes de processar (já auditado antes, sem
regressão).

**4. Logout do usuário comum** — `dashboard/page.tsx` tem botão "Sair"
chamando `supabase.auth.signOut()` (limpa a sessão) e redireciona pra
`/`. Confirmado por leitura do código; é a mesma API oficial do
supabase-js, comportamento padrão e testado pela própria lib.

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
