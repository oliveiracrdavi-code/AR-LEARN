# SETUP — AR LEARN

Fatos e status do projeto. Sem narrativa — só o necessário para retomar
o trabalho do tablet no PC (ou vice-versa).

## Fase atual
**Fase 2 (Geração dos 3 ativos) — PDF e mapa mental validados com
conteúdo real; videoaula com composição pronta, mas BLOQUEADA por
falta da credencial Cloudflare Workers AI (não inventada, aguardando o
usuário).** Voz trocada de Google Cloud TTS para Cloudflare Workers AI
(MeloTTS) em 2026-07-04 — suporte a pt-BR ainda não confirmado na
prática, ver `docs/historico.md`. Ingestão real do YouTube (Fase 1)
segue pendente das credenciais OAuth, sem data marcada — não bloqueia
o resto.

## Ambiente
- Node.js 22, npm 10
- Repositório: `oliveiracrdavi-code/AR-LEARN`, branch de trabalho:
  `claude/ar-learn-platform-setup-63c3tl`
- `npm install` já validado (build e type-check passam)

## O que já está configurado
- [x] `.claudeignore` — reduz contexto automático carregado por sessão
- [x] `CLAUDE.md` — regras inegociáveis, enxuto
- [x] `docs/stack.md`, `docs/regras.md`, `docs/historico.md` — documentação sob demanda
- [x] Estrutura de pastas Next.js (App Router): `app/(marketing)`,
      `app/(members)`, `app/api`, `components/`, `lib/supabase/`,
      `supabase/migrations/`, `supabase/functions/`, `remotion/`,
      `.github/workflows/`, `scripts/`
- [x] `.env.example` com todos os nomes de variável (sem valores)
- [x] Migrations SQL do Supabase:
  - `supabase/migrations/20260702120000_schema.sql` — tabelas
    `trilhas`, `modulos`, `learns`, `episodios_processados`, `perfis`,
    `compras`
  - `supabase/migrations/20260702120100_rls.sql` — RLS ativo em todas
    as tabelas + view `learns_publico` para teaser público
- [x] Projeto Next.js inicializado (`package.json`, `tsconfig.json`,
      `next.config.ts`, `eslint.config.mjs`), sem UI — `npx next build`
      passa limpo
- [x] `lib/supabase/client.ts` (browser, anon key) e
      `lib/supabase/server.ts` (service role, server-only)

### Fase 1 — Esteira mínima (1 episódio)
- [x] Ingestão YouTube: `lib/youtube/oauth.ts` (fetch puro, sem SDK),
      `canal.ts` (uploads playlist + paginação), `legenda.ts`
      (download + SRT → texto corrido)
- [x] Fallback Groq Whisper: `lib/groq/transcrever.ts`
- [x] Cérebro: `lib/openrouter/schema.ts` (contrato JSON do Learn, zod,
      `.strict()`), `systemPrompt.ts` (persona Leandro), `gerarLearn.ts`
      (chamada + validação + retry em JSON malformado/rate limit)
- [x] Idempotência: `lib/supabase/episodiosProcessados.ts`
- [x] Script de teste: `scripts/fase1-testar-episodio.ts`
      (`npm run fase1:teste`) — build e dry-run (sem credenciais) já
      validados, falha limpa no ponto esperado
- [x] `scripts/testar-schema-offline.ts` (`npm run schema:teste`) —
      contrato JSON validado offline: aceita fixture completo, rejeita
      campo faltando e campo extra
- [x] `scripts/testar-cerebro-isolado.ts` (`npm run cerebro:teste`) —
      **validado com sucesso via GitHub Actions** (chaves reais em
      GitHub Secrets; a sandbox de dev local segue sem rede pra
      `openrouter.ai`/`api.groq.com`, ver `docs/historico.md`)
- [x] `scripts/testar-youtube-mock.ts` (`npm run youtube:teste`) — 9/9
      testes passando localmente com respostas simuladas da API
      (paginação, priorização de legenda, fallback, erro 403, cache do
      token), sem credenciais reais
- [x] Validação de duração mínima (420s) por código em `gerarLearn.ts`,
      confirmada funcionando via Actions (retry eleva a duração a cada
      tentativa; loga `[tentativa N] duração do roteiro: Xs`)
- [ ] **Teste real com 1 episódio (YouTube) — pendente das credenciais
      de OAuth, sem data marcada** (o usuário ainda não tem acesso de
      gerente ao canal); código já pronto pra recebê-las

### Fase 2 — Geração dos 3 ativos
- [x] Fixture de conteúdo real (não sintético):
      `scripts/fixtures/transcricao-mercado-imobiliario.txt` (genérica,
      sem dados da Carozzo) → JSON real gerado via cérebro em
      `scripts/output/fixture-mercado-imobiliario.json` (gitignored):
      530s de roteiro, 11 cenas, 7 seções de PDF
- [x] Mapa mental: `lib/mapa-mental/kroki.ts` (imagem via Kroki),
      `converter.ts` (Mermaid mindmap → markdown pro Markmap — formatos
      diferentes, contrato usa um, o site usa outro) e `markmap.ts`
      (validação estrutural). Validado com conteúdo real: 35 nós,
      confirmado visualmente num Chromium headless (`npm run` via
      `scripts/testar-mapa-mental-visual.ts`), zero erros
- [x] PDF: `lib/pdf/gerarPdf.ts` (HTML → PDF via Playwright/Chromium,
      sem serviço pago). Gerado com sucesso a partir do conteúdo real,
      2 páginas, com o mapa mental embutido
- [x] Composição Remotion (`remotion/src/`): título + cenas a partir de
      `video_roteiro`, schema zod pras props, `audioSrc` opcional
      (sem ele, renderiza mudo — nunca voz substituta)
- [x] Render mecânico (sem áudio) rodado localmente: 535,06s (bate com
      5s intro + 530s de cenas), 1920x1080/30fps, áudio confirmado
      100% silêncio via `ffmpeg silencedetect` (não é narração falsa)
- [ ] **Narração (Cloudflare Workers AI, MeloTTS) — BLOQUEADA**: código
      pronto em `lib/tts/sintetizar.ts` (fetch puro, sem SDK), mas
      `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` não configuradas em
      lugar nenhum. Não invocado. **Risco em aberto**: documentação do
      MeloTTS não lista português como idioma suportado — a validar
      com a API real quando as credenciais chegarem (ver
      `docs/historico.md`). Código antigo do Google Cloud TTS movido
      pra `lib/tts/obsoleto/`, não apagado
- [ ] Render completo da videoaula (com narração) via
      `.github/workflows/render-video-temp.yml` (criado, não disparado)

## O que falta (próximas fases)
- Rodar as migrations num projeto Supabase real (ainda não provisionado)
- Rodar o teste real da Fase 1 com credenciais válidas
- Trazer as credenciais do Cloudflare Workers AI e confirmar suporte a
  pt-BR (ou trocar de novo, se não suportar) pra concluir a videoaula
- Auth (sessão de usuário nas rotas de `app/(members)`)
- Landing dobra-a-dobra — identidade visual definida (fundo `#000814`,
  destaque `#DFA02C`, logo `public/logo-ar.jpg`, persona "Magnata
  Imobiliário" — ver `docs/regras.md`), componentes ainda por construir
- Design system em `components/ui/`
- Publicação no Supabase (Fase 3)
- Integração de pagamento (Mercado Pago) — só na Fase 4

## Variáveis de ambiente (nomes — ver `.env.example`)
Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`
YouTube: `YOUTUBE_API_KEY`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`,
`YOUTUBE_REFRESH_TOKEN`, `YOUTUBE_CHANNEL_ID`
Transcrição fallback: `GROQ_API_KEY`
Geração de conteúdo: `OPENROUTER_API_KEY`
Mapa mental: `KROKI_URL` (valor de exemplo já preenchido:
`https://kroki.io`, instância pública, sem conta/chave)
Voz: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
Pagamento: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`,
`ASAAS_API_KEY`
App: `NEXT_PUBLIC_SITE_URL`

## Decisões registradas nesta fase
- Kroki: instância pública `https://kroki.io`, sem conta/chave
- Gateway de pagamento: Mercado Pago é o principal (Pix); Asaas é
  alternativa documentada, não implementada agora — entra em código só
  na Fase 4
- Deploy na Cloudflare Pages usará o adapter `@cloudflare/next-on-pages`
  (a configurar na fase de deploy); `next.config.ts` não usa
  `output: "export"` porque a área de membros e os webhooks de
  pagamento precisam de rotas dinâmicas
- Sistema de economia de tokens adotado como prática permanente a
  partir desta fase (ver `CLAUDE.md`)

## Decisões registradas na Fase 1
- Ingestão YouTube implementada com `fetch` puro (sem SDK `googleapis`):
  fica portável entre Node (script/GitHub Actions) e runtimes serverless
  (Supabase Edge Functions, Cloudflare Workers) — a camada de runtime
  definitiva só é escolhida na Fase 5
- Módulos de pipeline (`lib/youtube/`, `lib/groq/`, `lib/openrouter/`,
  `lib/supabase/episodiosProcessados.ts`) **não** usam o guard
  `server-only`, porque rodam fora da árvore do app Next.js (scripts,
  GitHub Actions); só `lib/supabase/server.ts` (usado por Route
  Handlers do Next.js) mantém o guard, reexportando de
  `lib/supabase/serviceRoleClient.ts`
- Groq (fallback de transcrição): a função recebe o áudio como
  parâmetro — a YouTube Data API não expõe download de mídia bruta, só
  legendas. Quando faltar legenda num episódio real, o áudio-fonte
  precisa ser fornecido manualmente (a produção já tem o arquivo da
  gravação); **confirmar esse fluxo com o usuário antes de usar em
  produção**
- Modelo padrão do cérebro: `google/gemini-2.5-flash` via OpenRouter
  (o slug anterior, `gemini-2.0-flash-001`, foi descontinuado —
  corrigido em 2026-07-04), trocável por `OPENROUTER_MODEL` sem mexer
  em código
- Resultado do teste de 1 episódio é salvo em `scripts/output/<video_id>.json`
  (gitignored — não é publicação, é só o artefato de verificação da Fase 1)

## Como retomar o trabalho
1. `git pull origin claude/ar-learn-platform-setup-63c3tl`
2. `npm install`
3. Ler `CLAUDE.md` (curto, sempre carregado) — para detalhe, abrir
   `docs/stack.md` ou `docs/regras.md` sob demanda
4. Conferir a seção "O que falta" acima para saber o próximo passo
5. Para rodar o teste da Fase 1: preencher um `.env.local` (nunca
   commitado) com as credenciais reais e rodar `npm run fase1:teste`
