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

---

## SEÇÃO D — Downloads Reais (Vídeo, Ebook, Mapa Mental)

**Achado real, corrigido nesta rodada**: nem Ebook nem mapa mental
tinham download de verdade. `createSignedUrl` era chamado sem a opção
`download` — o link "Baixar o Ebook" abria o PDF inline no browser (só
visualização, apesar do texto do botão), e o mapa mental nem tinha
texto de "baixar" (dizia "Ver mapa mental").

**Corrigido**: `app/api/learns/[slug]/ativos/route.ts` agora chama
`createSignedUrl(path, validade, { download: nomeArquivo })` pra Ebook
e mapa — confirmado no código-fonte do SDK instalado
(`node_modules/@supabase/storage-js`, `download?: string | boolean` é
opção real da API, não suposição) que isso seta
`Content-Disposition: attachment` com nome amigável (`{slug}-ebook.pdf`,
`{slug}-mapa-mental.svg`) em vez do path interno do bucket. UI
atualizada (`learns/[slug]/page.tsx`): "Baixar mapa mental" (era "Ver")
+ atributo `download` nos dois `<a>`.

**Vídeo — decisão de produto, não pendência**: mantido **streaming
apenas**, sem link de download. Documentado em comentário no código
(`learns/[slug]/page.tsx`) e aqui: mesmo padrão de plataformas de
curso/streaming (a própria referência de design é a vitrine estilo
Netflix) — reduz o caso trivial de "salvar e repassar o arquivo"
sem fricção nenhuma pra quem só quer assistir. Decisão consciente,
reversível se o Davi quiser mudar depois.

**Validação de acesso em todos os 3**: os três (`video`, `ebook`,
`mapa`) saem da MESMA resposta de `/api/learns/[slug]/ativos`, que só
roda depois da consulta `learns` com o token do usuário (RLS decide se
a linha existe) — nenhum link direto/sem gate em nenhum dos três,
confirmado por leitura do código (não mudou nesta correção, só a opção
`download` foi adicionada em cima do fluxo já existente).

---

## SEÇÃO E — Admin Panel: Confirmado + 5 Funções Novas

### Já existente (re-confirmado por leitura + smoke test, sem regressão)
- Concessão manual de acesso por e-mail — `concederAcesso` em `acoes.ts`, inalterado.
- Dashboard de vendas/receita — inalterado, re-renderizado no smoke test.

### 5 funções novas — todas implementadas nesta rodada

1. **Aprovação em lote**: checkboxes em cada item de "Pendentes de
   revisão" + 2 botões ("Aprovar selecionados", "Rejeitar
   selecionados"). Tecnicamente: um `<form id="form-lote-revisao">`
   "fantasma" declara o contexto; os checkboxes e os botões de lote se
   associam a ele via atributo HTML `form=` (nativo, funciona mesmo
   fora da árvore DOM do form) — os forms individuais de
   aprovar/rejeitar item-a-item continuam intactos e sem conflito,
   porque cada um só carrega o próprio `learn_id`. Novas actions
   `aprovarLearnsEmLote`/`rejeitarLearnsEmLote` em `acoes.ts` usam
   `formData.getAll("learn_ids")` + `.in("id", ids)`.
2. **Busca e filtro**: `Learns — gestão` ganhou busca por título (ilike)
   + filtro por status; `Usuários e acessos` ganhou busca por e-mail.
   Implementado como filtro real no banco (`.ilike()`), não em memória
   — importa em escala de ~700 itens. **Achado corrigido durante a
   implementação**: a lista `learns` original alimentava TRÊS coisas
   diferentes (lookup de título em Compras/Usuários, fila de
   "pendentes de revisão", E a grade de gestão) — se ela fosse
   filtrada, um filtro de título quebraria as outras duas seções sem
   relação nenhuma com o filtro. Corrigido separando em `learns`
   (sempre completa) e `learnsGestao` (filtrada, só usada na grade).
3. **Exportar CSV**: `GET /api/admin/vendas/csv` (gated por
   `autorizado()`, confirmado `401` sem cookie no smoke test da Seção
   C) — serializa todas as compras com `Content-Disposition:
   attachment`. Dado NÃO mascarado (mesmo nível de confiança de
   `?revelar=1`, mesmo gate — é exatamente pra contabilidade/imposto,
   mascarar inutilizaria o arquivo).
4. **Injeção manual por URL**: form que aceita URL completa
   (`watch?v=`, `youtu.be/`, `/shorts/`) ou o ID puro, extrai o
   `videoId`, e faz upsert em `episodios_processados` com
   `prioridade=true` + `status_pipeline='pendente'` (sem duplicar linha
   se o episódio já existir na fila). Pra a prioridade ter efeito de
   verdade, `scripts/processar-fila.ts` (que roda no GitHub Actions)
   foi atualizado: `.order("prioridade", {ascending:false})` antes do
   `.order("data_publicacao_youtube")` — confirmado por leitura do
   código, sem teste real de execução (não há vídeo real ainda).
5. **Painel de saúde da esteira**: 3 StatCards — pendentes na fila,
   última execução com sucesso, erros nas últimas 24h. Contagens via
   `count: 'exact', head: true` DIRETO NO BANCO (não sobre os 20 itens
   exibidos na tabela) — testado ao vivo contra o schema real via MCP:

   ```json
   {"pendentes":0,"erros_24h":0,"ultimo_sucesso":null,"coluna_prioridade_existe":"prioridade"}
   ```

   (Zeros esperados: fila vazia, aguardando a chave do YouTube.)

### Migration nova
`supabase/migrations/20260722220600_prioridade_fila.sql` — coluna
`episodios_processados.prioridade boolean not null default false`.
Aplicada no projeto real via MCP (confirmado `{"success":true}`) e
versionada no repo.

### Validação
Build de produção limpo com as 5 mudanças. FK
`compras_learn_id_fkey → learns.id` confirmada ao vivo (necessária pro
`.select("...,learns(titulo)")` embutido do CSV funcionar). Smoke test
via Playwright (login real + render da página) confirma que nada
quebrou — sem crash, sem erro 500 — mas **as seções novas não puderam
ser verificadas visualmente com dados reais**: o sandbox não alcança
`*.supabase.co` (mesmo bloqueio de rede documentado em
`docs/migracao-r2-log.md`), então o painel cai no estado gracioso
"Supabase indisponível" aqui. Validação real (visual, com dados) só é
possível em produção/deploy — reportado com honestidade, não inventado.

---
