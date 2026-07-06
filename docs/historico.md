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
- **Render mecânico concluído com sucesso** (local, sandbox, Chromium
  headless_shell + compositor/ffmpeg embutido do Remotion):
  `scripts/output/video-teste.mp4`, 16.050 frames, 34,6 MB,
  **8min55s (535,06s)** — bate exatamente com o esperado (5s de intro +
  530s de cenas do JSON real). 1920x1080, 30fps, h264. Confirmado via
  `silencedetect` do ffmpeg que a trilha de áudio é **100% silêncio**
  do início ao fim — não é uma narração falsa, é a ausência real de
  áudio (o player só inclui uma faixa de áudio muda por padrão).
- Frame de exemplo conferido visualmente: cena e texto narrado batem
  com o roteiro do JSON. Observação de qualidade (não é bug): o texto
  narrado que o LLM escreveu inclui o próprio nome "Leandro Carozzo"
  se apresentando, e a descrição visual da cena o coloca "em estúdio"
  — mesmo a transcrição de teste sendo genérica, sem nenhuma menção a
  ele. Isso é a persona do system prompt sendo aplicada com força total;
  em produção isso é o esperado (episódios reais são dele mesmo), mas
  em testes com transcrição sintética/genérica isso pode soar como
  "encenação" — vale ficar de olho quando rodar com episódios reais.

## 2026-07-04 — Troca de ferramenta de voz: Google Cloud TTS → Cloudflare Workers AI (MeloTTS)
- **Decisão do usuário, documentada conforme a Regra de Ouro** (troca
  explícita, com motivo registrado — não é desvio silencioso). Motivo:
  o Google Cloud exige conta de faturamento com verificação de
  identidade/CPF, que gerou complicação real na prática. Cloudflare
  Workers AI resolve: conta já existe (mesma do Pages), tier gratuito
  de 10.000 neurons/dia sem cartão, MeloTTS é MIT (uso comercial OK).
  Custo estimado pelo usuário: ~18 neurons/min de áudio (~160 neurons
  pra uma videoaula de 9 min, <2% do limite diário).
- **Pesquisa feita antes de codar** (não inventado de memória):
  - Slug confirmado: `@cf/myshell-ai/melotts`.
  - Endpoint REST confirmado: `POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/myshell-ai/melotts`,
    `Authorization: Bearer {CLOUDFLARE_API_TOKEN}`, corpo
    `{"prompt": "...", "lang": "..."}`, resposta
    `{"success", "result": {"audio": "<base64 mp3>"}}`.
  - **Achado crítico**: tanto a [documentação da Cloudflare](https://developers.cloudflare.com/workers-ai/models/melotts/)
    quanto o [repositório original do MeloTTS](https://github.com/myshell-ai/MeloTTS)
    listam os idiomas suportados como inglês, espanhol, francês,
    chinês, japonês e coreano — **português não está na lista**. Há
    também [relato da comunidade](https://community.cloudflare.com/t/cf-myshell-ai-melotts-doesnt-work-in-spanish/811141)
    de que nem o espanhol (que está na lista) funciona ("Error: 8002:
    Invalid input"). Verificado também o catálogo de TTS da Cloudflare
    (Aura-1/Aura-2 da Deepgram): só existem variantes `-en` e `-es`,
    nenhuma em português.
  - Reportei o achado ao usuário **antes de escrever qualquer código**
    de chamada real, via pergunta direta (3 opções: testar mesmo assim
    quando trouxer o token, voltar pro Google, ou buscar terceiro
    provedor). Escolha do usuário: **testar mesmo assim quando trouxer
    o token** — a documentação pode estar incompleta/desatualizada
    (como sugere o próprio bug do espanhol relatado pela comunidade).
- **Implementado**:
  - `lib/tts/sintetizar.ts` reescrito para chamar o Workers AI (fetch
    puro, sem SDK), mantendo a mesma assinatura pública
    (`sintetizarRoteiro(texto): Promise<Buffer>`) — nada mais no
    pipeline precisa mudar.
  - Limite de caracteres por requisição fixado em 600 (conservador —
    MeloTTS não documenta um limite oficial como o Google fazia;
    revisitar depois de medir com a API real).
  - Código antigo do Google Cloud TTS **movido, não apagado**, para
    `lib/tts/obsoleto/` (`googleAuth.ts`, `sintetizarGoogleCloudTts.ts`),
    comentado como obsoleto, não importado por nada ativo.
  - `.env.example`: removida `GOOGLE_CLOUD_TTS_CREDENTIALS_JSON`,
    adicionadas `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`
    (nomes, sem valores).
  - `CLAUDE.md`, `docs/stack.md`, `docs/regras.md` atualizados.
- **Não invocado** — sem `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`
  reais em lugar nenhum desta sessão. Aguardando o usuário trazer as
  credenciais pra rodar o teste real com a transcrição de mercado
  imobiliário (mesma da Fase 2) e confirmar (ou não) o suporte a
  português.
- **Decisão travada**: Cloudflare Workers AI é a única ferramenta de
  TTS do projeto — sem fallback automático pra OpenAI, Google Cloud TTS
  ou qualquer outro provedor. Se o teste real falhar (mesmo depois de
  conferir o catálogo completo/atual de modelos de áudio do Workers
  AI), a IA deve parar e reportar o resultado exato, sem trocar de
  provedor por conta própria — registrado em `docs/regras.md`.
- Usuário cadastrou `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` como
  GitHub Secrets diretamente (sem colar no chat desta vez).
- Recatalogado o catálogo de TTS do Workers AI antes do teste (pedido
  explícito, pra não confiar na verificação anterior): continuam só 3
  modelos — `@cf/deepgram/aura-1`, `@cf/deepgram/aura-2-en`/`aura-2-es`,
  `@cf/myshell-ai/melotts` — nenhum com variante em português.
- **Teste isolado ("texto em português -> áudio") rodado via GitHub
  Actions** (workflow temporário `teste-tts-temp.yml`, PR isolado #3,
  mesmo padrão de sempre):
  - 1ª tentativa: `ENOENT` (script não criava `scripts/output/`) —
    corrigido.
  - 2ª tentativa: **HTTP 500** da própria Cloudflare (`AiError:
    Internal server error`, código 3043) — erro do lado deles, não
    "Invalid input" de idioma não suportado.
  - 3ª tentativa: **sucesso** — a API aceitou `lang: "pt"` e devolveu
    áudio. **Detalhe técnico**: a resposta é WAV (RIFF/WAVE, PCM 16
    bits, 44.1kHz mono), não MP3 como a documentação da Cloudflare
    afirma — sem impacto funcional, só ajustar a extensão/expectativa
    no código. 11,88s de áudio para a frase de teste (~190
    caracteres).
  - Áudio enviado ao usuário pra ouvir e confirmar a pronúncia —
    **ainda não confirmado**; eu não consigo julgar fonética
    sozinho. Nenhuma decisão de prosseguir com a troca completa foi
    tomada até essa confirmação chegar.

## 2026-07-04 — Troca de ferramenta de voz: Cloudflare Workers AI (MeloTTS) → Edge TTS
- **Resultado do teste anterior**: usuário ouviu o áudio do MeloTTS e
  **reprovou** — pronúncia misturava fonética de outro idioma,
  confirmando na prática o risco já registrado antes do teste (o
  português não consta na lista oficial de idiomas suportados pelo
  MeloTTS). Por decisão do usuário (registrada em `docs/regras.md`),
  não troquei de provedor por conta própria — reportei o resultado
  exato e aguardei a decisão.
- **Decisão do usuário**: trocar para **Edge TTS**, biblioteca
  open-source que usa o endpoint não documentado do recurso "Ler em
  voz alta" do navegador Microsoft Edge, sem exigir API key/conta de
  faturamento.
- **Pesquisa de pacote NPM** (pedido explícito: comparar estrelas,
  atividade, issues abertas antes de escolher):
  - `msedge-tts` (Migushthe2nd/MsEdgeTTS): 320 estrelas, 0 issues
    abertas, TypeScript nativo, última atualização jun/2026, suporta
    MP3 nativamente — **escolhido**.
  - `node-edge-tts`: 149 estrelas.
  - `edge-tts-universal`: 70 estrelas.
  - `edge-tts-node`: mesmo repositório do `msedge-tts`, mas nome antigo
    e abandonado (última atualização nov/2024).
- **Teste isolado #1 (voz feminina)**: `pt-BR-FranciscaNeural`, via
  workflow temporário `teste-tts-temp.yml` reaproveitado (checkout já
  pinado na branch de trabalho, sem precisar de novo PR). Sucesso de
  primeira, sem nenhum secret novo. Áudio confirmado como MP3 real
  (24kHz mono, 96kbps) via magic bytes. Enviado ao usuário — **aprovado
  por ouvido**.
- **Pedido de troca pra voz masculina**: usuário decidiu, depois de
  ouvir a Francisca, que queria voz masculina alinhada ao perfil do
  Leandro Carozzo (Guia de Voz e Vídeo V2: confiante, caloroso,
  profissional). Pediu teste comparativo de 3 candidatas:
  `pt-BR-AntonioNeural`, `pt-BR-HumbertoNeural`, `pt-BR-DonatoNeural`.
- **Teste isolado #2 (3 vozes masculinas)**:
  - 1ª rodada: só `pt-BR-AntonioNeural` sintetizou; `pt-BR-HumbertoNeural`
    falhou com "No audio data received" e o script abortava o loop
    inteiro no primeiro erro, então `pt-BR-DonatoNeural` nunca chegou a
    rodar. Corrigido: cada voz passou a rodar em try/catch isolado, e o
    script passou a consultar o catálogo real de vozes via
    `tts.getVoices()` antes de tentar qualquer voz (em vez de confiar
    de memória em quais nomes existem).
  - 2ª rodada (script corrigido): confirmado que o catálogo real de
    vozes pt-BR do Edge TTS tem só 3 entradas —
    `pt-BR-ThalitaMultilingualNeural` (feminina),
    `pt-BR-AntonioNeural` (masculina) e `pt-BR-FranciscaNeural`
    (feminina). `pt-BR-HumbertoNeural` e `pt-BR-DonatoNeural` **não
    existem** de fato — as duas falharam de novo, consistente com o
    catálogo. `pt-BR-AntonioNeural` é a única voz masculina pt-BR
    disponível nessa API.
  - Áudio da Antonio extraído do log da Action (download de artefato
    via blob do Azure bloqueado pelo proxy da sandbox — mesmo problema
    de sempre; contornado com o print base64 no stdout, já usado nos
    testes anteriores) e enviado ao usuário.
- **Decisão final do usuário**: `pt-BR-AntonioNeural` aprovado por
  ouvido, comparado com referência real do Leandro Carozzo — **voz
  oficial e fixa do projeto, não trocar sem aprovação explícita**.
  Registrado em `docs/regras.md`, `docs/stack.md`, `CLAUDE.md`.
- **Integração completa no pipeline**:
  - `lib/tts/sintetizar.ts` reescrito para Edge TTS (`msedge-tts`),
    voz fixa `pt-BR-AntonioNeural` como constante exportada
    (`VOZ_OFICIAL`), não mais parâmetro de teste.
  - Nova função `sintetizarCena` sintetiza o texto de uma cena e mede a
    duração REAL do áudio (via `music-metadata`, parsing do MP3 — não
    estimativa), porque a duração que o cérebro (OpenRouter) chuta pro
    roteiro é só uma estimativa de leitura; quem manda na sincronia
    vídeo/áudio é a narração de verdade.
  - `sintetizarRoteiro` agora sintetiza cena a cena e devolve tanto o
    áudio concatenado quanto as durações reais medidas por cena.
  - Novo script `scripts/sintetizar-narracao-fixture.ts`
    (`npm run narracao:sintetizar`) sintetiza a narração do fixture
    "mercado imobiliário" e salva as durações reais medidas.
  - `scripts/preparar-props-remotion.ts` atualizado: aceita o caminho
    do áudio e das durações reais; quando fornecidos, substitui a
    `duracao_seg` estimada de cada cena pela duração real da narração
    (sincronização vídeo/áudio cena a cena).
  - `remotion/src/LearnVideo.tsx`: corrigido bug de sincronia — o
    `<Audio>` tocava desde o frame 0, sobrepondo o card de título (5s,
    sem narração); agora fica dentro de um `<Sequence from=...>` que
    começa junto da primeira cena.
  - Código do Cloudflare/MeloTTS movido (não apagado) para
    `lib/tts/obsoleto/sintetizarCloudflareMeloTts.ts`, comentado como
    obsoleto e com o resultado do teste real registrado.
  - `.env.example`: removidas `CLOUDFLARE_API_TOKEN` e
    `CLOUDFLARE_ACCOUNT_ID` — Edge TTS não precisa de nenhuma variável
    de ambiente.
  - `docs/regras.md` atualizado com a ressalva de que o Edge TTS não é
    API oficial da Microsoft (endpoint não documentado, sem SLA) e com
    o Plano C documentado (Google Cloud TTS, só se o Edge TTS quebrar
    no futuro — não implementar preventivamente).
  - Workflow `render-video-temp.yml` reescrito pra gerar os 3 ativos
    ponta a ponta num único run: fixture (JSON + mapa mental SVG/PNG
    via Kroki) → PDF → narração real (Edge TTS) → props do Remotion
    (com áudio e durações reais) → render do vídeo. Artefatos separados
    pra vídeo, PDF, PNG do mapa mental e narração isolada.
- **1ª tentativa do teste ponta a ponta (via Actions) — 2 problemas
  encontrados**:
  - Bug de medição de duração: a etapa de síntese da narração falhava
    com `UnsupportedFileTypeError: Guessed MIME-type not supported:
    audio/mpeg`, vindo da lib `music-metadata` ao tentar medir a
    duração de cada cena — mesmo passando o hint de MIME-type
    explícito. Não reproduzi o erro localmente com um áudio de teste
    completo (13,272s), então troquei a abordagem em vez de perseguir
    um mistério de sniffing: como o formato usado
    (`AUDIO_24KHZ_96KBITRATE_MONO_MP3`) é bitrate constante conhecido
    (96kbps), a duração é calculável por matemática exata
    (`bytes*8/bitrate`) — validado batendo exatamente com o que a
    `music-metadata` mediu na mesma amostra (13,272s nos dois
    métodos). `lib/tts/sintetizar.ts` atualizado pra usar esse cálculo;
    dependência `music-metadata` removida do projeto.
  - **Ajuste de apresentação pedido por Davi**: o PDF gerado tinha o
    mapa mental embutido dentro dele (2 páginas), o que não é o
    comportamento desejado — PDF, mapa mental e vídeo devem ser 3
    ativos totalmente independentes na tela do Learn (cada um sua
    própria seção/aba/link), não um dentro do outro. O contrato
    JSON/schema não mudou (os campos já eram separados); só a
    apresentação final. `lib/pdf/gerarPdf.ts` alterado pra remover
    completamente a inclusão do mapa mental (função `construirHtml` não
    recebe mais SVG, `gerarPdfDoLearn` perdeu o parâmetro
    `mapaMentalSvg`); `scripts/testar-pdf.ts` e o workflow atualizados
    pra não passar mais o caminho do SVG.
- **2ª tentativa do teste ponta a ponta — resultado parcial e mais um
  bug encontrado**:
  - Fixture, PDF (sem mapa mental embutido — confirmado: 2 páginas só
    de conteúdo textual, contagem de páginas igual a antes é
    coincidência do tamanho do texto, não sinal de que o mapa ainda
    está lá) e narração real (Edge TTS) funcionaram.
  - **Achado importante sobre duração**: o cérebro (OpenRouter) estimou
    565s de roteiro; a narração real medida (Edge TTS, cena a cena)
    ficou em **454,27s** — bem abaixo da estimativa (a IA generativa
    tende a superestimar tempo de leitura vs. o ritmo de fala real do
    TTS), mas ainda **acima do piso de 420s (7 min)** exigido pelo
    projeto. Vídeo final: 5s de intro + 454,27s de cenas = 459,27s
    (~7min39s).
  - Bug novo: o render do Remotion falhou com `Error while downloading
    http://localhost:3000/scripts/output/narracao-fixture.mp3: ...404`.
    Causa: o renderizador do Remotion só serve arquivos locais que
    estejam dentro da pasta `public/` da raiz do projeto (via
    `staticFile()`); um caminho relativo qualquer fora dela (como
    `scripts/output/...`) não é servido pelo servidor de preview
    interno dele, mesmo existindo no disco. Corrigido: a narração
    passou a ser escrita em `public/narracao-fixture.mp3` (novo,
    ignorado no git — não é ativo de produção), e
    `preparar-props-remotion.ts` passou a construir o `audioSrc` com
    `staticFile()` (importado de `remotion`) em vez do caminho cru.
- **3ª e 4ª tentativas do teste ponta a ponta — step "Gerar fixture
  real" travou 2x seguidas (~9-10 min cada, sem erro, sem progresso nos
  logs) em vez de completar em ~35s como nas tentativas anteriores.**
  Segui a regra de não insistir na mesma falha sem entender a causa:
  cancelei as duas execuções travadas (`cancel_workflow_run`) em vez de
  tentar uma 3ª vez às cegas, e investiguei antes de qualquer novo
  disparo.
  - **Causa raiz identificada**: `lib/mapa-mental/kroki.ts` nunca teve
    timeout no `fetch` pro Kroki. Isso não dava problema antes porque
    `gerar-fixture-real.ts` só chamava o Kroki uma vez (SVG); nesta
    sessão, adicionei uma segunda chamada (PNG, pro mapa mental virar
    ativo separado) — dobrando a exposição a uma instabilidade pontual
    da instância pública do Kroki, e sem timeout o fetch trava pra
    sempre, sem erro nenhum aparecer no log.
  - **Corrigido**: `renderizarMapaMentalKroki` agora usa
    `AbortController` com timeout de 30s, lançando um erro claro
    (`Kroki não respondeu em 30s`) em vez de travar silenciosamente.
- **5ª tentativa — mesmo padrão de trava, agora no step de síntese da
  narração** (~10 min parado em vez de ~70s, confirmado por checagens
  repetidas de status sem mudança nenhuma — não era atraso de
  cache/API). Cancelei em vez de tentar de novo às cegas (3º travamento
  distinto no dia) e investiguei.
  - **Causa raiz**: mesmo padrão do bug do Kroki — `sintetizarTexto` em
    `lib/tts/sintetizar.ts` também nunca teve timeout. O loop `for
    await (const parte of audioStream)` fica esperando para sempre se o
    WebSocket do Edge TTS (`msedge-tts`) tiver uma instabilidade
    pontual numa cena específica e nunca fechar o stream.
  - **Corrigido**: adicionado timeout de 45s por chamada + 1
    retentativa automática (`comTimeout` com `Promise.race`), e
    `tts.close()` no `finally` pra não vazar a conexão WebSocket em
    caso de timeout.
- **6ª tentativa — TTS passou rápido (34s), mas o render do Remotion
  voltou a dar 404 no áudio**, agora em `http://localhost:3000/
  narracao-fixture.mp3` (path certo, sem o prefixo `scripts/output/` de
  antes — a correção do `staticFile()` funcionou nesse sentido), mas o
  arquivo não estava no diretório temporário do bundle
  (`/tmp/remotion-webpack-bundle-.../narracao-fixture.mp3`). Causa
  provável: o Remotion não estava encontrando/copiando a pasta
  `public/` do jeito esperado (a lógica de "achar a raiz do projeto" é
  uma heurística, subindo diretórios até achar um `package.json`).
  Corrigido de forma mais direta, sem depender de heurística: o comando
  `remotion render` agora recebe `--public-dir="$(pwd)/public"`
  explícito (caminho absoluto). Também adicionado um step de
  diagnóstico (`ls -la public/`) antes do render, pra confirmar no log
  que o arquivo existe e tem o tamanho esperado antes de qualquer nova
  tentativa.
- **7ª tentativa — travou de novo no mesmo step de fixture (~8+ min).**
  Antes de tentar de novo, Davi pediu pra confirmar se o timeout do
  Kroki cobria a chamada do OpenRouter usada nesse mesmo step — **não
  cobria**: são duas chamadas de rede totalmente separadas
  (`chamarOpenRouter` em `lib/openrouter/gerarLearn.ts` e
  `renderizarMapaMentalKroki` em `lib/mapa-mental/kroki.ts`), e só a
  do Kroki tinha timeout. `chamarOpenRouter` nunca teve nenhuma
  proteção contra o fetch nunca resolver — explica o hang de 8+ min
  (bem além do que o timeout do Kroki, sozinho, permitiria).
  - **Corrigido**: `chamarOpenRouter` agora tem timeout de 30s
    (`AbortController`, mesmo padrão do Kroki e do Edge TTS), e o
    timeout vira `ErroTransiente` — automaticamente retentado pelo
    loop de `MAX_TENTATIVAS` que já existia (backoff exponencial:
    2s/4s/8s entre tentativas).
  - **Logging com timestamp adicionado em cada chamada de rede
    individual** do fluxo (pedido explícito de Davi, pra saber
    exatamente qual serviço travou se acontecer de novo): novo helper
    `lib/util/log.ts` (`logComTimestamp`), usado em
    `chamarOpenRouter` ("Chamando OpenRouter...", "Resposta do
    OpenRouter recebida.") e em `renderizarMapaMentalKroki`
    ("Chamando Kroki (svg/png)...", "Resposta do Kroki (svg/png)
    recebida."). Deliberadamente NÃO foi adicionado nenhum timeout
    genérico de step/processo inteiro — cada chamada individual falha
    rápido (30s) por conta própria.
- **8ª tentativa — desta vez NÃO foi um hang, foi um engano meu.** O
  step "Gerar fixture real" completou rápido (fixture, PDF, narração,
  props e o diagnóstico `ls -la public/` todos com sucesso, o áudio
  confirmado presente em `public/narracao-fixture.mp3` com o tamanho
  certo) — só que a API de status do GitHub Actions mostrou esse step
  como "in_progress" por tempo suficiente pra eu concluir (errado) que
  tinha travado de novo, e cancelei a execução no meio do passo de
  narração, que estava rodando normalmente. Confirmado lendo o log
  completo do job cancelado: todos os marcadores de conteúdo
  apareciam. **Corrigido o processo, não o código**: reaprendida a
  lição de não confiar só no status da API sem checar o log real antes
  de cancelar.
  - Resultado real dessa rodada: o pipeline chegou até o render do
    Remotion pela primeira vez (passou de todos os problemas
    anteriores) — e falhou de novo com o MESMO erro 404 no áudio, mesmo
    com `--public-dir` explícito e o arquivo confirmado presente no
    `ls -la public/` logo antes do comando de render.
  - **Causa raiz de verdade, encontrada lendo o código-fonte do
    Remotion (`node_modules/@remotion/bundler/dist/bundle.js` e
    `node_modules/remotion/dist/cjs/static-file.js`)**: `staticFile()`
    calcula o prefixo certo do caminho usando uma variável global do
    navegador (`window.remotion_staticBase`) — que só existe quando o
    código roda de fato DENTRO do Chrome que o Remotion usa pra
    renderizar. Chamado num script Node puro (nosso
    `preparar-props-remotion.ts`, sem `window`), `staticFile()` cai
    num fallback silencioso que devolve só `/nome-do-arquivo`, sem
    prefixo — e esse caminho sem prefixo não bate com o lugar onde o
    bundler do Remotion realmente copia a pasta `public/`
    (`outDir/public/`, confirmado lendo `bundle.js`). Resultado: 404,
    mesmo com o arquivo existindo no disco no lugar certo.
  - **Corrigido de verdade**: `staticFile()` foi removido do script
    (`preparar-props-remotion.ts` agora só manda o NOME do arquivo,
    relativo a `public/`) e passou a ser chamado dentro do componente
    React (`remotion/src/LearnVideo.tsx`), que roda de verdade no
    navegador do Remotion — contexto onde `staticFile()` funciona
    conforme documentado.

## 2026-07-05 — Nova persona "Magnata Imobiliário" + identidade visual definitiva
Decisão final de Davi, substitui integralmente a persona "Leandro
Carozzo" (tom/voz do canal original) e a ideia intermediária de nome
"Rico" — registrada conforme a Regra de Ouro.

- **Persona**: "Magnata Imobiliário" — investidor, magnata, dominador
  do mercado imobiliário, inteligente, promissor, postura de quem já
  dominou o jogo. Tom: "vendedor calmo e didático, mas promissor" —
  NÃO é o hype intenso/"gritado" de vendas.
- **Abertura obrigatória de toda videoaula** (aplicada na 1ª cena do
  `video_roteiro`): "Olá, bem-vindos ao novo episódio, eu sou o Magnata
  Imobiliário e hoje iremos falar sobre [tema]." — só `[tema]` muda.
- **Escopo do PDF "Decola com a Carozzo"**: SOMENTE a paleta de cores
  foi herdada (extraída por análise de pixel real, não aproximação
  visual) — tipografia, ícones, rodapé-ticker e tom de hype desse
  material foram descartados.
- **Identidade visual**: fundo `#000814` (quase preto azulado) e
  destaque `#DFA02C` (dourado/âmbar), substituindo a paleta provisória
  "Ouro & Concreto" (`#0d0d0d`/`#D4AF37`). Logo oficial "AR" (fundo
  amarelo-dourado, letras pretas) salva em `public/logo-ar.jpg`,
  substitui qualquer logo anterior.
- **Implementado**:
  - `lib/openrouter/systemPrompt.ts` reescrito com a nova persona, tom
    e a regra de abertura obrigatória.
  - `remotion/src/LearnVideo.tsx`: paleta recolorida (`COR_FUNDO`
    `#000814`, `COR_DESTAQUE` `#DFA02C`), logo `public/logo-ar.jpg`
    adicionada ao `TituloCard` via `<Img src={staticFile(...)}>`.
    Mecânica de animação (Sequences, timing) mantida — só recoloriu.
  - `docs/regras.md`: nova seção "Persona: Magnata Imobiliário" e
    "Identidade visual (paleta e logo)"; menções a "Leandro Carozzo"
    na seção de escolha de voz atualizadas para referenciar a nova
    persona.
  - `SETUP.md` e `app/(marketing)/page.tsx`: comentários/pendências
    atualizados pra refletir a identidade visual definida (não mais
    "ainda por confirmar").
- **Pendente (bloqueado até aprovação)**: Davi pediu uma prévia de
  texto (2-3 frases de exemplo do Magnata Imobiliário abrindo um Learn
  sobre "como funciona o mercado imobiliário") antes de autorizar
  qualquer novo render de vídeo — nenhum render foi disparado com a
  persona/paleta nova ainda.

## 2026-07-05 — Bug de duração real abaixo do piso (355s) + correção
Davi reportou que o vídeo renderizado do fixture "mercado imobiliário"
saiu com 355s (5,9min), abaixo do piso de 420s (7min), mesmo com a
"validação de duração" supostamente implementada.

- **Diagnóstico**: existiam DUAS camadas de validação de duração, e só
  uma estava conectada de fato:
  1. `gerarLearnDoEpisodio` (cérebro/OpenRouter) valida a soma das
     ESTIMATIVAS `duracao_seg` que o próprio LLM "chuta" no roteiro, com
     retentativas (`MAX_TENTATIVAS = 3`) — essa parte sempre funcionou
     corretamente (rejeita/retenta se a estimativa não bate o piso).
  2. A duração REAL da narração (medida depois, via Edge TTS) NUNCA era
     validada — e o Edge TTS fala mais rápido do que a estimativa do
     LLM assume. Um roteiro que passava na validação de estimativa podia
     gerar áudio real abaixo do piso, e o vídeo era renderizado assim
     mesmo, silenciosamente. Essa é a causa raiz real do vídeo de 355s.
- **Correção**: `sintetizarRoteiro()` (`lib/tts/sintetizar.ts`) agora
  mede a duração real total (soma das durações medidas por bitrate
  constante) e lança erro explícito ("Narração real ficou em Xs, abaixo
  do piso de 420s...") se ficar abaixo do piso — IMPEDE o vídeo de ser
  gerado, em vez de aceitar silenciosamente. Piso compartilhado extraído
  para `lib/constantes.ts` (`DURACAO_MINIMA_VIDEO_SEG = 420`), importado
  tanto por `gerarLearn.ts` quanto por `sintetizar.ts`, evitando duas
  fontes de verdade divergentes para o mesmo número.
- **Teste rápido/barato** (`scripts/testar-validacao-duracao.ts`, script
  `npm run validacao-duracao:teste`): roteiro deliberadamente curto (3
  frases), sem chamar o cérebro/OpenRouter, confirma que
  `sintetizarRoteiro()` REJEITA corretamente com a mensagem de erro
  esperada — evita gastar um render completo só para testar a validação.
  Também registrado como job isolado (`testar-validacao-duracao`) no
  workflow `teste-tts-temp.yml`, e como guarda permanente (roda antes do
  Playwright/render) no início do `render-video-temp.yml`, protegendo
  todo render futuro contra a mesma regressão.
- **Confirmação em produção**: o teste rápido/barato passou (rejeitou
  corretamente um roteiro curto de teste). Em seguida, o render
  completo real (fixture "mercado imobiliário", já com a persona
  Magnata Imobiliário) foi disparado — a correção funcionou exatamente
  como esperado: a narração real saiu em **373,54s**, abaixo do piso, e
  foi **REJEITADA antes do render de vídeo** (nenhum minuto de Remotion
  desperdiçado), com a mensagem de erro clara esperada.
- **Causa raiz do desalinhamento estimativa x real (recalibração)**:
  comparando com o fixture anterior salvo localmente
  (`scripts/output/fixture-mercado-imobiliario.json`): o cérebro havia
  estimado 530s de soma de `duracao_seg`, mas a narração real saiu em
  355s — ou seja, o cérebro assume uma cadência de fala de ~11,9
  caracteres/segundo (~123 palavras/min), bem mais lenta que a
  velocidade REAL medida da voz `pt-BR-AntonioNeural` (Edge TTS), que é
  de ~17,8 caracteres/segundo (~183 palavras/min). O `systemPrompt.ts`
  não dava nenhuma fórmula concreta ao LLM — ele só "chutava" a duração
  de cada cena livremente, o que explica por que a validação de
  ESTIMATIVA (que sempre funcionou) não impedia esse desalinhamento.
- **Correção da fórmula**: `lib/openrouter/systemPrompt.ts` agora
  instrui o cérebro a calcular `duracao_seg` de cada cena por
  `caracteres ÷ 17,8` (a taxa real medida do Antonio), em vez de
  estimar livremente, e a mirar numa soma de pelo menos 460s (folga de
  ~40s acima do piso real de 420s, para absorver variância residual
  entre a fórmula e a fala real). O piso rígido de 420s em
  `lib/constantes.ts`/`sintetizarRoteiro()` continua sendo a última
  linha de defesa, inalterado.
- **Sequência acordada com Davi antes do próximo render completo**: só
  o teste barato (geração de roteiro + validação de duração estimada,
  sem renderizar vídeo) deve rodar para confirmar que a nova fórmula
  acerta o alvo — nenhum novo render completo deve ser disparado sem
  autorização explícita dele, mesmo com a causa e a correção já
  diagnosticadas e aprovadas.
- **A fórmula no prompt (17,8 char/seg) NÃO foi suficiente**: rodando o
  teste barato (job `testar-formula-duracao-cerebro`), o gate passou
  (481,2s, acima do alvo de 460s) — mas analisando o JSON retornado, a
  taxa que o LLM realmente aplicou foi ~10,06 char/seg (4.841
  caracteres ÷ 481,2s), quase igual à taxa antiga (~11,9-11,93), não os
  17,8 char/seg pedidos explicitamente no prompt. O LLM não segue
  aritmética por-cena de forma confiável mesmo com a fórmula explícita
  — ele continua "chutando" por intuição. Se o render completo tivesse
  sido disparado nesse resultado, a previsão real (4.841 ÷ 17,8 ≈
  272s) mostra que teria FALHADO de novo, abaixo do piso.
- **Correção definitiva: recálculo determinístico em CÓDIGO, não no
  prompt.** `lib/openrouter/gerarLearn.ts` agora sobrescreve
  `cena.duracao_seg` de cada cena logo após a validação do schema,
  calculando `texto_narrado.length / TAXA_CARACTERES_POR_SEGUNDO_ANTONIO`
  (nova constante em `lib/constantes.ts`, valor 17,8) — o número que o
  LLM escreve em `duracao_seg` é descartado e nunca usado no gate. A
  lógica de retry/expansão (`MAX_TENTATIVAS`, mensagem pedindo mais
  conteúdo) foi mantida sem mudança — só a FONTE do número mudou, de
  "o que o LLM disse" para "o que o código calculou a partir do texto
  real". `systemPrompt.ts` foi ajustado para não pedir mais aritmética
  ao modelo (o `duracao_seg` que ele escrever é ignorado); em vez
  disso, instrui a escrever pelo menos ~8.200 caracteres somados de
  `texto_narrado` (o equivalente a ~460s na taxa real do Antonio).
- **Confirmação parcial + novo bug exposto**: o teste barato confirmou
  que o recálculo determinístico funciona (log real: "duração do
  roteiro (recalculada por caracteres): 221,63s (piso: 420s)" — número
  batendo com os caracteres de verdade, não mais o chute do LLM — e
  corretamente disparou a retentativa de expansão). Mas o teste falhou
  mesmo assim: na retentativa de expansão (roteiro mais longo pra
  bater o novo alvo maior de caracteres), o OpenRouter devolveu JSON
  cortado no meio ("Expected ',' or '}' after property value... position
  16615"), esgotando as 3 tentativas.
- **Causa raiz**: `chamarOpenRouter()` não definia `max_tokens`
  nenhum — a resposta mais longa (necessária pro roteiro expandido)
  provavelmente bateu num teto padrão da API e foi cortada no meio do
  JSON. Confirmado via busca que `google/gemini-2.5-flash` suporta até
  65.535 tokens de saída no catálogo do OpenRouter — não é o modelo
  que limitava, era a ausência de `max_tokens` explícito.
- **Correção**: `max_tokens: 12_000` adicionado à chamada (folga
  generosa sobre a estimativa de ~6-7 mil tokens do JSON completo —
  roteiro ~8.200 caracteres + seções do PDF + mapa mental + estrutura
  —, ainda bem abaixo do teto real do modelo). Também adicionada
  checagem explícita de `finish_reason === "length"` na resposta, que
  lança um erro claro ("cortou a resposta por atingir o limite de
  max_tokens... JSON incompleto, não malformado") em vez de deixar
  virar um erro genérico de `JSON.parse` que esconde a causa real.

## 2026-07-05 — Motion graphics reais no Remotion (2 renders estáticos reprovados)
Davi reprovou (PARADA TOTAL) os dois primeiros renders completos: saíram
como TEXTO ESTÁTICO sobre fundo colorido, sem animação e sem relação
visual com a narração. Ele mediu quadro a quadro e provou intervalos de
60s+ com diferença ZERO (tela congelada), contra a referência que nunca
fica parada. Enviou o PDF "AR_LEARN_Diretrizes_Animacao_Restritas" com
regras técnicas sem ambiguidade (interpolate/spring obrigatórios,
line-art com stroke-dashoffset, gráficos com interpolate, tipografia
cinética, corte de cena 4-8s, e correspondência conteúdo↔visual: cada
cena ILUSTRA o que é narrado). Pediu modelo mais forte (Opus) só para
esta tarefa e teste objetivo de frame-diff antes de qualquer render.

- **Causa raiz**: `LearnVideo.tsx` tinha `TituloCard`/`CenaView` como
  `<div>` estáticos (só cor de fundo + texto), sem nenhum
  interpolate/spring/SVG — um comentário no próprio código admitia que
  a animação tinha sido adiada "para o prompt de design separado" e
  nunca foi retomada. Não era polimento faltando: era implementação
  ausente.
- **Implementado (via agente Opus, escopado só a esta tarefa)**:
  - Campo `visual_tipo` (enum de 12 valores) por cena, em
    `lib/openrouter/schema.ts` (obrigatório no cérebro),
    `systemPrompt.ts` (documentado + guia de correspondência) e
    `remotion/src/cores.ts` (`VISUAL_TIPOS`, fonte de verdade). O
    cérebro passa a escolher, por cena, a animação temática que ilustra
    o que é narrado (1ª cena sempre `skyline_abertura`).
  - Primitivas de animação (`remotion/src/animacao/`): `EntradaSpring`,
    `TextoCinetico` (tipografia cinética), `LineArtDraw`
    (stroke-dashoffset pathLength→0), `BarraAnimada`/`GraficoBarras`
    (interpolate de altura + rótulos em sequência). Nada aparece pronto
    no frame 0; movimento contínuo (drift/pulso) garante que nenhum
    intervalo de 2s fique idêntico.
  - 11 componentes temáticos + fallback (`remotion/src/cenas/`), um por
    `visual_tipo`, cada um ilustrando o conceito (balança de oferta x
    demanda, casa valorizando, barras por ano, calculadora + custos,
    mapa com raio, calendários de renda/short-stay, ciclo circular
    girando, alerta com lista, checklist com checks desenhados).
  - `LearnVideo.tsx` vira dispatcher por `visual_tipo`; preservados o
    `audioSrc`/`staticFile` (sync de narração) e o timing por cena.
- **Ícones em SVG próprio, não emoji (Regra de Ouro — evita "tofu" em
  CI)**: os componentes usavam emoji (🏠🧑🛏️🚌🏪🏥🏫🌳📍), que dependem de
  fonte de cor do SISTEMA. Local (Chromium do Playwright) renderiza,
  mas o render OFICIAL roda no GitHub Actions com o chrome-headless-shell
  do Remotion, onde a fonte de emoji pode não existir — viraria caixa
  vazia. Trocados por `remotion/src/icones/Icones.tsx` (path desenhado,
  cor da paleta): render determinístico em qualquer ambiente e mais
  on-brand (line-art dourado combina com o resto; emoji multicolor
  destoava).
- **Verificação objetiva (feita por mim, antes de qualquer render caro)**:
  - `scripts/verificar-animacao.ts`: renderiza quadros amostrados da
    composição REAL (via dispatcher) a cada 1s (mais rígido que os 2s
    do PDF) e compara pixel a pixel. Resultado: 35/35 intervalos com
    movimento real (0,6% a 9,5% de pixels alterados por segundo),
    NENHUM intervalo com diferença zero. Roda local com o Chromium do
    ambiente + compositor nativo do Remotion (sem ffmpeg, sem CI).
  - `scripts/inspecionar-cenas.ts`: renderiza 1 still de cada
    `visual_tipo` para auditoria visual — confirmado que nenhum ícone
    virou tofu e a qualidade de cada componente está boa.
  - `npx tsc --noEmit` limpo em todo o projeto.
- **Sequência acordada**: PR com o trabalho validado (typecheck +
  frame-diff + auditoria de ícones) → Davi mergeia → só então renderizo
  um clipe curto (2-3 cenas) para aprovação visual dele → só depois o
  render completo. Nenhum render completo disparado sem aprovação.

## 2026-07-05 — Clipe curto de aprovação + conflito de merge resolvido
- **Merge do main na branch (PR #5)**: 3 workflows tinham conflito
  add/add. Resolvidos com base no que é tecnicamente correto (não "o
  mais novo cego"): narração em `public/` (não `scripts/output/` —
  `staticFile()` do Remotion só serve de `public/`; fora dá 404),
  PDF só-texto (mapa mental é ativo separado), Edge TTS (Cloudflare foi
  reprovado). Davi tinha lembrado o caminho da narração invertido;
  rastreei os 3 scripts (sintetizar → preparar-props → LearnVideo) +
  o comentário no código e confirmei que `public/` é o certo.
- **Clipe curto de aprovação** (`scripts/renderizar-clipe-curto.ts`):
  render LOCAL (Chromium do ambiente + compositor nativo do Remotion,
  sem CI) de intro + 3 cenas (grafico_precos_anos, ciclo_mercado_circular,
  oferta_demanda_balanca), 26s, SEM áudio (Edge TTS precisa de rede
  externa bloqueada na sandbox; o objetivo é aprovar a animação). O
  render completo no CI adiciona a narração real do Antonio. Enviado a
  Davi para aprovação visual antes do render completo.

## 2026-07-05 — Animação v2: transições 3D, movimento contínuo, densidade
Davi reprovou o 1º clipe (progresso real, mas ainda abaixo do exigido) e
mandou diretrizes v2 objetivas. Implementado e VALIDADO por frame-diff a
cada 0,5s (mais rígido que os 2s da v1) antes de qualquer render caro:

- **Transições (nada de corte seco)**: `@remotion/transitions`
  (TransitionSeries) em TODAS as trocas, com presentation 3D própria
  (`animacao/transicaoProfundidade.tsx`): a cena que sai recua no eixo Z
  e a que entra avança do fundo (perspective + translateZ + escala +
  opacidade parcial), ~800ms com easing suave. **Sincronia de áudio
  preservada**: cada cena é "padada" por t frames que a sobreposição da
  transição consome exatamente, então cena_i sempre começa em
  introFrames + Σ narrações anteriores — zero drift acumulado (prova no
  comentário do LearnVideo.tsx). Root.tsx soma frames por cena
  arredondados para casar o total.
- **Profundidade 3D real (não fade 2D)**: `_Base.tsx` FundoCena agora tem
  câmera "viva" (rotação circular de poucos graus, velocidade constante)
  e 3 camadas em Z: FAR (grade de pontos em parallax), MID (halo + linhas
  de apoio deslizando + sparkles), NEAR (conteúdo). Still no meio de uma
  transição confirma duas cenas em planos de profundidade diferentes.
- **Movimento contínuo (piso)**: elemento principal com deriva CIRCULAR
  (velocidade constante — seno sozinho estaciona nos picos e derruba o
  movimento); sparkles orbitando; linhas de parallax em scroll contínuo.
  Resultado: nenhum trecho > 1s abaixo de 1% de pixels/0,5s (média 2,2%).
- **Densidade de composição (minimalista)**: cantos decorativos,
  grade de pontos, sparkles e linhas em TODA cena (via FundoCena) +
  por-cena: selo "+81% em 5 anos" no gráfico, termo-chave "Oferta e
  Demanda", destaque suave (fade) nos setores do ciclo. Hierarquia
  clara: principal grande/central, apoio menor/discreto, espaço para
  respirar — sem poluir.
- **Verificação objetiva** (`scripts/verificar-animacao.ts`, agora a cada
  0,5s): 3 critérios — sem congelamento, sem trecho > 1s abaixo de 1%, e
  sem pico > 2x os vizinhos (transição suave, não corte). PASSOU nos três.
  Stills de 3 cenas + 1 transição auditados visualmente (densidade + 3D).

## 2026-07-05 — Animação v3: 3D na entrada/transição, cenas ESTÁVEIS
Davi detalhou tratamento por componente (12) e inverteu o princípio da
v2: a v2 usava movimento contínuo (deriva/câmera) para bater um piso de
frame-diff — mas isso virou "balanço" perceptível. v3: profundidade 3D e
movimento acontecem na ENTRADA e na TRANSIÇÃO; depois o elemento fica
ESTÁVEL. O piso de movimento da v2 foi abandonado; o anti-"imagem morta"
passa a ser só sparkles discretos.

- **Removido**: deriva circular do elemento central, câmera "viva" em
  loop, grade de linhas e grade de pontos de fundo (seção 6).
- **Entrada3D** (`animacao/Entrada3D.tsx`): entrada com rotateY OU rotateX
  (8-20°) + translateZ + opacidade, gradual, glint 1x e sombra opcionais;
  SEM idle contínuo. Adotada nos 12 componentes.
- **Tratamento por componente** (seção 3): skyline (logo vem do Z + rotateY,
  skyline para de mexer após desenhar), oferta (balança "pousa" com
  rotateX, inclinação = 1 interpolação e para, ícones à frente em Z),
  valorização (selo % à frente da casa, entra depois), gráfico (barras em
  leque de Z, rótulos com rotateX sequencial), financiamento (chips em Z
  distintos, calc estática), localização (anéis expandem 1x em camadas Z,
  pin à frente), renda/short-stay (cifrão/ícones chegam em profundidade,
  casa/cama estáticas), ciclo (SEM giro 360°: setor ativo avança em Z e
  recua), alerta (shake amortece e para, itens em Z), checklist (item chega
  em 3D e só então o check desenha), genérico (bloco entra em Z, para).
- **Transições variadas** (`transicaoProfundidade.tsx`): 3 apresentações
  3D alternando por índice — profundidade (recua/avança em Z), página
  (rotateY tipo página virando), suave (fade + leve Z). 400-800ms, easing.
- **Duração por leitura** (`lib/constantes.ts` `duracaoCenaSegundos`):
  max(5s, caracteres da legenda ÷ 16 char/s). Determinístico; usado no
  clipe/verifier. Como 16 < 17,8 (fala do Antonio), a cena sempre dura o
  bastante para a narração terminar sem corte.
- **Verifier v3** (`verificar-animacao.ts`, 0,5s): 3 checks — sem
  congelado (zero), sem corte seco (pico >4x vizinhos E >4%), e sem
  oscilação contínua (MEDIANA < 1,2%). Resultado: PASSOU, média 1,13% /
  **mediana 0,25%** (holds calmos = estável). Stills das 3 transições
  auditados: profundidade 3D real (rotação de página + crossover em Z).

---

## Sessão — Especificação de Design DEFINITIVA (v4): 4 camadas Z, catálogo 2D, recursos de meio-termo

Base: `AR_LEARN_Especificacao_Design_Final.pdf` (7 páginas), que SUPERA os
manuais de animação anteriores. Problema é subjetivo ("faltando algo /
simples demais"), então a spec é a "melhor hipótese testável" — com
liberdade para propor extras justificados dentro das restrições.

### Estrutura de 4 camadas Z (§4.1) — `cenas/_Base.tsx`
Toda cena agora tem `perspective:1000` + `preserve-3d` com camadas fixas:
FUNDO (translateZ -300: sparkles + halo), PRINCIPAL (0: ilustração),
APOIO (100: selo/chip/grid via `CamadaApoio`), TEXTO (legenda/termo, à
frente). **Ajuste justificado**: a camada de TEXTO ficou em Z 0 (não 200)
e vem por último no DOM — `translateZ(200)` sob `perspective:1000`
empurrava a legenda (na base) pra fora da tela; a hierarquia "mais à
frente/legível" é garantida pela ordem de empilhamento.

### Catálogo 2D (§2) — primitivas
- `ContadorCinetico.tsx` (§2.5): conta 0→final em ~25f, formata
  moeda/percentual/número/milhar por quadro.
- `TextoCinetico` (§2.3) e `BarraAnimada` (§2.2) reescritos: sem "respiro"
  contínuo — entram e ESTABILIZAM. Barra usa `Easing.out(cubic)`.

### Recursos de meio-termo (§5) — máx. 1-2 por cena (Tabela §7)
Novos: `SeloBadge` (5.1, anel via stroke-dashoffset + contador + spring),
`MiniGrid` (5.2, blocos + contador, SEM ícone de pessoa), `ChipNumerado`
(5.3, "N de T"), `TrilhaConectada` (5.4, linha + nós acendendo),
`CaixaReforco` (5.5), `GanchoPergunta` (5.7).

### Extras aprovados por Davi (§0, com justificativa)
- **Monograma AR** (`MonogramaAR.tsx`): assinatura dourada persistente +
  linha-trajetória no canto (motivo de continuidade). Renderizada acima da
  TransitionSeries — não transiciona com as cenas.
- **Depth-of-field**: `blur(2.5px)` SÓ na camada de fundo (-300), para
  "vender" a profundidade real. NÃO conta como recurso.

### Restrições cumpridas (§8)
Zero silhueta humana (IconePessoa REMOVIDO de `Icones.tsx`; oferta_demanda
migrada para MiniGrid de blocos), zero imagem de banco externa, zero emoji
de fonte (tudo path SVG próprio).

### 4 cenas do clipe reescritas (§6/§7)
`ValorizacaoCasa` (casa em 3 paths sequenciais + SeloBadge +18%),
`GraficoPrecosAnos` (barras com contador + TrilhaConectada de anos),
`CicloMercadoCircular` (4 setores fixos, ativo avança em Z + ChipNumerado
"N de 4"), `OfertaDemandaBalanca` (balança pequena + MiniGrid oferta/demanda).

### Teste objetivo (§10) — `verificar-animacao.ts`
- **Bug pego pelo próprio verifier**: a transição C (fade-z, 12f = 0,4s)
  cabia inteira ENTRE duas amostras de 0,5s, aparecendo como salto de 7,9%
  contra vizinhos calmos. Investigado com zoom quadro-a-quadro: o perfil é
  uma CORCOVA (0,4→0,75→1,1→1,57→7,1→7,7→2,3→1,1%), não um pico isolado —
  um crossfade eased legítimo (still do meio mostra as duas cenas
  sobrepostas). Um corte seco de verdade poria ~toda a mudança num ÚNICO
  quadro.
- **Correção do discriminador** (não da animação): ao achar um candidato a
  corte na amostragem grossa, o verifier dá zoom quadro-a-quadro e mede a
  CONCENTRAÇÃO = maiorPasso ÷ soma dos passos. Corte seco ~1,0; transição
  espalhada bem abaixo. Limite 0,6. A dissolve grafico→ciclo deu **0,28 =>
  transição suave (ok)**. C passou de 12f→16f só por suavidade.
- **Resultado**: PASSOU — sem congelado, sem corte seco, sem oscilação
  contínua (média 0,85% / **mediana 0,20%**). Stills das 4 cenas + 3
  transições auditados visualmente (legenda, selo, chip "2 de 4", trilha,
  mini-grid, monograma AR, DOF — todos corretos).

### Entregue / pendente
- Clipe curto v4 (34,3s, sem áudio) renderizado e enviado ao Davi para
  aprovação. Render completo NÃO disparado (aguarda aprovação).
- PENDENTE p/ render completo: reescrever as outras 8 cenas para v4
  (skyline, financiamento, localização, renda, short-stay, alerta,
  checklist, genérico) conforme §4.2 + Tabela §7.
