# Phase 3 — Setup Log (Altamente Rentável Academy)

## O que foi criado
- **Migration** `supabase/migrations/20260717120000_phase3_academy.sql`:
  `learns.pdf_url -> ebook_url` (nomenclatura Ebook), provedor 'stripe' em
  compras, compra por Learn (`learn_id` + índice único aprovado),
  `stripe_checkout_session_id` (idempotência), `preco_centavos` (default
  12748), RLS por-learn, guest checkout (`usuario_id` nullable).
- **Seed** `supabase/seed_phase3.sql` (trilha/módulo/learn do ep. 171).
- **Stripe** (`lib/stripe/stripe.ts`): SDK oficial lazy (request-time).
  Rotas: `POST /api/stripe/checkout` (Checkout Session, Pix + cartão
  fallback, registra compra pendente) e `POST /api/stripe/webhook`
  (verifica assinatura; `async_payment_succeeded` = Pix confirmado ->
  cria/resolve usuário por e-mail, upsert perfil, compra 'aprovado' ->
  RLS libera o Learn; `async_payment_failed` -> recusado).
- **Frontend** (paleta travada #000000/#141414/#878787/#fbfbfb/#ffcb00,
  Poppins self-hosted): landing hero manchete + chips + player do vídeo
  v2 + seção Ebook/mapa + preço/CTA; /comprar (e-mail -> Stripe);
  /comprar/aguardando; /entrar (magic link); /admin (learns + compras,
  gate ?token=ADMIN_TOKEN).
- **Build**: `next build` passa sem credenciais (rotas dinâmicas lazy).
- **Screenshots**: scripts/output/frontend/ (landing, checkout,
  aguardando, admin) + zip.

## Decisões tomadas (para revisão, não mudei o que estava fechado)
1. **Mapeamento de schema**: tabelas estabelecidas mantidas (regra "não
   renomear"): perfis=users, learns=episodes/learn_content,
   compras=purchases. Campos novos apenas.
2. **Preço**: R$ 127,48 — herdado do default `compras.valor` já commitado
   no schema da Fase 0 (nenhum outro preço documentado).
3. **Checkout hospedado da Stripe** (session.url) em vez de QR embutido:
   menos superfície, QR do Pix renderizado pela Stripe; volta em
   /comprar/aguardando; confirmação via webhook. Fluxo idêntico ao
   especificado, com a tela do QR hospedada.
4. **Guest checkout por e-mail**: compra sem login; o webhook cria o
   usuário (auth.admin) e o acesso chega por magic link (/entrar).
5. **Cartão como fallback temporário** junto do Pix (previsto no prompt)
   até o Pix ser habilitado no dashboard.
6. **Vídeo do player**: `NEXT_PUBLIC_EP171_VIDEO_URL` (Supabase Storage
   depois); fallback local /videos/... (não versionado).
7. **MCP da Stripe**: o conector estava DESCONECTADO durante toda a
   implementação (ToolSearch sem resultados). Implementado com o SDK
   oficial `stripe` + env vars — mesmo fluxo; quando o MCP voltar, dá pra
   usá-lo p/ conferir a conta/Pix. Nada foi mockado.
8. **Pipeline de vídeo intocado** (regra): lib/pdf interno continua com o
   nome técnico; só rótulos visíveis e schema usam "Ebook".

## TODOs que dependem do Davi (bloqueios reais)
- [ ] Criar projeto Supabase + preencher SUPABASE_URL / ANON_KEY /
      SERVICE_ROLE_KEY; rodar migrations + seed.
- [ ] Criar conta/chaves Stripe (STRIPE_SECRET_KEY) + endpoint de webhook
      no dashboard (STRIPE_WEBHOOK_SECRET) apontando para
      /api/stripe/webhook.
- [ ] **Habilitar Pix** no dashboard Stripe (Settings -> Payment methods;
      exige conta BR ativada). Até lá o checkout aceita cartão.
- [ ] Subir o vídeo v2 (e o Ebook/mapa) no Supabase Storage e preencher
      NEXT_PUBLIC_EP171_VIDEO_URL (+ ebook_url/mapa no learn).
- [ ] Definir ADMIN_TOKEN e NEXT_PUBLIC_SITE_URL no provedor.

## Pendências técnicas (não bloqueiam o deploy)
- Gate de sessão da área (members) — /dashboard segue stub da Fase 0;
  o acesso ao conteúdo comprado já é garantido por RLS.
- E-mail transacional pós-compra (hoje: magic link manual em /entrar).

## Adendo — verificação via MCP da Stripe (reconectado após a entrega)
- O conector voltou e foi usado: conta conectada = **"Ziily AIs sandbox"**
  (`acct_1TqNXERX3eIrNFAK`) — é um **sandbox**, e não aparenta ser a conta
  de produção da Carozzo/AR. Serve para testar o fluxo de checkout, mas
  **não** para vender de verdade.
- O catálogo de operações do MCP (`stripe_api_search`) retornou vazio para
  account/checkout/payments nesta sessão — não foi possível confirmar por
  API se o Pix está habilitado. Pix exige conta Brasil ativada; num
  sandbox padrão ele normalmente NÃO está disponível.
- Conclusão prática (inalterada): para produção, Davi precisa (1) conectar
  /criar a conta Stripe real da operação, (2) habilitar Pix no dashboard
  (Settings -> Payment methods), (3) preencher STRIPE_SECRET_KEY e
  STRIPE_WEBHOOK_SECRET no provedor. O código já está pronto para ambos
  os cenários (Pix + cartão fallback).
