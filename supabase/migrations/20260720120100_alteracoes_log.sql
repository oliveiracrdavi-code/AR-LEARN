-- AR LEARN — histórico de alterações via IA (geral e individual).
-- Toda instrução do admin vira um registro: o preview fica em
-- 'preview' até ele aprovar (vira versão nova do generation_config, no
-- escopo geral) ou descartar. Também guarda a estimativa de tokens —
-- base do acompanhamento de custo pedido pelo Davi.

create table public.alteracoes_log (
  id uuid primary key default gen_random_uuid(),
  escopo text not null check (escopo in ('geral', 'individual')),
  tipo_asset text check (tipo_asset in ('video', 'ebook', 'mindmap')),
  learn_id uuid references public.learns (id) on delete set null,
  instrucao text not null,
  -- resultado estruturado: params propostos (geral) ou mudanças
  -- aplicadas no item (individual) + explicação da IA
  resultado jsonb,
  status text not null default 'preview'
    check (status in ('preview', 'aprovada', 'descartada', 'aplicada')),
  tokens_entrada int,
  tokens_saida int,
  modelo text,
  created_at timestamptz not null default now(),
  decidido_at timestamptz
);

create index alteracoes_log_learn_idx on public.alteracoes_log (learn_id);

-- Service-role only.
alter table public.alteracoes_log enable row level security;
