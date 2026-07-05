# Regras e Guardrails — AR LEARN

## Regra de Ouro
Se o projeto sair do plano de execução dos manuais (os 8 PDFs fornecidos
pelo usuário): pare imediatamente, diagnostique o desvio, conserte para
voltar ao plano, registre o que aconteceu (em `docs/historico.md`), e só
então continue. Não improvisar arquitetura diferente nem trocar ferramenta
por conta própria, mesmo que pareça "mais fácil" no momento.

## Segredos
Nunca vão para o código. Só em variáveis de ambiente do provedor
(Cloudflare Pages / Supabase / GitHub Actions secrets). O repositório
mantém apenas `.env.example` com os nomes das chaves, vazios.

## Idempotência
Tabela `episodios_processados`, chave = ID do vídeo do YouTube. Nunca gerar
Learn duplicado para o mesmo episódio.

## Ciclo de vida do Learn
`rascunho` → `em_revisao` → `publicado`. Publicação só acontece após
aprovação manual do usuário — nada vai ao ar sozinho nesta fase do projeto.

## Consumo e custos
Respeitar os limites definidos no documento "Consumo e Gastos v2" fornecido
pelo usuário. Nenhuma ação em lote que possa estourar cota gratuita sem
antes confirmar com o usuário.

## Trilhas nascem do conteúdo real (Adendo Vitrine e Login)
O nome de uma trilha é só embalagem — proibido decidi-lo antes de a IA
varrer o conteúdo real dos episódios. A trilha só é nomeada/organizada
depois de identificar quais temas têm volume e substância suficientes
no acervo. Proibido forçar um episódio a caber numa trilha só pra
vitrine ficar bonita; se não houver episódios suficientes, o tema fica
dentro de uma trilha mais ampla. Os nomes de exemplo do adendo
("Como fazer seu primeiro milhão" etc.) são rascunho, não lista final.
Cada Learn continua rastreável ao episódio de origem, sem exceção.

## Vitrine Netflix — especificação de UI (Fase 4, NÃO implementar ainda)
Decisões finais do usuário para quando a Fase 4 chegar (a spec, não o
código — schema da Fase 0 não muda):
- Fileiras horizontais, uma por Trilha (não lista única).
- Várias fileiras empilhadas verticalmente na página; rolar pra baixo
  revela mais fileiras/trilhas (padrão Netflix/Astron Members).
- Cards são retângulos verticais, proporção pôster ~2:3 (compatível com
  capa/thumb do episódio) — nunca quadrados.
- Hover: card cresce e "vem pra frente" (escala + sombra + vizinhos se
  afastam) — efeito clássico de streaming.
- Clique no card abre o conteúdo daquele Learn: mapa mental + PDF
  resumo + vídeo overview.
- Nomenclatura técnica (Trilha/Módulo/Learn) não aparece pro aluno —
  ele só vê capas e títulos.
- Polimento visual (animações, render 3D) é prompt separado, enviado
  depois que a vitrine básica funcionar — não adiantar.

## Persona: Magnata Imobiliário (identidade de conteúdo)
Decisão final de Davi (2026-07-05) — substitui integralmente a persona
anterior "Leandro Carozzo" (voz/tom do canal original) e a ideia
intermediária de nome "Rico". **"Magnata Imobiliário" é o nome
definitivo e único da persona de narração/conteúdo do AR LEARN.**

**Personagem**: investidor, magnata, dominador do mercado imobiliário
— inteligente, promissor, com a postura de quem já dominou o jogo
("conhecimento é poder").

**Tom de fala**: vendedor calmo e didático, mas promissor. Fala para
quem está buscando aprender a investir e quer um guia real pra
enriquecer através do mercado imobiliário. Combina calma didática com
autoridade confiante — NÃO é o hype intenso/"gritado" de vendas (ver
abaixo, "Escopo do PDF Decola com a Carozzo").

**Abertura obrigatória de toda videoaula** (regra inviolável, aplicada
pelo cérebro/OpenRouter na primeira cena do `video_roteiro`):
"Olá, bem-vindos ao novo episódio, eu sou o Magnata Imobiliário e hoje
iremos falar sobre [tema]." — só o `[tema]` muda por Learn; o resto da
frase é fixo.

**Escopo do PDF "Decola com a Carozzo"**: SOMENTE a paleta de cores foi
herdada desse material (ver "Identidade visual" abaixo). Não usar
tipografia bold/caixa alta, ícones circulares numerados, rodapé-ticker,
nem o tom de hype de vendas ("R$6 MILHÕES EM JOGO" etc.) — isso foi
descartado.

## Identidade visual (paleta e logo)
Decisão final de Davi (2026-07-05), extraída por análise de pixel real
do PDF "Decola com a Carozzo" (única coisa herdada dele) — substitui a
paleta provisória "Ouro & Concreto" (#0d0d0d / #D4AF37):
- **Fundo dominante**: `#000814` (quase preto, levemente azulado) —
  fundo principal das videoaulas e de toda a identidade do projeto.
- **Dourado/âmbar de destaque**: `#DFA02C` — cor de destaque oficial
  (site, vídeo, PDFs futuros), substitui o `#D4AF37` anterior.
- **Logo oficial**: "AR" (fundo amarelo-dourado vibrante, letras em
  preto sólido) — arquivo em `public/logo-ar.jpg`. Substitui qualquer
  logo anterior, incluindo "Decola com a Carozzo".
- Mecânica de animação (line-art se desenhando, gráficos de barra
  crescendo, tipografia cinética, transições suaves) mantida — só
  recolore fundo (claro → `#000814`) e destaque (`#D4AF37`/azul →
  `#DFA02C`).

## Troca de ferramenta de voz (decisão explícita, não desvio silencioso)
Histórico de tentativas (nessa ordem, todas registradas em
`docs/historico.md`):
1. **Google Cloud TTS** — descartado antes de testar: exigia conta de
   faturamento com verificação de identidade/CPF, que travou o uso na
   prática.
2. **Cloudflare Workers AI (MeloTTS)** — testado com credencial real
   (conta existente, tier gratuito, sem cartão). **REPROVADO por
   ouvido**: a pronúncia misturava fonética de outro idioma,
   confirmando o risco já documentado antes do teste (português não
   consta na lista oficial de idiomas do MeloTTS).
3. **Edge TTS (biblioteca `msedge-tts`)** — testado e **APROVADO**.

### Decisão final (2026-07-04): voz oficial do projeto
**Voz oficial do projeto: `pt-BR-AntonioNeural` (Edge TTS). Fixa em
todo o pipeline — nunca trocar sem aprovação explícita de Davi.**
Aprovada por ouvido, comparando com referência real de voz, entre 3
candidatas masculinas testadas (`pt-BR-AntonioNeural`,
`pt-BR-HumbertoNeural`, `pt-BR-DonatoNeural`). Só a primeira existe de
fato no catálogo do Edge TTS (confirmado via `tts.getVoices()`, não por
documentação) — as outras duas falharam com "No audio data received".
A voz feminina `pt-BR-FranciscaNeural` também tinha sido testada e
aprovada antes, mas foi substituída pela decisão de usar voz masculina
alinhada ao perfil do **Magnata Imobiliário** (persona de narração —
ver seção "Persona: Magnata Imobiliário" abaixo).

**Ressalva importante — Edge TTS não é uma API oficial/comercial da
Microsoft.** É o mesmo endpoint não documentado
(`speech.platform.bing.com`) usado pelo recurso "Ler em voz alta" do
navegador Microsoft Edge, acessado via engenharia reversa pela
biblioteca `msedge-tts`. Não tem SLA, contrato de suporte, nem garantia
de disponibilidade — a Microsoft pode bloquear ou mudar esse endpoint a
qualquer momento, sem aviso. Ainda assim é uma biblioteca amplamente
usada e mantida há tempo (na escolha entre alternativas: 320 estrelas,
0 issues abertas, atualizada em jun/2026).

**Plano C (documentado, NÃO implementado agora)**: se o Edge TTS parar
de funcionar no futuro, o próximo passo é o **Google Cloud TTS**
(descartado antes por fricção de billing/CPF — Davi já sabe lidar com
esse processo agora, então deixa de ser bloqueio). Não implementar essa
troca preventivamente; só executar se o Edge TTS realmente quebrar.

**Regra permanente, sem fallback automático**: nenhuma troca de
provedor/voz acontece por conta própria da IA. Se o Edge TTS falhar
(erro ou qualidade), a IA deve **parar e reportar o resultado exato**.
Só o usuário decide o próximo passo.

## Hierarquia entre documentos
O documento "System Prompt NotebookLM" (produto/design/landing/área de
membros) continua válido, exceto na seção de pipeline/esteira de produção,
onde o documento "Sistema Autônomo v2" vence. Qualquer PDF chamado
"Volume_e_Custos" (sem sufixo v2) está desatualizado e deve ser ignorado —
foi substituído por "Consumo e Gastos v2".

## Fluxo de trabalho (Tablet → PC)
Commits curtos, frequentes e descritivos. Evitar etapas que dependam de
processamento local pesado enquanto o trabalho for feito pelo tablet.
`SETUP.md` sempre atualizado com fatos e status (não narrativa) para a
transição do tablet para o PC. Progresso estritamente fase a fase, na
ordem do Manual de Implementação — sem avançar de fase sem aprovação
explícita do usuário.
