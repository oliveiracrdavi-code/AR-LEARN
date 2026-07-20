-- AR LEARN — Admin operacional (dashboard de vendas + gestão + auditoria)

-- 1) E-mail do comprador na compra: o dashboard precisa mostrar quem
--    comprou (mascarado por padrão, LGPD) e a compra 'pendente' nasce
--    sem usuário (guest checkout) — sem esta coluna o e-mail só existia
--    dentro da sessão do Stripe. Também habilita a taxa de conversão
--    (pendente = checkout iniciado; aprovado = completado).
alter table public.compras add column email text;

-- 2) Concessão manual de acesso (suporte real: pagou por fora, cortesia,
--    reembolso parcial). Novo provedor 'manual'.
alter table public.compras drop constraint compras_provedor_check;
alter table public.compras add constraint compras_provedor_check
  check (provedor in ('mercadopago', 'asaas', 'stripe', 'manual'));

-- 3) Log de acesso ao admin (auditoria simples: quando e de onde).
--    RLS ligado SEM policy = só service role lê/escreve (mesmo padrão
--    de episodios_processados, intencional).
create table public.admin_access_log (
  id uuid primary key default gen_random_uuid(),
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.admin_access_log enable row level security;
