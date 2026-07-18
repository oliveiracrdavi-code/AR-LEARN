-- AR LEARN — Hardening pós-advisors (aplicado no projeto AR ACADEMY via MCP
-- em 2026-07-18; este arquivo mantém o repo == estado do banco).
--
-- Achados do get_advisors(security) e decisão:
-- 1. WARN function_search_path_mutable: funções de trigger sem search_path
--    fixo. Corrigido abaixo.
-- 2. WARN funções SECURITY DEFINER executáveis via RPC pelos roles públicos.
--    Corrigido abaixo (revoke) — são funções de trigger, nunca chamadas
--    diretamente pelo cliente.
-- 3. ERROR security_definer_view (learns_publico): INTENCIONAL — é o teaser
--    público com colunas leves (sem URLs de conteúdo); documentado na Fase 0.
-- 4. INFO rls_no_policy (episodios_processados): INTENCIONAL — tabela da
--    esteira de ingestão, acessada só com service role.

alter function public.set_updated_at() set search_path = public;
alter function public.handle_new_user() set search_path = public;

revoke execute on function public.set_updated_at() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
