import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export const dynamic = "force-dynamic";

// ADMIN — gate por ADMIN_TOKEN com formulário + cookie de sessão
// httpOnly, SEM query param. O suporte a ?token= foi removido de
// propósito: além de vazar pra histórico/logs, o Next serializa
// searchParams no payload RSC do HTML — o teste automatizado flagrou o
// token ecoado na página (scripts/testar-admin-gate.ts, cenário 7).
// O valor do token nunca vai pro client: comparação só server-side,
// cookie httpOnly.
const COOKIE_ADMIN = "ar_admin";
const VALIDADE_COOKIE_S = 60 * 60 * 8; // 8h de sessão de admin

async function autorizado(): Promise<boolean> {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado) return false;
  const jar = await cookies();
  return jar.get(COOKIE_ADMIN)?.value === esperado;
}

async function entrarAdmin(formData: FormData) {
  "use server";
  const esperado = process.env.ADMIN_TOKEN;
  const tentativa = formData.get("senha");
  if (esperado && tentativa === esperado) {
    const jar = await cookies();
    jar.set(COOKIE_ADMIN, esperado, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: VALIDADE_COOKIE_S,
      path: "/",
    });
    redirect("/admin");
  }
  redirect("/admin?erro=1");
}

async function sairAdmin() {
  "use server";
  const jar = await cookies();
  jar.delete(COOKIE_ADMIN);
  redirect("/admin");
}

// Requisito de produto da vitrine: fixar manualmente o Learn do hero
// (promoção/lançamento sobrepõe o algoritmo). Só 1 fixado por vez.
async function alternarHero(formData: FormData) {
  "use server";
  if (!(await autorizado())) return;
  const learnId = formData.get("learn_id");
  const fixar = formData.get("fixar") === "1";
  if (typeof learnId !== "string") return;

  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("learns").update({ fixado_no_hero: false }).eq("fixado_no_hero", true);
  if (fixar) {
    await supabase.from("learns").update({ fixado_no_hero: true }).eq("id", learnId);
  }
  revalidatePath("/admin");
}

type Props = { searchParams: Promise<{ erro?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const { erro } = await searchParams;

  const Bloco = ({ children }: { children: React.ReactNode }) => (
    <main className="fundo-grid" style={{ minHeight: "100vh", padding: "40px 6vw" }}>
      <h1 style={{ fontWeight: 800, fontSize: 30 }}>
        Admin · <span style={{ color: "var(--goldenrod)" }}>Altamente Rentável Academy</span>
      </h1>
      {children}
    </main>
  );

  if (!(await autorizado())) {
    return (
      <Bloco>
        <div className="cartao" style={{ maxWidth: 440, marginTop: 28, borderColor: "var(--goldenrod)" }}>
          <p style={{ fontWeight: 700, fontSize: 17 }}>Acesso restrito</p>
          <p style={{ color: "var(--dusty-grey)", marginTop: 8, fontSize: 14.5 }}>
            Informe o token de administração para entrar.
            {!process.env.ADMIN_TOKEN
              ? " (ADMIN_TOKEN ainda não configurado no ambiente.)"
              : ""}
          </p>
          <form action={entrarAdmin} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              name="senha"
              required
              autoFocus
              placeholder="Token de administração"
              style={{ padding: "13px 15px", borderRadius: 12, border: "1.5px solid rgba(251,251,251,0.25)", background: "var(--black)", color: "var(--off-white)", fontSize: 15, fontFamily: "inherit" }}
            />
            <button type="submit" className="botao-goldenrod" style={{ justifyContent: "center" }}>
              Entrar no admin →
            </button>
          </form>
          {erro ? (
            <p style={{ marginTop: 12, fontSize: 14, color: "#ff8a5c" }}>
              Token incorreto — tente de novo.
            </p>
          ) : null}
        </div>
      </Bloco>
    );
  }

  let learns: { id: string; slug: string; titulo: string; status: string; preco_centavos: number; fixado_no_hero: boolean }[] = [];
  let compras: { id: string; status: string; valor: number; provedor: string; created_at: string }[] = [];
  let erroConexao: string | null = null;
  try {
    const supabase = createServiceRoleSupabaseClient();
    const l = await supabase.from("learns").select("id, slug, titulo, status, preco_centavos, fixado_no_hero").order("created_at");
    if (l.error) throw l.error;
    learns = l.data ?? [];
    const c = await supabase
      .from("compras")
      .select("id, status, valor, provedor, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (c.error) throw c.error;
    compras = c.data ?? [];
  } catch (e) {
    erroConexao = e instanceof Error ? e.message : "erro de conexão";
  }

  const celula: React.CSSProperties = { padding: "10px 14px", borderBottom: "1px solid rgba(135,135,135,0.25)", textAlign: "left" };

  return (
    <Bloco>
      <form action={sairAdmin} style={{ marginTop: 10 }}>
        <button type="submit" className="chip" style={{ cursor: "pointer", background: "transparent" }}>
          Encerrar sessão de admin
        </button>
      </form>
      {erroConexao ? (
        <p style={{ color: "#ff8a5c", marginTop: 16 }}>
          Supabase indisponível ({erroConexao}) — configure SUPABASE_URL/SERVICE_ROLE_KEY.
        </p>
      ) : (
        <>
          <h2 className="kicker" style={{ marginTop: 30 }}>Learns</h2>
          <div className="tabela-scroll" style={{ marginTop: 12 }}><table style={{ borderCollapse: "collapse", width: "100%", background: "var(--dark-void)", borderRadius: 12, minWidth: 560 }}>
            <thead>
              <tr style={{ color: "var(--dusty-grey)" }}>
                <th style={celula}>Título</th><th style={celula}>Slug</th><th style={celula}>Status</th><th style={celula}>Preço</th><th style={celula}>Hero</th>
              </tr>
            </thead>
            <tbody>
              {learns.map((l) => (
                <tr key={l.id}>
                  <td style={celula}>{l.titulo}</td>
                  <td style={{ ...celula, color: "var(--dusty-grey)" }}>{l.slug}</td>
                  <td style={{ ...celula, color: l.status === "publicado" ? "var(--goldenrod)" : "var(--dusty-grey)", fontWeight: 700 }}>{l.status}</td>
                  <td style={celula}>R$ {(l.preco_centavos / 100).toFixed(2).replace(".", ",")}</td>
                  <td style={celula}>
                    <form action={alternarHero}>
                      <input type="hidden" name="learn_id" value={l.id} />
                      <input type="hidden" name="fixar" value={l.fixado_no_hero ? "0" : "1"} />
                      <button
                        type="submit"
                        className="chip"
                        style={{
                          cursor: "pointer",
                          background: "transparent",
                          borderColor: l.fixado_no_hero ? "var(--goldenrod)" : undefined,
                          color: l.fixado_no_hero ? "var(--goldenrod)" : undefined,
                        }}
                      >
                        {l.fixado_no_hero ? "★ Fixado — soltar" : "Fixar no hero"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {learns.length === 0 ? (
                <tr><td style={celula} colSpan={5}>Nenhum Learn cadastrado (rode o seed).</td></tr>
              ) : null}
            </tbody>
          </table></div>

          <h2 className="kicker" style={{ marginTop: 34 }}>Últimas compras</h2>
          <div className="tabela-scroll" style={{ marginTop: 12 }}><table style={{ borderCollapse: "collapse", width: "100%", background: "var(--dark-void)", borderRadius: 12, minWidth: 560 }}>
            <thead>
              <tr style={{ color: "var(--dusty-grey)" }}>
                <th style={celula}>Quando</th><th style={celula}>Provedor</th><th style={celula}>Valor</th><th style={celula}>Status</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id}>
                  <td style={celula}>{new Date(c.created_at).toLocaleString("pt-BR")}</td>
                  <td style={celula}>{c.provedor}</td>
                  <td style={celula}>R$ {Number(c.valor).toFixed(2).replace(".", ",")}</td>
                  <td style={{ ...celula, color: c.status === "aprovado" ? "var(--goldenrod)" : "var(--dusty-grey)", fontWeight: 700 }}>{c.status}</td>
                </tr>
              ))}
              {compras.length === 0 ? (
                <tr><td style={celula} colSpan={4}>Nenhuma compra ainda.</td></tr>
              ) : null}
            </tbody>
          </table></div>
        </>
      )}
    </Bloco>
  );
}
