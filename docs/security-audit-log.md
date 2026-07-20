# Security audit — item por item

Data: 2026-07-20. Escopo do prompt: "segurança real, não E2E encryption"
— concordância registrada: E2E não se aplica (o servidor PRECISA ler os
dados pra operar o SaaS); o que protege usuário aqui é TLS + RLS +
headers + controle de acesso, tudo abaixo.

| # | Item | Status | Evidência / racional |
|---|---|---|---|
| 1 | Headers HTTP de segurança | ✅ FEITO | `next.config.ts` → HSTS (2 anos, includeSubDomains), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (câmera/mic/geo off) e **CSP** enxuta (connect só self+Supabase; img self+i.ytimg; form-action self+checkout.stripe.com; frame-ancestors 'none'). Verificado com `curl -I` no build de produção — todos presentes; landing renderiza normal sob a CSP (screenshot). `unsafe-inline` em script/style é exigência do runtime do Next/estilos inline do design system — trade-off documentado. |
| 2 | Rate limiting em rotas sensíveis | ✅ FEITO (com limitação documentada) | `lib/seguranca/rateLimit.ts` (janela deslizante por IP, em memória). Aplicado: **login do admin** (5 tentativas/15min → tela "aguarde") e **checkout** (10/10min → 429). **Magic link**: a chamada vai do browser DIRETO pro Supabase Auth — nosso servidor não está no caminho; a proteção é o rate limit embutido do Supabase Auth p/ OTP (limites por hora configuráveis no dashboard). Limitação conhecida: em serverless o Map é por instância (teto local, não global) — 1ª linha de defesa; evolução futura: contador compartilhado se houver abuso real. |
| 3 | Cookies de sessão | ✅ CONFERIDO | Admin: `httpOnly`, `sameSite: lax`, `secure` em produção, maxAge 8h, comparação só server-side (testado: 7 cenários verdes, incluindo "token nunca aparece no HTML"). Usuário comum: o supabase-js guarda a sessão em **localStorage**, não cookie — não há cookie pra flaggar; mitigação de XSS = CSP acima + zero injeção de HTML não-sanitizado no app. |
| 4 | Webhook Stripe valida assinatura | ✅ CONFERIDO | `app/api/stripe/webhook/route.ts`: `constructEvent(corpo, assinatura, STRIPE_WEBHOOK_SECRET)` roda ANTES de qualquer processamento; sem secret → 500, sem/inválida assinatura → 400. Impossível forjar "pagamento confirmado" sem o signing secret. |
| 5 | RLS re-confirmado (com as tabelas novas) | ✅ RE-TESTADO no banco real | Transação com usuários temporários (deletados antes do commit; conferido 0 restantes): comprador vê 1 learn e grava o PRÓPRIO progresso; gravar progresso PARA TERCEIRO → **bloqueado pelo RLS**; usuário B vê 0 progresso/0 compras de A; anon vê 0 learns e 0 `admin_access_log`; teaser público expõe thumbnail sem expor URLs de conteúdo. |
| 6 | SERVICE_ROLE_KEY só server-side | ✅ AUDITADO | Grep em todo o código: 10 arquivos usam a chave — todos server (API routes, server actions/components, libs `server-only`, scripts Node). NENHUM arquivo `"use client"`. A chave vem só de `process.env` (nunca `NEXT_PUBLIC_`), então nem entraria em bundle de browser. |
| 7 | npm audit | ⚠️ 2 moderadas DOCUMENTADAS (não corrigíveis sem quebrar) | Ambas no `postcss` embutido do Next (GHSA-qx2v-qp2m-jg93, XSS no stringify de CSS). O "fix" do npm faria downgrade pro Next 9 (absurdo). Exploração exige processar CSS malicioso NO BUILD — nosso CSS é 100% autoral, sem input de usuário no pipeline de build. Risco real: baixo. Some quando o Next atualizar o postcss interno. |
| 8 | LGPD | ✅ FEITO | Página `/privacidade` (o que coleta, pra quê, onde fica, direitos, contato) linkada no footer da landing. Admin mascara e-mails por padrão (`jo***@dominio`) com toggle de revelar — prints não vazam dado pessoal. Sem rastreadores de publicidade; pagamento na Stripe (sem dados de cartão nos nossos servidores). Ajustar o e-mail de contato na página se o canal oficial for outro. |
| 9 | Backups do Supabase | ⏳ AÇÃO DO DAVI (config de conta, não código) | Não há tool de billing na sessão pra confirmar o plano. Regra da Supabase: plano **Free NÃO tem backup automático**; Pro tem diário (7 dias). Conferir em supabase.com → projeto AR ACADEMY → Settings/Backups; se estiver no Free, subir pra Pro antes de ter vendas reais OU exportar dump periódico. Enquanto o volume é 1 learn + schema, o repositório de migrations reconstrói o banco do zero (só o conteúdo de Storage precisaria re-upload). |

## Itens do checklist final (prontos pra amanhã)

- [x] Dashboard de vendas com dados reais (validado por SQL — estado atual: R$ 0, 0 checkouts, 1 learn)
- [x] CRUD de Learns funcional (título/descrição/preço/status/thumbnail)
- [x] Fixar/remover do hero
- [x] Gestão de usuários/acessos + concessão manual (`provedor manual`, R$ 0)
- [x] Log de acesso ao admin (`admin_access_log`)
- [x] Headers de segurança (verificados por curl)
- [x] Rate limiting (admin login + checkout; magic link = rate limit do Supabase)
- [x] Cookies com flags corretas (admin) / sessão de usuário documentada (localStorage + CSP)
- [x] Webhook Stripe validando assinatura antes de processar
- [x] npm audit rodado (2 moderadas documentadas, não exploráveis no nosso uso)
- [x] SERVICE_ROLE_KEY auditada como server-only
- [x] Política de privacidade no footer
- [x] `.env.vercel` conferido — NENHUMA env var nova exigida pelas features desta rodada
- [x] Build de produção passando com tudo (headers + admin + privacidade)
- [ ] Backups: conferência do plano no dashboard (Davi)
