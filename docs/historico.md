# Histórico de Decisões — AR LEARN

Este arquivo só é aberto quando o usuário pedir contexto histórico.
Não é carregado por padrão em cada sessão.

## 2026-07-02 — Fase 0 (Fundação)
- Usuário forneceu os 8 PDFs de contexto (System Prompt NotebookLM,
  Planejamento V2, Sistema Autônomo v2, Manual de Implementação V2,
  Manual das Ferramentas V2, Guia de Voz e Vídeo V2, Consumo e Gastos v2,
  Perfil Leandro Carozzo e Empresa). Relatório de assimilação confirmado
  pelo usuário.
- Aprovado o plano da Fase 0: estrutura de pastas, `.env.example`,
  schema/RLS do Supabase.
- Adotado o Sistema de Economia de Tokens (`.claudeignore`, `CLAUDE.md`
  enxuto, `docs/` sob demanda, disciplina de sessão) como prática
  permanente a partir desta fase.
- Decisão: `KROKI_URL` usa a instância pública `https://kroki.io` (sem
  conta/chave).
- Decisão: gateway de pagamento provisório é Mercado Pago (principal),
  Asaas documentado como alternativa — implementação só na Fase 4.

## 2026-07-02 — Fase 1 (Esteira mínima, 1 episódio)
- Fase 0 aprovada pelo usuário; a view `learns_publico` foi confirmada
  como decisão correta, não desvio.
- Implementada a ingestão YouTube com `fetch` puro (sem SDK
  `googleapis`), pra manter o código portável entre Node/GitHub Actions
  e runtimes serverless (a esteira ainda não escolheu a camada de
  runtime definitiva — isso é Fase 5).
- Desvio detectado e corrigido (Regra de Ouro aplicada): os módulos de
  pipeline foram inicialmente escritos com `import "server-only"`
  (copiado por reflexo do padrão usado na Fase 0). Isso quebrava a
  execução do script de teste fora do Next.js. Diagnóstico: o guard
  `server-only` só faz sentido para código dentro da árvore do app
  Next.js; os módulos de ingestão/cérebro/idempotência rodam em
  scripts e (mais tarde) GitHub Actions, fora dessa árvore. Correção:
  guard removido desses módulos; a fábrica do client de service role
  foi movida para `lib/supabase/serviceRoleClient.ts` (sem guard), e
  `lib/supabase/server.ts` (usado pelo Next.js) passou a reexportar
  dali mantendo o guard só onde faz sentido.
- Gap identificado e não resolvido sozinho (Regra de Ouro): os manuais
  dizem "para o fallback do Groq, use o arquivo de áudio de origem
  (canal é seu)", mas a YouTube Data API não expõe download de mídia
  bruta — só legendas. Interpretação adotada: o áudio-fonte é o
  arquivo que a produção já tem da gravação, fornecido manualmente
  (não baixado automaticamente do YouTube). A função de transcrição
  foi implementada para receber esse áudio como parâmetro. Este
  entendimento foi levado ao usuário para confirmação antes de valer
  para um episódio real sem legenda.
- Contrato JSON do Learn implementado literalmente a partir da seção 9
  do Sistema_Autonomo_v2, com validação `zod` `.strict()` em todos os
  níveis (não aceita campos extras nem faltando).
- Fase 1 pausada em 2026-07-03 aguardando: (1) acesso de gerente à
  conta do canal Altamente Rentável para OAuth, (2) crédito no
  OpenRouter. Retomar assim que Davi trouxer as 6 credenciais
  completas (YouTube ×4 + Groq + OpenRouter).
