# Migração de storage de vídeo — Supabase → Cloudflare R2

Data: 2026-07-21. Objetivo: resolver o limite de 1GB do Supabase Free
movendo só o VÍDEO renderizado pro Cloudflare R2 (10GB free + egress
zero pra sempre). Ebook (PDF) e mapa mental continuam no Supabase
Storage — pequenos, não estouram nada.

## O que mudou

| Peça | Antes | Depois |
|---|---|---|
| Upload de vídeo | `subirAtivoLearn` → bucket `learns` (Supabase Storage) | `subirVideoLearn` → bucket R2 (`lib/storage/r2.ts`, SDK `@aws-sdk/client-s3` — R2 fala S3 puro, sem lib específica da Cloudflare) |
| Upload de Ebook/mapa | Supabase Storage | **Inalterado** — mesma função `subirAtivoLearn` |
| Coluna de referência | `learns.video_url` = path no bucket Supabase | `learns.video_url` = **key** no bucket R2; nova coluna `learns.video_storage` (`'r2'` default / `'supabase'`) diz qual provedor resolver |
| Signed URL do player | `/api/learns/[slug]/ativos` → `storage.createSignedUrl` do Supabase | Mesma rota: se `video_storage='r2'` → `gerarUrlAssinadaR2` (presigned S3, mesma janela de **1h**); Ebook/mapa seguem no `createSignedUrl` do Supabase |
| CSP (`next.config.ts`) | `media-src` só Supabase | `media-src` inclui `*.r2.cloudflarestorage.com` (wildcard até o account_id chegar) |

## O que NÃO mudou (por design, conforme a regra "inegociável" do prompt)

- **Modelo de segurança idêntico**: presigned URL de duração curta (1h),
  gerada SOB DEMANDA, revalidando a compra do usuário a cada request. A
  rota `/api/learns/[slug]/ativos` continua fazendo a consulta ao `learn`
  com o token do usuário ANTES de gerar qualquer URL assinada — RLS
  decide se a linha existe; a assinatura (Supabase ou R2) só acontece
  depois. **Nenhum link direto/acesso público** em nenhum dos dois
  provedores.
- RLS, Auth, checkout: zero alteração.
- Bucket R2 **privado** (sem acesso público direto) — só via presigned
  URL gerada pelo backend, igual ao padrão que já existia.

## Migration aplicada

`supabase/migrations/20260721090000_video_storage_r2.sql` — coluna
`learns.video_storage text not null default 'r2' check (in ('r2',
'supabase'))`. Aplicada no projeto AR ACADEMY via MCP e versionada no
repo.

## Migração do vídeo do #171 — status real (honestidade)

O prompt pedia pra baixar o vídeo atual do Supabase Storage e subir pro
R2. **Conferido no banco antes de mexer em qualquer coisa**:

```
video_url do #171: null
ebook_url do #171: null
objetos no bucket 'learns': 0
```

**Não existe vídeo (nem Ebook) do #171 no Supabase Storage** — o passo
de upload real ficou pendente desde a Fase 3 (o vídeo v2 só existe
localmente em `scripts/output/`, nunca foi enviado; aguardava justamente
a chave do YouTube pra rodar a esteira ponta a ponta). **Não há nada pra
baixar/migrar/remover** neste momento — não é um passo pulado, é um
passo que não se aplica ainda.

**O que isso significa na prática**: quando o vídeo do #171 for
enviado pela primeira vez (manual via `npm run learn:subir-ativos` ou
pela esteira), ele **já nasce direto no R2** — não existe "vídeo antigo
no Supabase" pra remover depois. O item 5 do prompt (baixar → subir →
atualizar registro → validar → só então remover o antigo) fica
documentado aqui como **não aplicável ao #171** por esse motivo, e o
código já está no estado final que ele pediria como resultado.

## Pipeline de novos episódios (item 6 do prompt)

`scripts/processar-fila.ts` não sobe vídeo diretamente (isso é etapa do
workflow de render, que roda depois no Actions) — mas o elo final,
`subirAtivosDoLearn` (chamado por `npm run learn:subir-ativos`), **já
usa R2 para vídeo por padrão** desde este commit. Não há caminho no
código atual que mande vídeo novo pro Supabase Storage — só o `--video`
do CLI, que agora chama `subirVideoLearn` → R2. Confirmado por leitura
do código (não por teste com credencial real, que ainda não existe).

## Pendências (Davi)

- Credenciais R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`) — geradas no painel Cloudflare (R2 → Manage
  API Tokens). Sem elas: `subirVideoLearn` falha com erro claro
  ("R2 não configurado...") e **Ebook/mapa continuam subindo
  normalmente** — nada trava por causa do vídeo.
- Nome do bucket: usei `ar-learn-videos` (sugerido no prompt) como
  default em `R2_BUCKET_NAME` — trocável via env sem tocar código.
- Região: R2 não usa região no sentido S3 tradicional (`region: "auto"`
  no client) — decisão já embutida no código, nada a escolher.
- `.env.vercel` (bloco copy-paste, gitignored) atualizado com as 5 vars
  novas como placeholder "aguardando Davi gerar no painel".

## Validação nesta sessão

- Build de produção verde com o roteamento novo.
- Migration aplicada no projeto real (AR ACADEMY) e confirmada por
  consulta SQL.
- Checagem honesta do estado do Storage (acima) antes de reportar
  qualquer coisa como "migrado".
- Chamada real ao R2 **não pôde ser exercitada** (sem credenciais ainda
  + egress do sandbox bloqueia domínios externos de qualquer forma) —
  válida no primeiro upload real, com o mesmo padrão de erro claro que
  o resto do projeto usa quando uma credencial falta.
