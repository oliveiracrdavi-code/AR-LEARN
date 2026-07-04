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
- 2026-07-03 (mesmo dia, mais tarde): Davi trouxe as chaves novas de
  Groq e OpenRouter (as anteriores tinham vazado em outro canal e já
  foram revogadas por ele — não reutilizadas, não procuradas em log
  nenhum). Chaves escritas só em `.env.local` (confirmado no
  `.gitignore`, nunca commitado).
- Criados `scripts/testar-schema-offline.ts` e
  `scripts/testar-cerebro-isolado.ts` (+ scripts npm `schema:teste` e
  `cerebro:teste`).
- **Validação offline do contrato JSON (sem rede): sucesso.** O schema
  zod aceita o fixture completo, rejeita fixture faltando
  `mapa_mental_mermaid` e rejeita fixture com campo extra
  (`.strict()` funcionando nos 3 casos).
- **Teste isolado do cérebro (OpenRouter) com transcrição de exemplo:
  bloqueado — não é erro de código nem de credencial.** O ambiente
  sandbox tem uma política de rede que só permite acesso a uma lista
  de hosts liberados (ex.: registry.npmjs.org, github, domínios
  anthropic.com); `openrouter.ai` e `api.groq.com` não estão nela.
  Erro exato reproduzido: `403 Host not in allowlist: openrouter.ai.
  Add this host to your network egress settings to allow access.` — o
  mesmo host apareceu bloqueado para `api.groq.com` no proxy do
  ambiente. Isso significa que o fallback Groq também não pôde ser
  testado de ponta a ponta aqui.
- Modelo do cérebro: mantido o default `google/gemini-2.0-flash-001`
  (Gemini Flash, não é `openai/gpt-4o`) conforme pedido — mas não deu
  pra confirmar o slug/preço contra o catálogo ao vivo do OpenRouter
  porque a mesma política de rede bloqueia `openrouter.ai/api/v1/models`.
  Confirmar o slug exato assim que a rede for liberada ou rodando este
  mesmo teste fora deste sandbox.
- Encaminhado ao usuário: ou ajustar a política de rede deste ambiente
  (liberar `openrouter.ai` e `api.groq.com` nas configurações de rede
  do ambiente do Claude Code on the web) ou rodar este teste a partir
  de outro ambiente com rede irrestrita.

## 2026-07-03 — Adendo Vitrine e Login (9º PDF, ADICIONA ao Planejamento V2)
- Recebido `AR_LEARN_Adendo_Vitrine_e_Login.pdf`. Não substitui nada —
  adiciona duas peças ao escopo da Fase 4 (Produto), inspiradas no
  Astron Members mas 100% dentro do stack já aprovado (zero ferramenta
  nova, zero custo novo):
  1. Vitrine estilo Netflix na área de membros: fileiras horizontais
     por Trilha (nome de resultado, não nome técnico), cards de
     Módulos/Learns dentro de cada fileira. Construída com React +
     Tailwind, buscando Trilhas/Learns do Supabase — mesma origem de
     dados já planejada.
  2. Login/cadastro com perfil individual por aluno via Supabase Auth
     (já incluso, sem custo novo): páginas `/login`, `/cadastro`,
     `/esqueci-senha`. Confirma explicitamente o que já estava implícito
     no schema da Fase 0 (`perfis` + RLS por `auth.uid()`).
- Regra de Ouro do adendo registrada em `docs/regras.md`: nome de
  trilha é só embalagem — a trilha nasce DEPOIS de a IA varrer o
  conteúdo real dos episódios, nunca antes; proibido forçar episódio
  pra caber numa trilha. Os nomes de exemplo do PDF ("Como fazer seu
  primeiro milhão" etc.) são rascunho, não lista final.
- Nota para consideração futura (Fase 6/7, não uma ação agora): o
  cérebro da Fase 1 gera os campos `trilha`/`modulo` por episódio
  isolado (contrato do Sistema_Autonomo_v2). Isso é compatível com
  "rascunho" — nada é publicado em `trilhas`/`modulos` na Fase 1 —, mas
  a taxonomia final de trilhas só deve ser fechada depois de rodar o
  backlog inteiro e reconciliar os nomes sugeridos por episódio contra
  o volume real por tema. Não muda nada no código agora.
- Escopo confirmado: isso é Fase 4. Não adiantado nada de UI/login
  agora — seguimos na Fase 1.

## 2026-07-03 — Ambiente com acesso de rede Full para APIs externas
- Davi criou um ambiente novo com "network access = Full" (a UI só
  oferece Trusted/None/Full, não dá pra restringir a domínios
  específicos), incluindo `openrouter.ai` e `api.groq.com`.
- Reteste do cérebro isolado **nesta sessão**: mesmo erro de antes
  (`403 Host not in allowlist: openrouter.ai`). A política de rede de
  um ambiente parece ser fixada na criação da sessão/container — esta
  sessão já estava rodando antes do ambiente novo existir, então
  provavelmente continua presa à política antiga. Para valer, este
  teste precisa rodar numa sessão nova, aberta já dentro do ambiente
  "AR-LEARN com API externa" (Full).
- **Decisão registrada**: a partir de agora, o projeto usa dois
  ambientes conforme a tarefa —
  - **Default**: sessões que só mexem em código (sem chamar
    OpenRouter/Groq/YouTube ao vivo) continuam aqui normalmente.
  - **AR-LEARN com API externa (Full)**: obrigatório para qualquer
    sessão que precise chamar OpenRouter, Groq ou a YouTube Data API
    de verdade (testes ponta a ponta da esteira, Fases 1 e além).

- **Sessão nova aberta já dentro do ambiente "AR-LEARN com API
  externa" (Full) — reteste deu o MESMO erro** (`403 Host not in
  allowlist: openrouter.ai`), byte a byte igual ao anterior. A porta do
  proxy local mudou (confirma que é sessão/container novo), mas o
  bloqueio persiste. Duas tentativas consecutivas sem nenhuma mudança
  → parado por aqui (Regra de Ouro: não insistir sozinho).
- **Diagnóstico revisado**: a rejeição não aparece mais como falha de
  CONNECT (`recentRelayFailures` vazio) — a conexão TLS é estabelecida
  e o próprio proxy sintetiza a resposta 403 com a mensagem de
  allowlist depois de inspecionar o Host. Isso sugere que existe uma
  camada de allowlist de hosts separada do toggle "Trusted/None/Full"
  do ambiente — possivelmente uma restrição de plataforma que esse
  toggle não controla. O próprio `/root/.ccr/README.md` deste proxy
  instrui a não tentar contornar e a reportar o host bloqueado ao
  suporte/administrador se persistir.
- **Aguardando decisão do usuário** sobre como prosseguir: procurar uma
  configuração de egress mais granular, abrir chamado com o suporte do
  Claude Code on the web, ou rodar este teste específico fora deste
  sandbox (ex.: no PC, fase de migração tablet→PC).

## 2026-07-03 — Mudança de estratégia: validar via GitHub Actions
- Davi aceitou o diagnóstico (limitação de plataforma da sandbox, fora
  do controle dele) e decidiu não insistir na rede da sessão de
  desenvolvimento.
- **Nova estratégia, não é desvio do plano**: as chamadas reais a
  OpenRouter/Groq em produção já rodariam via GitHub Actions/Edge
  Functions, nunca dentro da sandbox de desenvolvimento — então validar
  por ali é validar o ambiente de execução real, não um atalho.
- Criado `.github/workflows/teste-cerebro.yml` — workflow **temporário**
  (apagar depois de confirmado), disparado manualmente
  (`workflow_dispatch`), que roda `schema:teste` (offline) e depois
  `scripts/testar-cerebro-isolado.ts` com `OPENROUTER_API_KEY` e
  `GROQ_API_KEY` vindos de GitHub Secrets — não de `.env`.
- Nota técnica: o workflow chama `npx tsx scripts/testar-cerebro-isolado.ts`
  diretamente, em vez do script npm `cerebro:teste` (que usa
  `--env-file=.env.local`, arquivo que não existe nem deve existir em
  CI — os secrets já chegam como variável de ambiente pelo `env:` do
  job).
- Aguardando: Davi cadastrar os 2 secrets no GitHub e disparar o
  workflow manualmente; eu reviso os logs quando ele avisar.

- **Descoberta**: o commit do workflow (`67caf06`) estava certo e no ar
  na branch de trabalho, mas o GitHub Actions não o listava — API
  confirmou `total_count: 0` workflows indexados. Causa raiz: o
  `workflow_dispatch` só aparece na aba Actions/`Run workflow` quando o
  arquivo do workflow existe no branch **padrão** (`main`); `main`
  ainda estava só no commit inicial, sem nada do trabalho da Fase 0/1.
- Solução aplicada: criado um branch isolado
  (`temp-teste-cerebro-workflow`, baseado em `origin/main`) contendo
  **só** `.github/workflows/teste-cerebro.yml` — não o restante do
  trabalho de Fase 0/1, que continua sem merge, aguardando aprovação
  por fase. Aberto o PR:
  https://github.com/oliveiracrdavi-code/AR-LEARN/pull/1
- Aguardando: Davi mergear esse PR, cadastrar os 2 secrets e disparar o
  workflow manualmente.
- PR #1 mergeado. Primeiro disparo falhou: `npm ci` deu `EUSAGE`
  porque `main` só tinha o arquivo do workflow (sem `package.json`/
  lockfile/código — só a branch de trabalho tem o projeto completo).
  Escolhida a opção mais robusta entre as duas sugeridas: checkout
  explícito de `ref: claude/ar-learn-platform-setup-63c3tl` no step de
  checkout (em vez de trocar `npm ci` por `npm install`, que não
  resolveria a causa raiz — main segue sem o projeto). Corrigido e
  aberto PR #2: https://github.com/oliveiracrdavi-code/AR-LEARN/pull/2
- Aguardando: Davi mergear o PR #2 e disparar o workflow de novo.
- **Progresso real confirmado**: checkout, `npm ci` e `schema:teste`
  passaram no Actions, e a chamada chegou de fato ao OpenRouter
  (prova que chave e rede funcionam dali). Novo erro: `404 No
  endpoints found for google/gemini-2.0-flash-001` — esse slug foi
  descontinuado/nunca existiu no catálogo atual.
- Consultado o catálogo real via WebSearch (WebFetch direto em
  openrouter.ai retornou 403 — o site bloqueia esse tipo de acesso;
  também confirmado que esta sandbox continua sem rede pra
  `openrouter.ai`, então não deu pra validar localmente, só via
  busca). Não foi usado nenhum slug de memória.
- Slug atualizado para `google/gemini-2.5-flash` (~US$0,30/M tokens de
  entrada, ~US$2,50/M de saída — confirmado por múltiplas fontes),
  slug estável e não-preview, batendo com o que o Manual das
  Ferramentas cita como exemplo ("Gemini Flash"). Descartado o alias
  `~google/gemini-flash-latest` por não dar pra confirmar com certeza
  se o `~` é só da URL do site ou também faz parte do id usado na
  API — preferi o slug simples e verificável a arriscar de novo.
  `deepseek/deepseek-chat` seguiu documentado como alternativa
  (`OPENROUTER_MODEL`), também confirmado como slug real e vigente.
- Corrigido em `lib/openrouter/gerarLearn.ts` e `.env.example`, commitado
  direto na branch de trabalho. **Correção no próprio registro**: eu
  tinha escrito aqui "Aberto PR #3" — isso não aconteceu e foi um erro
  meu neste arquivo. Não foi preciso PR nenhum: o workflow já mergeado
  (`checkout ref: claude/ar-learn-platform-setup-63c3tl`) busca o
  código direto dessa branch, então o push já valeu na próxima
  execução, sem precisar passar pelo `main` de novo.
- Disparo seguinte: **sucesso** (25s). JSON do Learn gerado e validado
  contra o contrato, a partir de uma transcrição sintética de teste:
  título "Short Stay em Feira de Santana: Oportunidade de Alta
  Rentabilidade", trilha "Investimento Imobiliário", módulo "Short Stay
  e Novas Modalidades de Locação", 3 seções de PDF, 4 cenas de roteiro,
  ~1 min de duração estimada. Observação registrada: a duração ficou
  bem abaixo do piso de 5 min pedido no prompt na época — provavelmente
  por a transcrição de teste ser um parágrafo sintético curto, não um
  episódio real; sinalizado ao usuário para acompanhar com conteúdo
  real.

## 2026-07-04 — Piso de duração: 5 min → 7 min (420s)
- Atualizado em `CLAUDE.md`, `docs/stack.md` e no system prompt do
  cérebro (`lib/openrouter/systemPrompt.ts`).
- **Correção de fato, registrada com transparência**: o usuário se
  referiu a "a validação por código que pedi para você adicionar" como
  algo já solicitado antes — não encontrei esse pedido em nenhum ponto
  anterior desta conversa, e de fato eu não tinha implementado nenhuma
  validação de duração em código até agora (só existia como instrução
  de texto no prompt do LLM, sem checagem no `gerarLearn.ts`). Também
  não existe nenhum arquivo `docs/*Guia_de_Voz*` neste repositório — o
  Guia de Voz e Vídeo V2 é um dos PDFs fonte, nunca versionado aqui
  (por decisão da própria Fase 0: PDFs não entram no repo). Reportei
  isso ao usuário em vez de simplesmente confirmar algo que não
  aconteceu.
- Implementada agora, pela primeira vez, a validação por código em
  `gerarLearn.ts`: depois do schema validar, soma `duracao_seg` de
  todas as cenas; se `< 420`, trata como resultado inválido e pede ao
  LLM pra expandir o roteiro (sem inventar fatos fora da transcrição),
  reaproveitando o mesmo laço de retry do JSON malformado, até
  `MAX_TENTATIVAS`.

## 2026-07-04 — Sinalização: pedido de trocar ingestão para yt-dlp + API key simples
- O usuário pediu, na mesma mensagem das duas atualizações acima, para
  seguir a Fase 1 com "ingestão real do YouTube (API key simples +
  yt-dlp para transcrição pública, como decidimos)".
- **Aplicando a Regra de Ouro: parei antes de implementar, em vez de
  seguir.** Dois problemas concretos:
  1. Não existe registro de "termos decidido" isso em nenhum ponto
     desta conversa — a decisão documentada (Fase 0/1, confirmada por
     3 PDFs diferentes) sempre foi YouTube Data API v3 **via OAuth do
     dono do canal**, porque `captions.download` não funciona só com
     API key (confirmado no Manual das Ferramentas e no
     Sistema_Autonomo_v2, não é só uma preferência nossa — é uma
     limitação da própria API do YouTube).
  2. `yt-dlp` nunca apareceu em nenhum dos PDFs fonte. É uma ferramenta
     nova, fora do stack aprovado, que baixa mídia do YouTube por fora
     da API oficial — isso esbarra em "não trocar ferramenta por conta
     própria" e pode levantar questão de Termos de Uso do YouTube.
- Não implementado. Pedido esclarecimento ao usuário antes de
  prosseguir com a ingestão real (ver resposta no chat).
- Usuário aceitou: ingestão real do YouTube fica pendente, sem data
  marcada, até ele trazer as credenciais OAuth reais. Não é bloqueio —
  seguimos avançando o resto da Fase 1 sem depender delas.

## 2026-07-04 — Vitrine da spec, retry de duração e testes de ingestão com mock
- **Vitrine Netflix**: detalhes registrados em `docs/regras.md` (ver
  seção correspondente) — nada implementado, é Fase 4.
- **Confirmação do retry de duração (420s)**: adicionado log por
  tentativa em `gerarLearn.ts` (`[tentativa N] duração do roteiro: Xs`)
  e disparado o workflow 2x pra confirmar. Números reais, por
  tentativa, na rodada com log: **tentativa 1 = 75s → tentativa 2 =
  330s → tentativa 3 = 395s**. Confirma que o retry funciona de
  verdade (sobe a cada tentativa, não é só documentação sem efeito),
  mas ainda ficou abaixo do piso de 420s depois de 3 tentativas — o
  código corretamente rejeitou o resultado e lançou erro, em vez de
  aceitar um vídeo curto demais (falhar com clareza, não é bug). Isso é
  esperado: a transcrição de teste é sintética e curtíssima (um
  parágrafo) — sem inventar fatos, não dá pra esticar pra 7 min de
  conteúdo real. Deve se resolver naturalmente com transcrições de
  episódios reais, bem mais longas.
- **Testes de ingestão do YouTube com mock** (sem rede real, sem
  credenciais): criado `scripts/testar-youtube-mock.ts`
  (`npm run youtube:teste`). Simula respostas da API (channels,
  playlistItems paginado, captions list/download, token OAuth) via
  monkey-patch de `global.fetch`. 9/9 testes passando localmente:
  paginação da uploads playlist (2 páginas, 3 vídeos), preservação de
  ordem/dados, priorização de legenda pt-BR sobre outra língua,
  `srtParaTextoCorrido` removendo timestamps/números, `baixarLegenda`
  retornando `null` quando não há legenda (gatilho do fallback Groq),
  tratamento do erro 403 (cota), e cache do access token (só 1 chamada
  ao endpoint de token mesmo com múltiplas chamadas à API).
- Ingestão real do YouTube (credenciais OAuth verdadeiras) segue
  pendente, sem previsão — o código já está pronto pra recebê-las
  quando Davi trouxer.

## 2026-07-04 — Fase 2 (Geração dos 3 ativos), conteúdo real de teste
- Davi pediu pra adiantar a Fase 2 com o mesmo contrato JSON já
  validado na Fase 1 (a Fase 2 só depende do JSON, não da origem dele)
  e, num ajuste seguinte, trocou o fixture sintético por uma
  transcrição mais substancial sobre "como funciona o mercado
  imobiliário" — genérica, escrita por mim, sem nenhum dado específico
  da Carozzo/Altamente Rentável inventado (só pra dar volume real de
  conteúdo pro cérebro trabalhar).
- Transcrição salva em
  `scripts/fixtures/transcricao-mercado-imobiliario.txt`.
- **Gerado o JSON real via cérebro** (rodou via GitHub Actions, rede
  bloqueada nesta sandbox): título "Desvendando o Mercado Imobiliário:
  Transforme Imóveis em Ativos de Alta Rentabilidade", trilha
  "Fundamentos do Mercado Imobiliário", módulo "Introdução ao
  Investimento Imobiliário", 7 seções de PDF, 11 cenas de roteiro,
  **530s (~8,8 min) de duração total** — bem acima do piso de 420s,
  sem precisar de retry. Confirma a hipótese registrada antes: com
  conteúdo real e mais rico, o piso de duração se resolve sozinho.
- JSON extraído do log da Action (não há ferramenta de download de
  artifact disponível nesta sessão; o script imprime o JSON e o SVG
  delimitados no stdout pra isso) e salvo em
  `scripts/output/fixture-mercado-imobiliario.json` (gitignored).
- **Descoberta**: dá pra disparar o `workflow_dispatch` direto com
  `ref: claude/ar-learn-platform-setup-63c3tl` (a branch de trabalho),
  sem precisar que o conteúdo atualizado do workflow esteja no `main`
  — só a *existência* do arquivo no `main` era necessária pra
  registrar o workflow a primeira vez. Evita o round-trip de PR que
  fizemos antes pra cada ajuste no `.yml`.

### Mapa mental
- `lib/mapa-mental/kroki.ts`: imagem estática via Kroki (mermaid
  nativo) — funciona (kroki.io também bloqueado nesta sandbox, testado
  via Actions).
- **Inconsistência encontrada e resolvida**: o contrato usa sintaxe
  Mermaid mindmap (campo `mapa_mental_mermaid`, com exemplo literal do
  próprio Sistema_Autonomo_v2), mas o plano diz "Markmap (interativo)"
  pro site — só que Markmap não entende sintaxe Mermaid, ele espera
  markdown em lista aninhada. Resolvido com um conversor
  (`lib/mapa-mental/converter.ts`) que transforma o texto Mermaid em
  markdown compatível, preservando a mesma árvore.
- Validado com o conteúdo real: **35 nós** na árvore. Validação dupla:
  estrutural (`markmap-lib` Transformer, offline) e **visual de
  verdade** — renderizado num Chromium headless local (bundles
  `d3` + `markmap-view` de dentro do `node_modules`, sem precisar de
  rede) e confirmado: 35 nós desenhados no SVG, zero erros de
  console/página. Screenshot em
  `scripts/output/fixture-mercado-imobiliario-mapa-visual.png`.

### PDF
- `lib/pdf/gerarPdf.ts`: HTML → PDF via Playwright/Chromium — sem
  serviço pago, servidor-side. Gerado com sucesso a partir do
  conteúdo real: 2 páginas, PDF válido (`%PDF-1.4`), com o mapa mental
  (SVG do Kroki) embutido.
- Nota técnica: o Chromium baixado automaticamente pelo Playwright
  1.61.1 não bate com a revisão pré-instalada neste ambiente (1194 vs
  1228 esperado). Sem rede pra baixar a nova, usei o binário
  pré-instalado via `executablePath` explícito (env var
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, opcional — em produção/CI, sem
  essa env var, o Playwright usa a revisão que ele mesmo baixaria
  normalmente).

### Videoaula (Remotion)
- `remotion/src/`: composição `LearnVideo` (cartão de título + cenas a
  partir de `video_roteiro.cenas`), com schema `zod` pras props (a
  `Composition` do Remotion precisa disso pra inferir os tipos
  corretamente — sem o schema, a inferência não funcionava). Estilo
  provisório só funcional, como combinado (paleta Ouro & Concreto e
  polimento de animação ficam pro prompt de design separado).
- `audioSrc` é opcional: sem ele, o vídeo renderiza mudo. Nunca uma
  voz substituta.
- **BLOQUEIO sinalizado ANTES de tentar, como pedido**: não existe
  `GOOGLE_CLOUD_TTS_CREDENTIALS_JSON` configurada em nenhum lugar desta
  sessão. O código de síntese (`lib/tts/`) foi implementado (JWT de
  service account assinado com `node:crypto`, chamada REST direta —
  sem SDK), mas **nunca invocado**. Perguntei ao usuário como
  proceder antes de fazer qualquer render com narração.
- Renderização mecânica (sem áudio) tentada localmente nesta sandbox
  pra validar que o pipeline funciona de ponta a ponta: Playwright
  funcionou pro PDF, mas o Chromium "regular" não rende mais em
  headless antigo (`Old Headless mode has been removed`) — resolvido
  usando o binário `chrome-headless-shell` já pré-instalado neste
  ambiente. `ffmpeg` também já vem embutido no compositor do próprio
  Remotion (`@remotion/compositor-linux-x64-gnu`), não precisou de
  binário externo. Render de ~535s a 1920x1080/30fps é
  computacionalmente pesado num Chromium headless por software (sem
  GPU) — rodou em background; resultado registrado quando terminar.
- Aviso de versão (não bloqueante): Remotion 4.0.484 espera `zod`
  exatamente `4.3.6`; o projeto usa `4.4.3` (mesma versão major usada
  no resto do código, incluindo o schema do contrato do Learn). Só um
  aviso no render, sem erro — mantido `4.4.3` por ora; revisitar se
  aparecer algum problema de tipo real.
- `.github/workflows/render-video-temp.yml`: workflow temporário
  criado (mesmo padrão do teste do cérebro), pronto pra rodar quando
  a credencial de TTS existir — **ainda não disparado**.
