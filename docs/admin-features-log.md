# Admin operacional — o que foi implementado

Data: 2026-07-20. Objetivo: a Carozzo/AR opera o dia a dia sem mexer em
código. Tudo na paleta travada (Dark Void + Goldenrod), zero admin
genérico. Migration `20260720100000_admin_operacional` aplicada no
projeto e versionada (compras.email, provedor `manual`,
`admin_access_log` service-role-only).

## 1. Dashboard de vendas (peça central)

- **Receita total** (soma das compras `aprovado`) + **7/30 dias** com
  contagem de compras por período.
- **Gráfico de receita por dia** (últimos 30) — barras CSS puras na
  goldenrod, sem lib de chart (leve e na identidade).
- **Taxa de conversão do checkout** — habilitada DESDE JÁ: toda tentativa
  de checkout grava uma compra `pendente` (= iniciado) e o webhook
  promove a `aprovado` (= completado); conversão = aprovados/iniciados.
  A coluna `compras.email` agora é preenchida no início do checkout, não
  só na aprovação.
- **Últimas compras**: quando, e-mail (mascarado por padrão — LGPD),
  Learn, valor, provedor, status.
- Verificação com dados REAIS do banco (via SQL no projeto): receita
  R$ 0, 0 checkouts, 1 learn publicado — exatamente o estado atual;
  os cards/gráfico ligam sozinhos com as primeiras vendas.

## 2. Gestão de Learns (CRUD)

Por Learn: editar **título, descrição, preço (R$), status**
(rascunho/em_revisao/publicado — publicar preenche `publicado_at`) e
**override manual da thumbnail** (URL; vazio = fallback da marca) — o
caso "automação pegou imagem ruim" resolvido sem código. Botão
**Fixar no hero / remover** (requisito da vitrine) mantido.

## 3. Usuários e acessos

- Lista de usuários (e-mail mascarado por padrão) com **quais Learns
  cada um tem acesso** (via compras aprovadas).
- **Conceder acesso manual**: e-mail + Learn → cria/acha o usuário
  (mesmo caminho do webhook), registra compra `manual` de R$ 0
  aprovada; o aluno entra por magic link. Casos reais: cortesia,
  pagamento por fora, ajuste de suporte.

## 4. Log de acesso ao admin

Tabela `admin_access_log` (RLS ligado sem policy = só service role).
Cada login bem-sucedido grava timestamp + IP + user-agent (melhor
esforço — falha de log não trava o login). Últimos 8 exibidos no rodapé
do painel.

## 5. Fila de conteúdo (esteira)

View da `episodios_processados`: episódio, vídeo, estágio do pipeline
(pendente → transcrevendo → estruturando → gerando_ativos → concluido) e
data. Vazia hoje; preenche sozinha quando a YOUTUBE_API_KEY chegar. Os
campos existentes cobrem os estágios — nenhum dado inventado.

## LGPD no admin

E-mails **mascarados por padrão** (`jo***@dominio`) em compras e
usuários — prints de tela não vazam dado pessoal. Botão
"Revelar e-mails" quando precisar do completo (a página inteira já está
atrás do gate + o toggle fica registrado na URL do admin).

## Screenshots

`scripts/output/admin_final/` (entregues no chat): gate de acesso,
painel logado. Observação honesta: no sandbox o painel mostra o estado
gracioso "Supabase indisponível" porque a rede daqui não alcança o
banco — as seções com dados foram validadas por consulta SQL direta no
projeto (mesmas queries da página) e renderizam no deploy.
