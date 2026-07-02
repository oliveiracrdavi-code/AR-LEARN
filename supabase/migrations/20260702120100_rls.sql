-- AR LEARN — RLS (Fase 0)
-- RLS ativo em todas as tabelas, sem exceção (Regra de Ouro).

alter table public.trilhas enable row level security;
alter table public.modulos enable row level security;
alter table public.learns enable row level security;
alter table public.episodios_processados enable row level security;
alter table public.perfis enable row level security;
alter table public.compras enable row level security;

-- ── trilhas / modulos ───────────────────────────────────────────────
-- Teaser de estrutura na landing: leitura pública.
create policy "trilhas_select_public"
  on public.trilhas for select
  to anon, authenticated
  using (true);

create policy "modulos_select_public"
  on public.modulos for select
  to anon, authenticated
  using (true);

-- ── learns ──────────────────────────────────────────────────────────
-- Tabela base NÃO é legível por anon nem por authenticated sem compra
-- aprovada, pois carrega os ativos completos (pdf_url, video_url,
-- mapa mental). Só quem comprou enxerga a linha inteira de um Learn
-- publicado.
create policy "learns_select_comprador"
  on public.learns for select
  to authenticated
  using (
    status = 'publicado'
    and exists (
      select 1 from public.compras c
      where c.usuario_id = auth.uid() and c.status = 'aprovado'
    )
  );

-- View de teaser para a landing/área pública: só colunas leves, só
-- Learns publicados. O dono da view (quem rodou a migration) tem
-- select na tabela base, então a view expõe o subconjunto mesmo sem
-- policy de anon em `learns` — a tabela base continua protegida.
create view public.learns_publico
  with (security_invoker = false)
  as
  select id, modulo_id, slug, titulo, resumo, ordem
  from public.learns
  where status = 'publicado';

grant select on public.learns_publico to anon, authenticated;

-- ── episodios_processados ──────────────────────────────────────────
-- Interno da esteira autônoma. Nenhuma policy para anon/authenticated
-- = acesso negado por padrão; só a service role (que ignora RLS) lê.

-- ── perfis ──────────────────────────────────────────────────────────
create policy "perfis_select_own"
  on public.perfis for select
  to authenticated
  using (id = auth.uid());

create policy "perfis_update_own"
  on public.perfis for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── compras ─────────────────────────────────────────────────────────
-- Usuário só lê as próprias compras. INSERT/UPDATE só via service role
-- (webhook do gateway de pagamento) — sem policy para authenticated/anon.
create policy "compras_select_own"
  on public.compras for select
  to authenticated
  using (usuario_id = auth.uid());
