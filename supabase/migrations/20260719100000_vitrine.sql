-- AR LEARN — Vitrine Netflix (área de membros)
-- Fileiras horizontais por RESULTADO, hero curável, progresso por
-- usuário. Trilha/Módulo continuam como estrutura de DADOS (nunca como
-- rótulo de navegação na UI) — ver docs/vitrine-arquitetura-log.md.

-- 1) Hero curado manualmente pelo admin (requisito de produto: a
--    Carozzo precisa poder fixar um Learn no destaque, sobrepondo o
--    algoritmo "mais recente").
alter table public.learns
  add column fixado_no_hero boolean not null default false;

-- 2) Progresso de visualização por usuário — alimenta "Continue de
--    onde parou", a barra de progresso nos cards e (agregado) o
--    "Em alta". O próprio player grava via upsert.
create table public.progresso_learns (
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  learn_id uuid not null references public.learns (id) on delete cascade,
  segundos_assistidos int not null default 0,
  duracao_segundos int,
  concluido boolean not null default false,
  atualizado_at timestamptz not null default now(),
  primary key (usuario_id, learn_id)
);

alter table public.progresso_learns enable row level security;

create policy "progresso_select_own"
  on public.progresso_learns for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "progresso_insert_own"
  on public.progresso_learns for insert
  to authenticated
  with check (usuario_id = auth.uid());

create policy "progresso_update_own"
  on public.progresso_learns for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- 3) Teaser público ganha as colunas que a vitrine precisa pros cards
--    BLOQUEADOS (duração, "novo", preço) — continua sem URL de ativo.
drop view public.learns_publico;
create view public.learns_publico
  with (security_invoker = false)
  as
  select id, modulo_id, slug, titulo, resumo, ordem,
         duracao_segundos, publicado_at, preco_centavos
  from public.learns
  where status = 'publicado';

grant select on public.learns_publico to anon, authenticated;

-- 4) "Em alta": agregado de audiência SEM dado pessoal (só contagem por
--    learn publicado). SECURITY DEFINER intencional — mesmo racional do
--    teaser, documentado pros advisors.
create view public.learns_em_alta
  with (security_invoker = false)
  as
  select l.id as learn_id, count(*)::int as espectadores
  from public.progresso_learns p
  join public.learns l on l.id = p.learn_id
  where l.status = 'publicado'
  group by l.id;

grant select on public.learns_em_alta to anon, authenticated;
