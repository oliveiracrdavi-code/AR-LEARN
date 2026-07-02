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
