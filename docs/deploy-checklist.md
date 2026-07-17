# Deploy Checklist — Altamente Rentável Academy

Ativação final quando as credenciais chegarem: preencher env vars,
rodar SQL, subir arquivos. Zero retrabalho de código.

## 1. Supabase (dashboard supabase.com)
1. Criar o projeto (região São Paulo).
2. **SQL**: rodar na ordem — `supabase/migrations/20260702120000_schema.sql`
   → `20260702120100_rls.sql` → `20260717120000_phase3_academy.sql` →
   `supabase/seed_phase3.sql`.
3. **Auth**: habilitar Email (magic link) em Authentication → Providers.
4. **Storage**: criar bucket `learns` (privado); subir
   `ar_learn_171_16x9_final_v2.mp4` (master 1080p — regenerar com
   `npx tsx scripts/render-video-longo.ts video` se necessário), o Ebook e
   o mapa mental; gerar URLs assinadas/públicas conforme a decisão de
   entrega e preencher `learns.ebook_url` / `video_url` no SQL editor.
5. Copiar as chaves (Settings → API).

## 2. Stripe (dashboard.stripe.com)
1. Usar a **conta de produção** (o MCP desta sessão aponta pro sandbox
   "Ziily AIs" — bom p/ teste, não p/ venda).
2. **Habilitar Pix**: Settings → Payment methods → Pix (exige conta BR
   ativada). Sem isso, o checkout cai no fallback cartão automaticamente.
3. **Webhook**: Developers → Webhooks → Add endpoint →
   `https://<dominio>/api/stripe/webhook` com os eventos
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`. Copiar o signing secret.

## 3. Env vars (provedor de deploy — Cloudflare Pages / Vercel)
| Variável | Valor | Origem |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | service role | idem (NUNCA no client) |
| `STRIPE_SECRET_KEY` | sk_live_... | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | whsec_... | Stripe → Webhooks (passo 2.3) |
| `NEXT_PUBLIC_SITE_URL` | https://<dominio> | — |
| `NEXT_PUBLIC_EP171_VIDEO_URL` | URL do vídeo no Storage | passo 1.4 |
| `ADMIN_TOKEN` | segredo forte | gerar (ex.: `openssl rand -hex 24`) |

## 4. Smoke test pós-deploy
1. Landing carrega com player (URL do Storage).
2. `/comprar` → e-mail → página Stripe mostra QR Pix → pagar 1 centavo de
   teste (ou modo teste) → `/comprar/aguardando` → webhook aprova (ver em
   `/admin?token=...`) → magic link em `/entrar` → Learn acessível.
3. `/admin?token=<ADMIN_TOKEN>` lista o learn `publicado` e a compra.

## Pendências conhecidas (não bloqueiam deploy)
- Página hospedada do checkout Stripe ainda não foi vista de ponta a
  ponta: o MCP do sandbox não expôs operações de escrita nesta sessão e
  não há STRIPE_SECRET_KEY local. Valida no primeiro smoke test.
- Gate de sessão da área (members) (/dashboard) — evolução pós-launch;
  o conteúdo comprado já é protegido por RLS.
