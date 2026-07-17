import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export const dynamic = "force-dynamic";

// ADMIN BÁSICO — lista Learns e status (rascunho/em_revisao/publicado) e
// as últimas compras. Gate simples por token (?token= === ADMIN_TOKEN):
// suficiente pra primeira passada; auth de admin de verdade é evolução
// documentada no phase3_setup_log.md.
type Props = { searchParams: Promise<{ token?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const esperado = process.env.ADMIN_TOKEN;

  const Bloco = ({ children }: { children: React.ReactNode }) => (
    <main className="fundo-grid" style={{ minHeight: "100vh", padding: "40px 6vw" }}>
      <h1 style={{ fontWeight: 800, fontSize: 30 }}>
        Admin · <span style={{ color: "var(--goldenrod)" }}>Altamente Rentável Academy</span>
      </h1>
      {children}
    </main>
  );

  if (!esperado || token !== esperado) {
    return (
      <Bloco>
        <p style={{ color: "var(--dusty-grey)", marginTop: 16 }}>
          Acesso restrito. Abra com <code>?token=&lt;ADMIN_TOKEN&gt;</code>
          {!esperado ? " (ADMIN_TOKEN ainda não configurado no ambiente)" : ""}.
        </p>
      </Bloco>
    );
  }

  let learns: { id: string; slug: string; titulo: string; status: string; preco_centavos: number }[] = [];
  let compras: { id: string; status: string; valor: number; provedor: string; created_at: string }[] = [];
  let erroConexao: string | null = null;
  try {
    const supabase = createServiceRoleSupabaseClient();
    const l = await supabase.from("learns").select("id, slug, titulo, status, preco_centavos").order("created_at");
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
      {erroConexao ? (
        <p style={{ color: "#ff8a5c", marginTop: 16 }}>
          Supabase indisponível ({erroConexao}) — configure SUPABASE_URL/SERVICE_ROLE_KEY.
        </p>
      ) : (
        <>
          <h2 className="kicker" style={{ marginTop: 30 }}>Learns</h2>
          <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 12, background: "var(--dark-void)", borderRadius: 12 }}>
            <thead>
              <tr style={{ color: "var(--dusty-grey)" }}>
                <th style={celula}>Título</th><th style={celula}>Slug</th><th style={celula}>Status</th><th style={celula}>Preço</th>
              </tr>
            </thead>
            <tbody>
              {learns.map((l) => (
                <tr key={l.id}>
                  <td style={celula}>{l.titulo}</td>
                  <td style={{ ...celula, color: "var(--dusty-grey)" }}>{l.slug}</td>
                  <td style={{ ...celula, color: l.status === "publicado" ? "var(--goldenrod)" : "var(--dusty-grey)", fontWeight: 700 }}>{l.status}</td>
                  <td style={celula}>R$ {(l.preco_centavos / 100).toFixed(2).replace(".", ",")}</td>
                </tr>
              ))}
              {learns.length === 0 ? (
                <tr><td style={celula} colSpan={4}>Nenhum Learn cadastrado (rode o seed).</td></tr>
              ) : null}
            </tbody>
          </table>

          <h2 className="kicker" style={{ marginTop: 34 }}>Últimas compras</h2>
          <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 12, background: "var(--dark-void)", borderRadius: 12 }}>
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
          </table>
        </>
      )}
    </Bloco>
  );
}
