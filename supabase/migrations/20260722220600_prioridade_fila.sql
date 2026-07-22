-- Injeção manual de episódio com prioridade (admin, Seção E da
-- auditoria final): permite pular a ordem normal (mais novo primeiro)
-- pra processar um episódio específico na próxima execução da esteira.
alter table public.episodios_processados
  add column prioridade boolean not null default false;
