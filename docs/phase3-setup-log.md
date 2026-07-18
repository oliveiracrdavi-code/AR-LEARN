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

## Adendo — Ativação com credenciais reais (2026-07-18)

- **Supabase**: projeto **AR ACADEMY** (`gmwtkcjpjmcwsnjrgeen`) ativo.
  Migrations aplicadas via MCP na ordem: schema Fase 0 → RLS Fase 0 →
  phase3_academy → hardening_advisors (nova, versionada no repo). Seed
  executado e confirmado: learn `a-conta-que-ninguem-faz-ep-171`
  publicado a R$ 127,48 (`ebook_url` ainda nulo — aguarda Storage).
- **Advisors de segurança**: rodados. Corrigidos: search_path mutável e
  execução RPC pública das funções de trigger. Intencionais e
  documentados: view teaser `learns_publico` (SECURITY DEFINER, colunas
  leves) e `episodios_processados` sem policy (service-role only).
- **Chaves conferidas**: `.env.local` bate com as oficiais do projeto
  (URL e anon idênticas via MCP; service role decodificada = ref
  `gmwtkcjpjmcwsnjrgeen`, role `service_role`). Build do Next.js passou
  com as envs reais.
- **Limitação do sandbox (honestidade)**: o egress desta sessão bloqueia
  `*.supabase.co` por política de proxy, então o request HTTP do site
  rodando AQUI não alcança o banco. A prova de conexão é: credenciais
  idênticas às oficiais + banco migrado/seedado/consultado via MCP. O
  primeiro deploy (ou o smoke test do checklist) exercita o caminho
  HTTP de verdade.
- **OpenRouter/Groq**: validados por chamada real no GitHub Actions
  (workflow teste-cerebro.yml, Secrets do repo). Run 29648554670 provou
  a chave OpenRouter respondendo (3 chamadas ok) mas falhou no piso de
  7 min: fixture de ~600 chars tornava o piso honestamente inatingível
  ("nunca encher"). Fixture expandido para ~6.100 chars e workflow
  re-disparado.
- **YouTube API**: pendente — Davi entrega amanhã. Não bloqueia nada do
  SaaS atual: só é necessária para ingerir episódios 172+ na esteira.
  Ponto de retomada: preencher `YOUTUBE_API_KEY` e rodar a ingestão.
- **Stripe**: inalterado por ordem — sandbox "Ziily AIs" para telas;
  produção + Pix + webhook ficam com o Davi (checklist, seção 2).

## Adendo 2 — Robustez da esteira ganha na validação (2026-07-18, tarde)

Os re-disparos do workflow de validação expuseram 3 fragilidades reais da
esteira, todas corrigidas e versionadas:

1. **Fixture do teste do cérebro** era ~600 chars — piso de 7 min
   matematicamente inatingível sem encher (proibido). Expandido para
   ~6.100 chars de conteúdo real sintético.
2. **JSON malformado do modelo barato** (vírgula/colchete errado em
   documentos de ~20k chars, recorrente): (a) bug corrigido — o retry de
   SyntaxError pedia correção sem incluir a resposta quebrada no
   histórico; (b) conserto DETERMINÍSTICO local via `jsonrepair` antes de
   qualquer retry via LLM, com o zod `.strict()` seguindo como gate;
   (c) MAX_TENTATIVAS 3→4 (tentativas compartilhadas com o piso).
3. **kroki.io instável**: o conversor mermaid deles roda Chromium
   server-side e sob carga devolve 400 "Failed to launch the browser
   process" (EAGAIN do lado DELES). Agora esse 400 específico (e
   5xx/timeout) é retentado 3x com backoff. Obs.: `KROKI_URL` já permite
   apontar pra outra instância se a pública seguir ruim.

Status final da validação em CI (workflow teste-cerebro.yml):
- **Groq: VERDE** — chave válida, whisper-large-v3(-turbo) disponíveis.
- **OpenRouter/cérebro: VERDE** — múltiplas gerações completas validadas
  contra o contrato (roteiros de 7-8 min acima do piso).
- **Workflow completo: teve run 100% verde** (run 29648678696, 14:54).
  Re-execuções posteriores falharam APENAS no passo Kroki por
  indisponibilidade sustentada da instância pública kroki.io durante a
  tarde (5 falhas seguidas do lado deles, com retry) — nada a corrigir
  no nosso lado; o passo volta a passar quando o serviço deles estabilizar.
