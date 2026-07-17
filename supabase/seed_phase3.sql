-- Seed Phase 3 (rodar 1x após as migrations): trilha/módulo/learn do
-- episódio 171 para o fluxo de checkout funcionar ponta a ponta.
insert into public.trilhas (slug, titulo, descricao, ordem)
values ('fundamentos', 'Fundamentos', 'Trilha de fundamentos do mercado imobiliário', 0)
on conflict (slug) do nothing;

insert into public.modulos (trilha_id, slug, titulo, ordem)
select t.id, 'mercado-imobiliario', 'Mercado Imobiliário', 0
from public.trilhas t where t.slug = 'fundamentos'
on conflict (trilha_id, slug) do nothing;

insert into public.learns (modulo_id, slug, titulo, resumo, status, preco_centavos, publicado_at)
select m.id,
       'a-conta-que-ninguem-faz-ep-171',
       'A conta que ninguém faz antes de investir em imóvel',
       'Guia prático com 3 dados-chave para calcular ROI real em imóveis: entrada, recorrência e custo por m².',
       'publicado', 12748, now()
from public.modulos m where m.slug = 'mercado-imobiliario'
on conflict (modulo_id, slug) do nothing;
