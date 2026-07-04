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

## Troca de ferramenta de voz (decisão explícita, não desvio silencioso)
Voz trocada de Google Cloud TTS para Cloudflare Workers AI (MeloTTS) em
2026-07-04. Motivo: Google Cloud exigia conta de faturamento com
verificação de identidade/CPF, que travou o uso na prática; Cloudflare
já é conta existente (mesma do Pages), tier gratuito de 10.000
neurons/dia, sem cartão, licença MIT. **Risco em aberto**: a
documentação oficial do MeloTTS (Cloudflare e o repositório
myshell-ai) não lista português entre os idiomas suportados — só
inglês, espanhol, francês, chinês, japonês e coreano — e há relato da
comunidade de que nem o espanhol funciona direito. Só será confirmado
com uma chamada real, quando as credenciais (`CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`) chegarem. Se não suportar pt-BR de verdade,
essa decisão volta à mesa — ver `docs/historico.md`.

**Decisão final (2026-07-04): Cloudflare Workers AI é a única ferramenta
de TTS deste projeto — sem fallback automático para OpenAI, Google
Cloud TTS ou qualquer outro provedor.** Se o teste real falhar (erro ou
fonética incorreta), e mesmo depois de conferir o catálogo completo e
atual de modelos de áudio do Workers AI (pode ter modelo novo com
suporte a português que ainda não foi conferido), a IA deve **parar e
reportar o resultado exato — não trocar de provedor por conta própria**.
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
