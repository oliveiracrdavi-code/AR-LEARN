-- AR LEARN — Phase 3 "Altamente Rentável Academy"
-- Ajustes sobre o schema estabelecido (Fase 0) SEM renomear tabelas já
-- decididas (trilhas/modulos/learns/compras/perfis = users/episodes/
-- purchases/learn_content do escopo Phase 3, mapeamento documentado em
-- scripts/output/phase3_setup_log.md).

-- 1) Nomenclatura oficial: "PDF explicativo" não existe mais — é EBOOK.
alter table public.learns rename column pdf_url to ebook_url;

-- 2) Checkout via Stripe (decisão fechada: Pix via Stripe, não
--    Mercado Pago/Asaas — provedores antigos permanecem válidos no
--    histórico, mas novas compras usam 'stripe').
alter table public.compras drop constraint compras_provedor_check;
alter table public.compras add constraint compras_provedor_check
  check (provedor in ('mercadopago', 'asaas', 'stripe'));

-- Compra por Learn (fluxo Phase 3: seleciona episódio -> paga -> acesso
-- àquele Learn). learn_id nulo = compra global legada.
alter table public.compras
  add column learn_id uuid references public.learns (id) on delete set null;
create unique index compras_usuario_learn_unico
  on public.compras (usuario_id, learn_id)
  where status = 'aprovado' and learn_id is not null;

-- Metadados Stripe úteis pro webhook (idempotência por evento).
alter table public.compras add column stripe_checkout_session_id text;
create unique index compras_stripe_session_unica
  on public.compras (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- 3) Preço por Learn em centavos (fonte de verdade do checkout).
--    Default herda a decisão já registrada no schema (valor 127.48).
alter table public.learns add column preco_centavos int not null default 12748;

-- 4) RLS: compra por learn — comprador enxerga o Learn comprado OU tem
--    compra global aprovada (compat.). Substitui a policy antiga.
drop policy "learns_select_comprador" on public.learns;
create policy "learns_select_comprador"
  on public.learns for select
  to authenticated
  using (
    status = 'publicado'
    and exists (
      select 1 from public.compras c
      where c.usuario_id = auth.uid()
        and c.status = 'aprovado'
        and (c.learn_id = learns.id or c.learn_id is null)
    )
  );

-- Usuário autenticado pode ver as próprias compras (se ainda não houver).
do $$ begin
  create policy "compras_select_dono"
    on public.compras for select
    to authenticated
    using (usuario_id = auth.uid());
exception when duplicate_object then null; end $$;

-- 5) Guest checkout: a compra nasce 'pendente' sem usuário; o webhook
--    resolve/cria o usuário pelo e-mail e preenche usuario_id.
alter table public.compras alter column usuario_id drop not null;
