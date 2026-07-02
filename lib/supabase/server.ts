import "server-only";

// Nunca importar este arquivo em componentes client. Sessão de usuário
// autenticado (cookies) entra na fase de Auth.
export { createServiceRoleSupabaseClient } from "./serviceRoleClient";
