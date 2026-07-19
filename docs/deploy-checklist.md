# Deploy Checklist — Altamente Rentável Academy

Ativação final quando as credenciais chegarem: preencher env vars,
rodar SQL, subir arquivos. Zero retrabalho de código.

## 1. Supabase (dashboard supabase.com)
1. ✅ FEITO (2026-07-18): projeto **AR ACADEMY** (`gmwtkcjpjmcwsnjrgeen`)
   ativo e saudável.
2. ✅ FEITO (2026-07-18): SQL aplicado via MCP na ordem —
   `supabase/migrations/20260702120000_schema.sql`
   → `20260702120100_rls.sql` → `20260717120000_phase3_academy.sql` →
   `20260718090000_hardening_advisors.sql` → `supabase/seed_phase3.sql`.
   Seed confirmado: learn `a-conta-que-ninguem-faz-ep-171` publicado,
   R$ 127,48. Advisors de segurança rodados e endereçados (ver migration
   de hardening).
3. **Auth**: conferir Email (magic link) habilitado em Authentication →
   Providers. Após o deploy: Authentication → URL Configuration → Site
   URL = https://<dominio> e adicionar `https://<dominio>/dashboard` nos
   Redirect URLs (senão o magic link volta pro localhost). SMTP embutido
   é rate-limitado — pra escala, SMTP próprio depois.
4. ✅ FEITO (2026-07-18): bucket privado `learns` criado via MCP. Upload
   dos ativos virou automação: `npm run learn:subir-ativos -- <slug>
   --video x.mp4 --ebook y.pdf --mapa z.png` sobe e preenche as colunas
   (o site serve por URL assinada). A esteira do YouTube chama isso
   sozinha; pro workflow funcionar, adicionar `NEXT_PUBLIC_SUPABASE_URL`
   e `SUPABASE_SERVICE_ROLE_KEY` nos GitHub Secrets do repo.
5. ✅ Chaves copiadas e validadas (2026-07-18).

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
Status 2026-07-18: Supabase (URL/anon/service role) + `ADMIN_TOKEN` já
entregues e validados localmente (`.env.local`, fora do git — build ok).
Falta preencher no PROVEDOR na hora do deploy (copiar de `.env.local`).

| Variável | Valor | Origem / Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | ✅ entregue (AR ACADEMY) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | ✅ entregue |
| `SUPABASE_SERVICE_ROLE_KEY` | service role | ✅ entregue (NUNCA no client) |
| `STRIPE_SECRET_KEY` | sk_live_... | pendente (sandbox por enquanto) |
| `STRIPE_WEBHOOK_SECRET` | whsec_... | pendente (passo 2.3) |
| `NEXT_PUBLIC_SITE_URL` | https://<dominio> | pendente (domínio público) |
| `NEXT_PUBLIC_EP171_VIDEO_URL` | URL do vídeo | pendente (YouTube/Storage) |
| `ADMIN_TOKEN` | segredo forte | ✅ entregue |
| `YOUTUBE_API_KEY` (esteira) | API key | pendente — Davi entrega amanhã; só necessária p/ ingerir eps 172+ |
| `OPENROUTER_API_KEY` / `GROQ_API_KEY` (esteira/CI) | chaves | ✅ nos GitHub Secrets (validadas via workflow teste-cerebro) |

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
