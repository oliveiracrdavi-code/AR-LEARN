# Sistema de alterações via IA — arquitetura e custo

Data: 2026-07-20. É um **editor de "receita de geração" operado por
linguagem natural** — a IA nunca edita código: edita o config que o
código já sabe consumir.

## Arquitetura do generation_config

- Tabela `generation_config` (migration `20260720120000`): 1 registro
  **versionado** por tipo de asset (`video` | `ebook` | `mindmap`),
  `params` em JSONB. **Só 1 versão ativa por tipo** (unique parcial);
  aprovar uma alteração desativa a vigente e grava a nova — o histórico
  inteiro fica na tabela (auditável e reversível: reativar uma versão
  antiga é um update).
- **Seed v1 = os defaults REAIS extraídos do código** (legenda 32px/1.35
  no rodapé com keyword goldenrod; Ebook corpo 13px/1.5, margem 40;
  mapa sem poda de profundidade) — "sem alteração" gera exatamente o que
  sempre gerou.
- **Os geradores leem o config na hora de gerar** (nada hardcoded):
  `lib/generation/config.ts` → `lerConfigAtivo(tipo)` (com cache de 60s
  e fallback aos defaults se o banco estiver fora);
  `gerarPdfDoLearn(learn, saida, params)` agora monta o CSS a partir dos
  params; `mermaidMindmapParaMarkdown(src, profundidadeMaxima)` poda
  níveis; os params de vídeo (legenda/intro/outro) entram nas props do
  Remotion pela esteira.
- **Gate de segurança**: schemas zod `.strict()` com limites por
  parâmetro — a IA não consegue inventar chave nova nem, por exemplo,
  baixar o piso de 7 minutos (min 420 no schema). Instrução fora do
  vocabulário → validação falha → nada muda.

## Fluxo GERAL (Admin → Alterações via IA)

1. Seleciona o tipo (Video Overview | Ebooks | Mapas Mentais) e escreve
   em português ("legenda maior nos vídeos").
2. A IA devolve params novos + explicação; gravamos como `preview` no
   `alteracoes_log`. O admin vê **amostra visual antes/depois**
   (frame de vídeo com a legenda no tamanho novo / página de Ebook com o
   espaçamento novo / árvore do mapa com a profundidade nova) + o JSON.
3. **Aprovar** → `criarNovaVersao()` → vale pra TODA geração futura
   daquele tipo. **Descartar** → nada muda.

Nota honesta sobre o preview: a amostra do admin é uma prévia FIEL dos
parâmetros (mesmos valores aplicados num exemplar estático), não o asset
renderizado pelo pipeline — renderizar 1 frame real do Remotion exige o
compute da esteira (Actions), não roda no serverless da Vercel. O
efeito real aparece na primeira geração após a aprovação.

## Fluxo INDIVIDUAL (chatbot por Learn)

- Botão "Alterar este conteúdo (IA)" em cada Learn (gestão e fila de
  revisão) abre um chat mínimo dedicado àquele item (campo + histórico).
- A IA devolve `{campos, regenerar, resposta}`: mudanças de
  título/descrição são aplicadas NA HORA só naquele learn; correções que
  exigem reprocessar assets marcam `regenerar: ["video", ...]` no
  `alteracoes_log` (status `aplicada`) — a esteira reprocessa esses
  assets no próximo ciclo. Nunca toca o config geral.

## Motor e economia de tokens (regras do prompt, implementadas)

- **Mesmo OpenRouter** já integrado — nenhum provedor novo.
- **Separação por complexidade**: alterações usam
  `google/gemini-2.5-flash-lite` (US$0,10/M in, US$0,40/M out;
  configurável via `OPENROUTER_MODEL_ALTERACOES`); a estruturação de
  episódio segue no gemini-2.5-flash robusto.
- **Contexto mínimo**: alteração geral envia SÓ o config atual (~200
  tokens) + instrução — nunca transcrição/conteúdo; individual envia só
  título/resumo do learn + a conversa.
- **Cache**: config ativo cacheado 60s em memória (não rebusca a cada
  interação).

## Custo por alteração (estimativa p/ acompanhamento)

| Fluxo | Tokens típicos (in/out) | Custo |
|---|---|---|
| Geral (mudança de parâmetro) | ~600 / ~400 | **< US$ 0,001** (fração de centavo) |
| Individual (chat, por mensagem) | ~800 / ~300 | **< US$ 0,001** |

Os tokens reais de cada chamada ficam gravados no `alteracoes_log`
(colunas tokens_entrada/tokens_saida/modelo) e aparecem no histórico do
painel — o acompanhamento é por dado real, não só estimativa.

## Validação nesta sessão (e o que fica pro deploy)

- Migrations aplicadas no projeto AR ACADEMY + versionadas; seed v1
  conferido.
- Build de produção verde com todo o fluxo (painel, chat, APIs).
- A chamada real ao OpenRouter das alterações **não pôde ser exercitada
  daqui** (egress do sandbox bloqueia openrouter.ai — mesma limitação de
  sempre); o caminho é idêntico ao do cérebro já validado em CI (mesma
  API, mesmo formato, jsonrepair + zod). Primeiro uso real no deploy
  valida ponta a ponta — se algo falhar, o painel mostra o erro da API
  sem quebrar.
