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

## Validação de conexão real — 2026-07-21 (credenciais entregues)

Credenciais recebidas e gravadas no `.env.local` (gitignored, confirmado)
e no `.env.vercel` (gitignored, bloco copy-paste). Rodei o teste de
ponta a ponta pedido (`scripts/testar-r2-conexao.ts`): upload → presigned
URL → download → confere expiração → delete.

**Resultado: FALHOU — mas o motivo é preciso e não é rede nem chave
errada.**

1. **Rede/egress**: OK. `curl -I` no `R2_ENDPOINT` devolveu
   `Server: cloudflare` + `CF-RAY` — é o R2 de verdade respondendo, não
   um bloqueio de proxy do sandbox (diferente do padrão visto com
   Supabase/OpenRouter em sessões anteriores).
2. **Autenticação**: as credenciais SÃO válidas — as requisições
   assinadas (SigV4) chegam e são processadas pelo R2 (erros
   estruturados de S3, não "chave inválida"/"assinatura não bate").
3. **Causa raiz, isolada com 3 chamadas diagnóstico diretas** (upload,
   `HeadBucket`, `ListObjectsV2`, `CreateBucket`, `ListBuckets`):

   | Chamada | Resultado |
   |---|---|
   | `PutObject` no bucket `ar-learn-videos` | `403 AccessDenied` |
   | `HeadBucket(ar-learn-videos)` | **`404 NotFound`** |
   | `ListObjectsV2(ar-learn-videos)` | **`404 NoSuchBucket` — "The specified bucket does not exist."** |
   | `CreateBucket(ar-learn-videos)` (tentei criar, já que é o passo 1 do prompt anterior) | `403 AccessDenied` |
   | `ListBuckets` (conta inteira) | `403 AccessDenied` |

   **O bucket `ar-learn-videos` não existe nesta conta R2**, e o token
   também não tem permissão de criar bucket nem listar buckets — está
   escopado só a operações de objeto (get/put/delete) dentro de um
   bucket que precisa já existir. Ou seja: falta **criar o bucket** (não
   é algo que eu consiga fazer com este token) — o passo 1 do prompt de
   migração original ("criar um bucket privado, ex.: ar-learn-videos")
   nunca foi executado por ninguém ainda, porque antes não havia
   credencial pra fazer isso via API, e parece que também não foi
   criado manualmente no dashboard.

**Não tentei contornar** (não inventei nome alternativo de bucket, não
mudei o código pra criar-e-tentar-de-novo automaticamente) — reportando
o erro exato, como pedido.

### O que precisa do Davi (uma das três)

1. **Criar o bucket manualmente**: Cloudflare Dashboard → R2 → Create
   bucket → nome `ar-learn-videos` → privado (sem acesso público). Depois
   disso as MESMAS credenciais já devem funcionar (é só permissão de
   objeto, que o token já tem) — não precisa gerar token novo.
2. **Ou**, se o bucket já existe com outro nome: me passar o nome real
   pra eu trocar `R2_BUCKET_NAME`.
3. **Ou**, se preferir que eu crie o bucket via API: reemitir o token
   com permissão "Admin Read & Write" (a atual parece ser "Object Read
   & Write", que não inclui gestão de bucket).

### Estado do código nesta sessão

- `.env.local` e `.env.vercel` atualizados com as credenciais reais
  (não são mais placeholder) — a única coisa pendente é a existência do
  bucket, não configuração.
- `scripts/testar-r2-conexao.ts` criado e versionado — reutilizável
  assim que o bucket existir (rodar de novo confirma tudo em segundos).
- Nenhum arquivo de teste ficou no bucket (nunca chegou a subir nada,
  falhou antes do upload completar).
- `subirVideoLearn`/`fila:processar`/`learn:subir-ativos` **ainda vão
  falhar** ao tentar subir vídeo — agora com o erro real do R2
  (`NoSuchBucket`/`AccessDenied`) em vez do guard antigo de "faltam as
  chaves". Ebook/mapa continuam 100% funcionais, sem depender disso.
