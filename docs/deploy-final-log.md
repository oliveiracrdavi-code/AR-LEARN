# Deploy Final — log da rodada "Vercel + Auth + Stripe (via MCPs)"

Data: 2026-07-18/19 · Sessão: finalização do frontend com os 3 MCPs.

## Status por item

| Item | Status |
|---|---|
| Auth real (Supabase, magic link) | ✅ FEITO e validado no banco real |
| Área de membros gated por RLS | ✅ FEITO (dashboard + página do Learn) |
| Storage automático da esteira | ✅ PRONTO (bucket + lib + script + rota assinada) |
| Checkout Stripe (sandbox, troca-de-chave-só) | ✅ CONFIRMADO via MCP + correção real |
| Deploy Vercel | ⛔ BLOQUEADO — conector Vercel DESCONECTADO no ambiente |

## 1. Supabase MCP — Auth / RLS (feito)

- **Magic link real**: `/entrar` usa `supabase.auth.signInWithOtp` com
  `emailRedirectTo` → `/dashboard`. O client do browser virou singleton
  (GoTrue detecta o token do link na URL e grava a sessão).
- **/dashboard**: lista os Learns do comprador consultando `learns` com a
  SESSÃO do usuário — quem filtra é a policy `learns_select_comprador`,
  não o client. Logout incluso.
- **/learns/[slug]**: conteúdo do Learn (vídeo/Ebook/mapa) com estados
  amigáveis de "não logado" e "sem acesso" (CTA pro /comprar).
- **Ativos protegidos**: bucket **privado** `learns` (criado via MCP).
  `/api/learns/[slug]/ativos` revalida a compra com o token do usuário
  (RLS de novo) e só então assina URLs (1h) com a service role.
- **RLS provado ponta a ponta NO BANCO REAL** (transação com usuários
  temporários deletados antes do commit — nada persistiu; confirmação:
  0 usuários de teste, 0 compras, 0 perfis após o teste):
  - comprador autenticado: vê 1 learn e 1 compra (a própria) ✅
  - autenticado sem compra: vê 0 learns, 0 compras ✅
  - anon: vê 0 learns; teaser `learns_publico`: 1 ✅

## 2. Storage automático (pronto pra chave do YouTube, segunda)

- `lib/storage/ativosLearn.ts` → `subirAtivosDoLearn(slug, {video, ebook,
  mapa})`: sobe pro bucket privado e preenche `video_url` / `ebook_url` /
  `mapa_mental_imagem_url` com o CAMINHO no bucket (o site assina na hora
  de servir). URLs http(s) externas passam direto (ex.: player do
  YouTube público, se for a decisão).
- CLI da esteira: `npm run learn:subir-ativos -- <slug> --video x.mp4
  --ebook y.pdf --mapa z.png` — é o passo que o workflow do YouTube chama
  depois de renderizar/gerar.
- **Pré-requisito pro workflow (Davi)**: adicionar
  `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` nos GitHub
  Secrets do repo (a sessão não tem como criar secrets). Sem isso a
  esteira renderiza mas não consegue subir.

## 3. Stripe MCP — verificação e correção real

- Conta conectada (MCP): **"Ziily AIs sandbox"** (`acct_1TqNXERX3eIrNFAK`),
  **BRL, test mode, só `card` habilitado** (balance lido via MCP — Pix não
  ativo, como esperado num sandbox).
- **Correção importante**: o checkout fixava
  `payment_method_types: ["pix","card"]` — isso NÃO é fallback: numa conta
  sem Pix ativo a Stripe rejeita a criação da sessão inteira (o checkout
  quebraria no sandbox e na produção até ativarem o Pix). Trocado para
  **métodos dinâmicos do dashboard**: hoje oferece cartão; quando o Pix
  for ativado na conta de produção, aparece primeiro pra BRL **sem mudar
  código**. Produção = trocar `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`.
- Limitação do conector: a chave do MCP é restrita (sem operações de
  Checkout, nem leitura) — a página hospedada continua validável só no
  primeiro smoke test com chave real (checklist §4).

## 4. Vercel — BLOQUEADO (só o Davi resolve)

O conector da Vercel aparece **desconectado** neste ambiente (as tools do
MCP sumiram da sessão); não há `VERCEL_TOKEN` e o egress do sandbox
bloqueia `api.vercel.com` (HTTP 000). Sem caminho técnico daqui.

**Pra destravar (2 opções):**
1. Reconectar o conector Vercel no ambiente e me pedir pra retomar o
   deploy (retomo só este ponto); ou
2. Na vercel.com: **Add New Project → Import** do repo
   `oliveiracrdavi-code/AR-LEARN` (branch
   `claude/ar-learn-platform-setup-63c3tl`), preencher as env vars da
   tabela do `docs/deploy-checklist.md` §3 e deployar — o build passa
   com essas envs (verificado localmente em produção-mode).

**Depois que a URL existir (qualquer opção):**
- `NEXT_PUBLIC_SITE_URL` = https://<url-de-produção> (env na Vercel).
- Supabase → Authentication → **URL Configuration**: Site URL =
  https://<url-de-produção> e adicionar
  `https://<url-de-produção>/dashboard` nos Redirect URLs — sem isso o
  magic link volta pro localhost.
- Supabase → Authentication → Providers → Email: conferir habilitado.
  O SMTP embutido do Supabase é rate-limitado (poucos e-mails/hora) —
  bom pra validar; pra escala, plugar SMTP próprio depois.
- Stripe webhook: apontar `https://<url>/api/stripe/webhook` (checklist §2).

## Decisões tomadas nesta rodada (regra: alinhado ao que já existia)

1. Sessão client-side com supabase-js (localStorage) — mais simples que
   cookies SSR e suficiente pro fluxo atual; RLS protege os dados e o
   endpoint de ativos revalida com o token a cada pedido.
2. Ativos em bucket privado + URL assinada de 1h (não URL pública nem
   assinatura longa): conteúdo pago fica fora de link permanente.
3. Colunas `*_url` do learn guardam o CAMINHO no bucket (ou URL externa
   completa); quem assina é o backend na hora de servir.
4. Checkout com métodos dinâmicos do dashboard (motivo na seção 3).
5. `metodo_pagamento` fica nulo na compra pendente; o real é gravado
   pelo webhook na confirmação.
