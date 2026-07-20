import "server-only";
import { cookies } from "next/headers";

// Gate do admin — cookie httpOnly, comparação só server-side. O acesso
// por ?token= foi removido (ecoava o token no payload RSC — flagrado
// pelo teste automatizado; ver scripts/testar-admin-gate.ts).
export const COOKIE_ADMIN = "ar_admin";
export const VALIDADE_COOKIE_S = 60 * 60 * 8; // 8h

export async function autorizado(): Promise<boolean> {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado) return false;
  const jar = await cookies();
  return jar.get(COOKIE_ADMIN)?.value === esperado;
}
