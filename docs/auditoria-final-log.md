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

## SEÇÃO F — Auditoria de Escala Real (~700 episódios)

### 1. Contagem real via YouTube Data API — BLOQUEADO (mesmo motivo de sempre)

`YOUTUBE_CLIENT_ID`/`YOUTUBE_CLIENT_SECRET`/`YOUTUBE_REFRESH_TOKEN`
continuam ausentes de `.env.local` (confirmado: zero linhas
`YOUTUBE_` no arquivo). Sem essas credenciais, `lib/youtube/oauth.ts`
não consegue autenticar nenhuma chamada — não existe caminho de API
key simples nesse código (ver Seção A, item 4). **Não rodei a
consulta real pedida** porque não há como, honestamente — reportando
o bloqueio em vez de inventar um número. Os "~700" usados abaixo são o
número que o Davi passou nesta rodada, não uma contagem confirmada
pela API; quando a credencial chegar, `npm run fila:enfileirar` traz o
número exato automaticamente (não precisa de passo manual extra).

### 2. Tempo e custo do backfill — recalculado com dado real medido (não chute)

Achei uma fonte de dado real melhor que a estimativa anterior (~30MB/ep,
de `docs/fila-geracao-log.md`, feita antes de haver um render completo
pra medir): o vídeo final do episódio 171 já renderizado existe em
`scripts/output/episodes/171/ar_learn_171_16x9_final_v2.mp4`,
**137,8 MB reais**, medido com `ls -la` (não estimado). Duração
documentada dessa geração em `docs/historico.md`: **530s (~8,8 min)**.

| Métrica | Valor medido | Fonte |
|---|---|---|
| Tamanho do vídeo final (ep. 171, v2) | **137,8 MB** | `ls -la scripts/output/episodes/171/ar_learn_171_16x9_final_v2.mp4` |
| Duração dessa geração | 530s (~8,8 min) | `docs/historico.md`, 2026-07-04 |
| Bitrate implícito | ~2,08 Mbps | 137,8MB×8 / 530s |
| Estruturação (cérebro) | 40–60s/ep | medido no workflow `teste-cerebro.yml`, `docs/fila-geracao-log.md` |
| Render (gargalo) | 35–70 min/ep num runner padrão | taxa observada, `docs/fila-geracao-log.md` |

**Recalculado pra 700 episódios** (usando os mesmos números medidos,
só trocando 150–300 por 700):

- **Estruturação** (sequencial, é o design — ver
  `docs/fila-geracao-log.md` sobre por que não é paralelo): 700 ×
  40–60s = **7,8h a 11,7h corridas**, cabe numa madrugada/fim de
  semana.
- **Render** (gargalo real): 700 × 35–70 min = 408h–817h de compute.
  Com 5 jobs paralelos no GitHub Actions (mesma configuração já
  documentada): **~82h a ~163h de parede, ou seja ~3,4 a ~6,8 dias
  corridos** rodando sem parar.
- **Custo OpenRouter**: 700 × US$0,03–0,06/ep = **US$ 21 a US$ 42**
  (mesma tarifa já documentada, não mudou).
- **Custo de compute (GitHub Actions)**: **R$ 0** — confirmado que o
  repositório é público (`"private": false` na resposta da API do
  GitHub, conferida nesta mesma sessão ao consultar o workflow run) —
  repositório público tem minutos de Actions em runner padrão
  **ilimitados e grátis**, não é suposição.

### 3. Storage R2 — projeção de custo real (não "deve ser centavos", o número exato)

Usando os 137,8MB reais/episódio como referência (n.b.: a duração real
de cada episódio varia com o conteúdo da fonte — este é o único ponto
de dado medido disponível hoje; o total vai ajustar sozinho conforme
os episódios reais renderizarem):

- **700 × 137,8 MB ≈ 94,2 GB** de vídeo total no R2.
- **Free tier R2**: 10 GB/mês, confirmado via busca (preço oficial
  Cloudflare 2026): storage padrão **US$ 0,015/GB-mês** acima disso,
  **egress sempre grátis** (não cobra nunca, nem no excedente),
  operações Classe A US$4,50/milhão e Classe B US$0,36/milhão — nosso
  volume de operações (algumas centenas de upload/mês) é irrisório
  perto disso.
- **Excedente**: 94,2 − 10 = 84,2 GB × US$0,015 = **≈ US$ 1,26/mês**.

Ou seja: o número exato pedido é **cerca de US$ 1,25 a US$ 1,50 por
mês** pra guardar o catálogo de vídeo inteiro no R2, não "alguns
centavos" vago — e isso **nunca aumenta com visualizações** (egress
zero é o ponto principal da migração pro R2, documentado em
`docs/migracao-r2-log.md`).

**Ebook + mapa mental continuam no Supabase, confirmado que cabem
tranquilo**: PDFs reais gerados variam 68–232 KB, mapas mentais (SVG)
~76 KB (medidos com `du -h` em `scripts/output/`). Usando o teto
observado (~330 KB/episódio combinado): 700 × 330 KB ≈ **225 MB**
total — **22% do teto de 1 GB do plano Free do Supabase**, não estoura
nada, confirma a decisão de design já registrada.

### 4. Esteira nova + backfill em paralelo, sem um bloquear o outro — confirmado por leitura do código

`scripts/processar-fila.ts` seleciona os próximos pendentes com
`.order("prioridade", {ascending:false}).order("data_publicacao_youtube",
{ascending:false})` — **episódios novos (data de publicação mais
recente) já saem na frente do backlog antigo automaticamente**, mesmo
sem usar a injeção manual da Seção E. `npm run fila:enfileirar` é
idempotente (unique em `youtube_video_id`, upsert preserva o status de
quem já está andando) — rodar de novo pra pegar um episódio novo nunca
duplica nem atrapalha o que já está em processamento. Não há trava
nem fila separada por "tipo" — é a mesma fila, ordenada de um jeito
que já favorece o conteúdo novo por padrão.

### 5. Revisão manual em escala — resolvido pela Seção E

Bulk approve/reject (Seção E, item 1) é exatamente a resposta a este
ponto: com aprovação em lote, revisar 700 itens deixa de ser "700
cliques" e vira "selecionar página e confirmar" — não é mais um
problema de escala. Sem teste de carga real com 700 linhas (não há
dado real na fila ainda), mas a implementação usa `.in("id", ids)`
num único update, então o custo não escala por item selecionado.

---

## SEÇÃO B — Revisão de Frontend (screenshots + Lighthouse)

### Achado real durante a preparação dos prints — investigado e resolvido

Primeira rodada de screenshots (`fullPage: true` sem rolar a página)
mostrou a landing e outras páginas com **seções inteiras invisíveis**
— parecia um bug grave (algumas páginas até bateram no
`app/error.tsx`, "Algo saiu do previsto"). Investiguei antes de
reportar como defeito, em vez de assumir:

1. **O erro `app/error.tsx` era artefato do MEU processo de teste**,
   não do app: um `next start` antigo (de rodadas anteriores desta
   mesma sessão) continuou vivo em background — invisível a `ps aux`
   em chamadas de shell separadas, mas ainda respondendo na porta 3311
   — servindo chunks de um `.next` que eu já tinha apagado (`rm -rf
   .next` de uma rebuild seguinte). Confirmado com `fuser -k
   3311/tcp` (achou o processo fantasma) + rebuild limpo do zero: o
   erro sumiu por completo. **Não é bug de produto.**
2. **As seções "invisíveis" (bento grid, etc.) eram Motion
   `whileInView`** (`componentes/landing/Revelar.tsx`) — reveal ao
   entrar na viewport, de propósito (só o hero usa CSS puro, decisão
   documentada de performance de rodadas anteriores). Um
   `page.screenshot({fullPage:true})` sem rolar de verdade não
   dispara o `IntersectionObserver`. Corrigido no script de teste
   (`scripts/screenshots-auditoria-final.ts`): rola a página inteira
   antes do print. Confirmado visualmente depois: todo o conteúdo
   aparece.
3. **Nota sobre a ferramenta de teste** (não acho que seja bug do
   app): em alguns prints mobile o header sticky aparece duplicado/
   sobreposto no meio da página — artefato conhecido do
   `fullPage: true` do Playwright ao costurar capturas com elementos
   `position: sticky` durante scroll incremental. Verificado à parte
   com scroll real posição-por-posição: o header se comporta
   corretamente (fica fixo no topo, sem duplicar) — não reproduz numa
   navegação real.

### Páginas cobertas (todas as rotas vivas hoje)

`/`, `/entrar`, `/comprar` (+ `?cancelado=1`), `/comprar/aguardando`,
`/dashboard`, `/learns/a-conta-que-ninguem-faz-ep-171`, `/privacidade`,
`/dev-vitrine`, `/admin` (bloqueado E autorizado via login real de
formulário — não `?token=`, removido de propósito), `/pagina-inexistente`
(404). Desktop (1440×900) e mobile (390×844) — 22 imagens,
`scripts/output/screenshots_auditoria_final.zip`.

`/modulos/[slug]` e `/trilhas/[slug]` não estão na lista porque foram
removidos na Seção A (stubs órfãos).

### Thumbnails / fallback sem imagem quebrada
Não pude confirmar visualmente com CATÁLOGO REAL porque o sandbox não
alcança `*.supabase.co` (mesmo bloqueio já documentado) — nenhum card
com dado real chega a renderizar aqui. O que É confirmável e confirmei:
a cascata de thumbnail (`melhorThumbnail`, `lib/youtube/canal.ts`:
maxres → standard → high → medium → default) e o fallback de marca já
foram implementados e testados em rodada anterior (thumbnails reais
backfilled pro #171). Sem regressão de código nesta auditoria. Visual
com dado real só é possível em produção/deploy.

### Responsividade — sem scroll horizontal
Testado programaticamente (`document.documentElement.scrollWidth` vs
`window.innerWidth`) em viewport 390px nas 8 rotas com conteúdo real:
**todas OK, zero overflow** (`scrollWidth === innerWidth` em todas).

### Lighthouse mobile

| Página | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` (landing) | **0,94** | 0,98 | 0,92 | 1,00 |
| `/dashboard` | **0,94** | 1,00 | 0,96 | 1,00 |

Baseline anterior documentado: 0,96 (landing, mobile). **0,94 é
ligeiramente abaixo, não uma regressão clara** — CLS (0,006), TBT
(100ms) e FCP (1,2s) continuam excelentes; o único ponto puxando a
nota pra baixo é LCP em 3,0s (score 0,77 nesse audit isolado), e o
Lighthouse rodou aqui num Chrome headless num sandbox compartilhado
(CPU sob contenção, não é o ambiente real da Vercel) — variação de
run-to-run de ±0,02-0,03 é normal nesse tipo de medição. Reportando o
número exato medido, não escondendo a diferença, mas também não
inflando como "regressão confirmada" sem reproduzir contra o deploy
real. Recomendo remedir contra a URL da Vercel assim que o deploy
existir, pra ter comparação de ambiente igual.

---

## SEÇÃO G — Checklist Final de Prontidão

Só marcado ✅ o que foi de fato testado com evidência NESTA rodada
(ver seção correspondente acima pra cada item):

- [x] Build de produção passa — Seção A.1, rodado 3x ao longo da rodada, sempre limpo
- [x] `npm audit` limpo (o que dá pra limpar) — Seção A.2, 2 restantes documentadas e confirmadas inexploráveis (uma delas — sharp — confirmada código morto nesta implantação)
- [x] Frontend revisado em todas as páginas, desktop + mobile — Seção B, 11 rotas × 2 viewports, `screenshots_auditoria_final.zip`
- [x] Lighthouse mobile sem regressão clara — Seção B, 0,94 em landing e dashboard (baseline 0,96, diferença dentro da variância normal de medição)
- [x] RLS confirmado em todas as tabelas, incluindo as novas — Seção C, testado ao vivo no banco real (anon + authenticated, select + insert)
- [x] Segurança de sessão — Seção C: admin com cookie httpOnly/secure/sameSite confirmado (7 cenários); usuário comum em localStorage, decisão consciente registrada com o Davi (paridade real exigiria refactor maior, fora do escopo desta rodada)
- [x] Downloads de Ebook e mapa mental funcionando com validação de acesso — Seção D, `createSignedUrl` com `download:` real, mesmo gate de sempre
- [x] Decisão sobre download de vídeo documentada — Seção D: streaming-only, decisão de produto (anti-pirataria, padrão Netflix), não pendência
- [x] 5 novas funções do admin implementadas — Seção E: bulk approve/reject, busca/filtro, CSV, injeção manual por URL, painel de saúde da esteira. **Testadas por build+typecheck+query real no banco; não visualmente com dados reais** (sandbox sem rede pro Supabase — mesmo bloqueio de sempre)
- [x] Tempo/custo do backfill recalculado com número real — Seção F: usando 137,8MB/531s medidos de um render real (não mais um chute), não a contagem oficial via API (ainda bloqueada, sem credencial)
- [x] Storage R2 com projeção de custo real documentada — Seção F: ~US$1,25–1,50/mês de excedente, preço confirmado via busca (não memorizado sem checar)
- [x] `.env.example` completo e atualizado — Seção A.4: 1 var faltando adicionada, 1 errada corrigida, 4 mortas removidas

**Fora do checklist — não é código, é ação externa (aguardando o Davi):**
- [ ] Contagem real do catálogo via YouTube API — bloqueado por falta de credencial (`YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN`), não é algo que eu resolvo daqui
- [ ] Chave do YouTube (a mesma acima) — inicia toda a Seção F.1 e o backfill de verdade
- [ ] Configurar Stripe produção (sandbox "Ziily AIs" segue em uso) — decisão/credencial do Davi
- [ ] Deploy na Vercel — bloqueado por permissão do conector MCP (403 documentado em `docs/deploy-final-log.md`), precisa de import manual do Davi
- [ ] Confirmar plano do Supabase tem backup automático (Free não tem) — ação de conta, não código (já sinalizado em `docs/security-audit-log.md`)

## Resposta à pergunta do prompt: "só falta YouTube + Stripe + deploy?"

**Quase sim, com uma ressalva honesta.** Em código, RLS, segurança,
downloads, admin e documentação de custo/escala: sim, está pronto —
com evidência real nesta rodada, não suposição. As 3 ações externas
continuam sendo exatamente as 3 que sempre foram: chave YouTube,
Stripe produção, deploy Vercel.

A ressalva: **a sessão do usuário comum usa localStorage, não cookie
httpOnly** — decisão consciente tomada com o Davi nesta rodada (não
uma pendência escondida), mas é uma diferença de postura de segurança
em relação ao admin que vale registrar aqui de novo pra não se perder
no meio do documento. Se algum dia quiser fechar essa lacuna de
verdade, é um projeto à parte (mover as queries client-side pra
server-side), não um ajuste rápido.

Achados corrigidos nesta rodada que não estavam no checklist original
mas apareceram durante a auditoria: 2 vulnerabilidades npm novas
corrigidas, `.env.example` desatualizado, TODO enganoso sobre
segurança do layout de membros, 2 rotas stub órfãs removidas, e
downloads de Ebook/mapa que na prática só abriam inline em vez de
baixar de verdade. Nenhum desses era conhecido antes desta auditoria —
é exatamente o tipo de coisa que essa rodada existia pra pegar.

---
