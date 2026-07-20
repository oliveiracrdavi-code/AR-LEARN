-- AR LEARN — "Receita de geração" versionada + modo de publicação.
-- A alteração GERAL via IA não edita código: edita este config, que os
-- geradores (Remotion/PDF/mapa) LEEM na hora de gerar. Cada aprovação
-- cria uma NOVA versão (histórico completo, reversível) — nunca
-- sobrescreve sem rastro.

create table public.generation_config (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('video', 'ebook', 'mindmap')),
  versao int not null,
  params jsonb not null,
  -- de onde veio esta versão: seed inicial ou instrução do admin
  origem text not null default 'admin',
  instrucao_origem text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tipo, versao)
);

-- Só 1 versão ativa por tipo.
create unique index generation_config_ativo_unico
  on public.generation_config (tipo)
  where ativo;

-- Service-role only (esteira + admin server-side).
alter table public.generation_config enable row level security;

-- Preferências operacionais da plataforma (chave/valor). Primeira:
-- modo de publicação da esteira — ajustável no admin a qualquer momento.
create table public.plataforma_config (
  chave text primary key,
  valor text not null,
  atualizado_at timestamptz not null default now()
);

alter table public.plataforma_config enable row level security;

insert into public.plataforma_config (chave, valor)
values ('modo_publicacao', 'revisao_manual'); -- padrão recomendado

-- Seed v1 = os defaults REAIS extraídos do código atual (não valores
-- inventados) — garante que "sem alteração" gera exatamente o que o
-- pipeline já gerava.
insert into public.generation_config (tipo, versao, params, origem, instrucao_origem)
values
  ('video', 1, '{
    "legenda": {
      "tamanho_fonte": 32,
      "altura_linha": 1.35,
      "cor_texto": "#EDEBE6",
      "cor_palavra_chave": "#F8C848",
      "posicao": "rodape"
    },
    "duracao_minima_segundos": 420,
    "intro_segundos": 15,
    "outro_segundos": 15
  }'::jsonb, 'seed', 'defaults do código (LegendaSincronizada + dados.ts)'),
  ('ebook', 1, '{
    "corpo": { "tamanho_fonte_px": 13, "altura_linha": 1.5 },
    "titulo_px": 24,
    "subtitulo_px": 17,
    "margem_px": 40,
    "espaco_entre_secoes_px": 24
  }'::jsonb, 'seed', 'defaults do código (lib/pdf/gerarPdf.ts)'),
  ('mindmap', 1, '{
    "profundidade_maxima": null,
    "indentacao_por_nivel": 2,
    "formato_imagem": "svg"
  }'::jsonb, 'seed', 'defaults do código (lib/mapa-mental/converter.ts)');
