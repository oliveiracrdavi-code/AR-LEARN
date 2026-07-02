# SETUP — AR LEARN

Fatos e status do projeto. Sem narrativa — só o necessário para retomar
o trabalho do tablet no PC (ou vice-versa).

## Fase atual
**Fase 0 (Fundação) — concluída, aguardando revisão do usuário.**
Não avançar para a Fase 1 sem aprovação explícita.

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

## O que falta (próximas fases)
- Rodar as migrations num projeto Supabase real (ainda não provisionado)
- Auth (sessão de usuário nas rotas de `app/(members)`)
- Landing dobra-a-dobra e identidade visual "Ouro & Concreto" (cores e
  componentes exatos ainda por confirmar com o usuário)
- Design system em `components/ui/`
- Esteira autônoma (Edge Functions em `supabase/functions/`)
- Render Remotion via GitHub Actions (`.github/workflows/`)
- Integração de pagamento (Mercado Pago) — só na Fase 4

## Variáveis de ambiente (nomes — ver `.env.example`)
Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`
YouTube: `YOUTUBE_API_KEY`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`,
`YOUTUBE_REFRESH_TOKEN`
Transcrição fallback: `GROQ_API_KEY`
Geração de conteúdo: `OPENROUTER_API_KEY`
Mapa mental: `KROKI_URL` (valor de exemplo já preenchido:
`https://kroki.io`, instância pública, sem conta/chave)
Voz: `GOOGLE_CLOUD_TTS_CREDENTIALS_JSON`
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

## Como retomar o trabalho
1. `git pull origin claude/ar-learn-platform-setup-63c3tl`
2. `npm install`
3. Ler `CLAUDE.md` (curto, sempre carregado) — para detalhe, abrir
   `docs/stack.md` ou `docs/regras.md` sob demanda
4. Conferir a seção "O que falta" acima para saber o próximo passo
