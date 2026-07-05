-- AR LEARN — schema inicial (Fase 0)
-- Trilhas -> Módulos -> Learns, idempotência de ingestão e compras.

create extension if not exists pgcrypto;

-- ── trilhas ─────────────────────────────────────────────────────────
create table public.trilhas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  descricao text,
  ordem int not null default 0,
  capa_url text,
  created_at timestamptz not null default now()
);

-- ── modulos ─────────────────────────────────────────────────────────
create table public.modulos (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references public.trilhas (id) on delete cascade,
  slug text not null,
  titulo text not null,
  descricao text,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  unique (trilha_id, slug)
);

-- ── episodios_processados ──────────────────────────────────────────
-- Chave de idempotência da esteira autônoma (doc 3): nunca gerar Learn
-- duplicado para o mesmo vídeo do YouTube.
create table public.episodios_processados (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text unique not null,
  titulo text,
  data_publicacao_youtube timestamptz,
  status_pipeline text not null default 'pendente'
    check (status_pipeline in (
      'pendente', 'transcrevendo', 'estruturando', 'gerando_ativos',
      'concluido', 'erro'
    )),
  processado_em timestamptz,
  erro_log text,
  created_at timestamptz not null default now()
);

-- ── learns ──────────────────────────────────────────────────────────
create table public.learns (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos (id) on delete cascade,
  episodio_id uuid references public.episodios_processados (id),
  slug text not null,
  titulo text not null,
  resumo text,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_revisao', 'publicado')),
  pdf_url text,
  mapa_mental_json jsonb,
  mapa_mental_imagem_url text,
  video_url text,
  duracao_segundos int,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  publicado_at timestamptz,
  unique (modulo_id, slug)
);

-- referência de volta: qual Learn nasceu deste episódio
alter table public.episodios_processados
  add column learn_id uuid references public.learns (id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger learns_set_updated_at
  before update on public.learns
  for each row
  execute function public.set_updated_at();

-- ── perfis (espelha auth.users) ────────────────────────────────────
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email)
  values (new.id, new.raw_user_meta_data ->> 'nome', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── compras ─────────────────────────────────────────────────────────
-- Acesso vitalício por compra única (R$ 127,48), Pix via Mercado Pago
-- (principal) ou Asaas (alternativa). Implementação de código só na Fase 4.
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  valor numeric(10, 2) not null default 127.48,
  metodo_pagamento text,
  provedor text not null check (provedor in ('mercadopago', 'asaas')),
  provedor_transacao_id text,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'recusado', 'estornado')),
  created_at timestamptz not null default now(),
  aprovado_at timestamptz,
  unique (provedor, provedor_transacao_id)
);

create index compras_usuario_id_idx on public.compras (usuario_id);
