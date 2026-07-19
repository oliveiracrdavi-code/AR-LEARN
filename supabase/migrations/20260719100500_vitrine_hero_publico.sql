-- O hero da vitrine precisa saber qual Learn está fixado mesmo pra quem
-- ainda não comprou (card bloqueado no destaque) — expõe o flag no teaser.
drop view public.learns_publico;
create view public.learns_publico
  with (security_invoker = false)
  as
  select id, modulo_id, slug, titulo, resumo, ordem,
         duracao_segundos, publicado_at, preco_centavos, fixado_no_hero
  from public.learns
  where status = 'publicado';

grant select on public.learns_publico to anon, authenticated;
