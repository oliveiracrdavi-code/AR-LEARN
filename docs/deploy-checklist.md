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

## 3. Env vars (Vercel — import manual do repo)
Status 2026-07-19: **bloco copy-paste pronto** com os valores reais no
arquivo local `.env.vercel` (GITIGNORED — repo é público; segredos nunca
no código; o arquivo foi entregue ao Davi pelo chat). As 3 do Supabase
estão **CONFIRMADAS com teste de conexão real** (consulta em `learns`
devolveu o #171 publicado a R$ 127,48 no projeto AR ACADEMY
`gmwtkcjpjmcwsnjrgeen`) — prontas pra colar, sem revalidar.

| Variável | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ CONFIRMADA (teste real) — no `.env.vercel` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ CONFIRMADA — no `.env.vercel` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ CONFIRMADA (NUNCA no client) — no `.env.vercel` |
| `ADMIN_TOKEN` | ✅ implementado no gate do /admin (form + cookie) — no `.env.vercel` |
| `OPENROUTER_API_KEY` / `GROQ_API_KEY` | ✅ nos GitHub Secrets (CI verde); replicar na Vercel via `.env.vercel` (ambientes separados) |
| `NEXT_PUBLIC_SITE_URL` | usar a **URL padrão gerada pela Vercel** no 1º deploy (sem domínio próprio nesta fase); depois atualizar também o Auth do Supabase (§1.3) |
| `NEXT_PUBLIC_EP171_VIDEO_URL` | preenchido automaticamente quando a YOUTUBE_API_KEY chegar e `npm run learn:subir-ativos` rodar |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | sandbox "Ziily AIs" por enquanto — copiar do dashboard Stripe (os valores nunca passaram por esta sessão); produção = trocar depois |
| `YOUTUBE_API_KEY` (esteira/Actions) | pendente — chega amanhã; só p/ ingerir eps 172+ |

## 4. Smoke test pós-deploy
1. Landing carrega com player (URL do Storage).
2. `/comprar` → e-mail → página Stripe mostra QR Pix → pagar 1 centavo de
   teste (ou modo teste) → `/comprar/aguardando` → webhook aprova (ver em
   `/admin?token=...`) → magic link em `/entrar` → Learn acessível.
3. `/admin` → informar o ADMIN_TOKEN no formulário (o acesso por
   `?token=` na URL foi REMOVIDO — vazava o token pro histórico e pro
   payload da página; agora é form + cookie httpOnly de 8h) → lista o
   learn `publicado` e a compra; botão "Fixar no hero" funciona.

## Pendências conhecidas (não bloqueiam deploy)
- Página hospedada do checkout Stripe ainda não foi vista de ponta a
  ponta: o MCP do sandbox não expôs operações de escrita nesta sessão e
  não há STRIPE_SECRET_KEY local. Valida no primeiro smoke test.
- Gate de sessão da área (members) (/dashboard) — evolução pós-launch;
  o conteúdo comprado já é protegido por RLS.
