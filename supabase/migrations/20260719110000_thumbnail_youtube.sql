-- Thumbnail REAL do episódio do YouTube em cada card da vitrine (ordem
-- do prompt de finalização). A esteira captura snippet.thumbnails na
-- ingestão (maxres > standard > high > medium > default) e grava aqui;
-- o card aplica overlay escuro e tem fallback visual da marca.
alter table public.learns add column thumbnail_url text;

-- Backfill do ep. 171 (processado antes da exigência existir): URL
-- determinística do CDN do YouTube pro vídeo WyktmQKpL94. maxresdefault
-- pode não existir pra vídeos antigos — o card faz cascata client-side
-- (maxres -> hqdefault -> fallback da marca), e a esteira de segunda
-- (com a YOUTUBE_API_KEY) pode sobrescrever com a resolução confirmada
-- pela API.
update public.learns
  set thumbnail_url = 'https://i.ytimg.com/vi/WyktmQKpL94/maxresdefault.jpg'
  where slug = 'a-conta-que-ninguem-faz-ep-171';

-- Teaser público expõe a thumbnail (cards bloqueados também mostram).
drop view public.learns_publico;
create view public.learns_publico
  with (security_invoker = false)
  as
  select id, modulo_id, slug, titulo, resumo, ordem,
         duracao_segundos, publicado_at, preco_centavos, fixado_no_hero,
         thumbnail_url
  from public.learns
  where status = 'publicado';

grant select on public.learns_publico to anon, authenticated;
