import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { autorizado } from "./gate";
import {
  alternarHero,
  atualizarLearn,
  concederAcesso,
  entrarAdmin,
  sairAdmin,
} from "./acoes";

export const dynamic = "force-dynamic";

// ADMIN OPERACIONAL — o painel que a Carozzo/AR usa no dia a dia sem
// depender de código: dashboard de vendas, CRUD de Learns, hero da
// vitrine, concessão de acesso, fila da esteira e log de acesso.
// Tudo na paleta travada (Dark Void + Goldenrod), nada de admin genérico.

type Compra = {
  id: string;
  usuario_id: string | null;
  email: string | null;
  valor: number;
  status: string;
  provedor: string;
  created_at: string;
  aprovado_at: string | null;
  learn_id: string | null;
};

// LGPD: e-mail mascarado por padrão na visualização (jo***@dominio) —
// reduz exposição de dado pessoal em prints; ?revelar=1 mostra completo
// (a página inteira já está atrás do gate do admin).
function mascarar(email: string | null): string {
  if (!email) return "—";
  const [usuario, dominio] = email.split("@");
  if (!dominio) return "***";
  return `${usuario.slice(0, 2)}***@${dominio}`;
}

function reais(v: number): string {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

const celula: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid rgba(135,135,135,0.25)",
  textAlign: "left",
  fontSize: 14,
};

function StatCard({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="cartao" style={{ padding: 22, minWidth: 200, flex: "1 1 200px" }}>
      <p className="kicker" style={{ fontSize: 11 }}>{rotulo}</p>
      <p style={{ fontWeight: 800, fontSize: 30, color: "var(--goldenrod)", marginTop: 8 }}>{valor}</p>
      {detalhe ? <p style={{ color: "var(--dusty-grey)", fontSize: 12.5, marginTop: 6 }}>{detalhe}</p> : null}
    </div>
  );
}

type Props = { searchParams: Promise<{ erro?: string; acesso?: string; revelar?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const { erro, acesso, revelar } = await searchParams;

  const Bloco = ({ children }: { children: React.ReactNode }) => (
    <main className="fundo-grid" style={{ minHeight: "100vh", padding: "40px 6vw 80px" }}>
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
            {!process.env.ADMIN_TOKEN ? " (ADMIN_TOKEN ainda não configurado no ambiente.)" : ""}
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
          {erro === "1" ? (
            <p style={{ marginTop: 12, fontSize: 14, color: "#ff8a5c" }}>Token incorreto — tente de novo.</p>
          ) : null}
          {erro === "limite" ? (
            <p style={{ marginTop: 12, fontSize: 14, color: "#ff8a5c" }}>
              Muitas tentativas — aguarde 15 minutos.
            </p>
          ) : null}
        </div>
      </Bloco>
    );
  }

  // ── Dados (service role, tudo server-side) ──────────────────────
  let erroConexao: string | null = null;
  let compras: Compra[] = [];
  let learns: {
    id: string; slug: string; titulo: string; resumo: string | null; status: string;
    preco_centavos: number; fixado_no_hero: boolean; thumbnail_url: string | null;
    publicado_at: string | null;
  }[] = [];
  let perfis: { id: string; email: string | null; created_at: string }[] = [];
  let fila: { youtube_video_id: string; titulo: string | null; status_pipeline: string; processado_em: string | null }[] = [];
  let acessosAdmin: { ip: string | null; created_at: string }[] = [];

  try {
    const supabase = createServiceRoleSupabaseClient();
    const [c, l, p, f, a] = await Promise.all([
      supabase.from("compras").select("id, usuario_id, email, valor, status, provedor, created_at, aprovado_at, learn_id").order("created_at", { ascending: false }),
      supabase.from("learns").select("id, slug, titulo, resumo, status, preco_centavos, fixado_no_hero, thumbnail_url, publicado_at").order("created_at"),
      supabase.from("perfis").select("id, email, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("episodios_processados").select("youtube_video_id, titulo, status_pipeline, processado_em").order("created_at", { ascending: false }).limit(20),
      supabase.from("admin_access_log").select("ip, created_at").order("created_at", { ascending: false }).limit(8),
    ]);
    if (c.error) throw c.error;
    compras = (c.data ?? []) as Compra[];
    learns = l.data ?? [];
    perfis = p.data ?? [];
    fila = f.data ?? [];
    acessosAdmin = a.data ?? [];
  } catch (e) {
    erroConexao = e instanceof Error ? e.message : "erro de conexão";
  }

  // ── Métricas ────────────────────────────────────────────────────
  const agora = Date.now();
  const dia = 86_400_000;
  const aprovadas = compras.filter((c) => c.status === "aprovado");
  const receitaTotal = aprovadas.reduce((s, c) => s + Number(c.valor), 0);
  const em = (dias: number, lista: Compra[]) =>
    lista.filter((c) => agora - new Date(c.aprovado_at ?? c.created_at).getTime() < dias * dia);
  const receita7 = em(7, aprovadas).reduce((s, c) => s + Number(c.valor), 0);
  const receita30 = em(30, aprovadas).reduce((s, c) => s + Number(c.valor), 0);
  // Conversão: toda tentativa de checkout nasce 'pendente' => iniciados
  // = todas as compras stripe; completados = aprovadas.
  const iniciadosStripe = compras.filter((c) => c.provedor === "stripe").length;
  const completadosStripe = aprovadas.filter((c) => c.provedor === "stripe").length;
  const conversao = iniciadosStripe > 0 ? Math.round((completadosStripe / iniciadosStripe) * 100) : null;

  // Gráfico: receita por dia (últimos 30), barras CSS puras.
  const porDia: number[] = Array.from({ length: 30 }, () => 0);
  for (const c of aprovadas) {
    const idx = Math.floor((agora - new Date(c.aprovado_at ?? c.created_at).getTime()) / dia);
    if (idx >= 0 && idx < 30) porDia[29 - idx] += Number(c.valor);
  }
  const maxDia = Math.max(...porDia, 1);

  const learnPorId = new Map(learns.map((l) => [l.id, l]));

  return (
    <Bloco>
      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <form action={sairAdmin}>
          <button type="submit" className="chip" style={{ cursor: "pointer", background: "transparent" }}>
            Encerrar sessão de admin
          </button>
        </form>
        <a className="chip" href={revelar === "1" ? "/admin" : "/admin?revelar=1"}>
          {revelar === "1" ? "Mascarar e-mails (LGPD)" : "Revelar e-mails"}
        </a>
        {acesso === "ok" ? <span className="chip" style={{ borderColor: "var(--goldenrod)", color: "var(--goldenrod)" }}>Acesso concedido ✓</span> : null}
        {acesso === "falhou" || acesso === "invalido" ? <span className="chip" style={{ color: "#ff8a5c" }}>Concessão falhou — confira o e-mail</span> : null}
      </div>

      {erroConexao ? (
        <p style={{ color: "#ff8a5c", marginTop: 16 }}>
          Supabase indisponível ({erroConexao}) — os dados aparecem quando o site roda com rede
          liberada pro banco (deploy/produção).
        </p>
      ) : (
        <>
          {/* ── DASHBOARD DE VENDAS ── */}
          <h2 className="kicker" style={{ marginTop: 34 }}>Dashboard de vendas</h2>
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            <StatCard rotulo="Receita total" valor={reais(receitaTotal)} detalhe={`${aprovadas.length} compra(s) confirmada(s)`} />
            <StatCard rotulo="Últimos 7 dias" valor={reais(receita7)} detalhe={`${em(7, aprovadas).length} compra(s)`} />
            <StatCard rotulo="Últimos 30 dias" valor={reais(receita30)} detalhe={`${em(30, aprovadas).length} compra(s)`} />
            <StatCard
              rotulo="Conversão do checkout"
              valor={conversao === null ? "—" : `${conversao}%`}
              detalhe={
                conversao === null
                  ? "sem checkouts iniciados ainda (pendente = iniciado, aprovado = completado)"
                  : `${completadosStripe}/${iniciadosStripe} checkouts completados`
              }
            />
          </div>

          <div className="cartao" style={{ marginTop: 18, padding: 22 }}>
            <p className="kicker" style={{ fontSize: 11 }}>Receita por dia — últimos 30</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90, marginTop: 14 }} aria-label="Gráfico de receita diária dos últimos 30 dias">
              {porDia.map((v, i) => (
                <div
                  key={i}
                  title={`${reais(v)}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(4, (v / maxDia) * 100)}%`,
                    background: v > 0 ? "var(--goldenrod)" : "rgba(251,251,251,0.10)",
                    borderRadius: 3,
                  }}
                />
              ))}
            </div>
            <p style={{ color: "var(--dusty-grey)", fontSize: 12, marginTop: 10 }}>
              Barras douradas = dias com receita confirmada. Sem vendas ainda: o gráfico liga
              sozinho quando o checkout entrar em produção.
            </p>
          </div>

          <h3 className="kicker" style={{ marginTop: 26 }}>Últimas compras</h3>
          <div className="tabela-scroll" style={{ marginTop: 12 }}><table style={{ borderCollapse: "collapse", width: "100%", background: "var(--dark-void)", borderRadius: 12, minWidth: 680 }}>
            <thead>
              <tr style={{ color: "var(--dusty-grey)" }}>
                <th style={celula}>Quando</th><th style={celula}>E-mail</th><th style={celula}>Learn</th><th style={celula}>Valor</th><th style={celula}>Provedor</th><th style={celula}>Status</th>
              </tr>
            </thead>
            <tbody>
              {compras.slice(0, 20).map((c) => (
                <tr key={c.id}>
                  <td style={celula}>{new Date(c.created_at).toLocaleString("pt-BR")}</td>
                  <td style={celula}>{revelar === "1" ? (c.email ?? "—") : mascarar(c.email)}</td>
                  <td style={celula}>{c.learn_id ? (learnPorId.get(c.learn_id)?.titulo ?? "—") : "acesso global"}</td>
                  <td style={celula}>{reais(Number(c.valor))}</td>
                  <td style={celula}>{c.provedor}</td>
                  <td style={{ ...celula, color: c.status === "aprovado" ? "var(--goldenrod)" : "var(--dusty-grey)", fontWeight: 700 }}>{c.status}</td>
                </tr>
              ))}
              {compras.length === 0 ? (
                <tr><td style={celula} colSpan={6}>Nenhuma compra ainda.</td></tr>
              ) : null}
            </tbody>
          </table></div>

          {/* ── GESTÃO DE LEARNS (CRUD) ── */}
          <h2 className="kicker" style={{ marginTop: 40 }}>Learns — gestão</h2>
          <div style={{ display: "grid", gap: 16, marginTop: 14 }}>
            {learns.map((l) => (
              <div key={l.id} className="cartao" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>{l.titulo}</strong>
                    <span style={{ color: "var(--dusty-grey)", fontSize: 13, marginLeft: 10 }}>/{l.slug}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="chip" style={{ fontSize: 12, color: l.status === "publicado" ? "var(--goldenrod)" : undefined, borderColor: l.status === "publicado" ? "var(--goldenrod)" : undefined }}>
                      {l.status}{l.publicado_at ? ` · ${new Date(l.publicado_at).toLocaleDateString("pt-BR")}` : ""}
                    </span>
                    <form action={alternarHero}>
                      <input type="hidden" name="learn_id" value={l.id} />
                      <input type="hidden" name="fixar" value={l.fixado_no_hero ? "0" : "1"} />
                      <button type="submit" className="chip" style={{ cursor: "pointer", background: "transparent", borderColor: l.fixado_no_hero ? "var(--goldenrod)" : undefined, color: l.fixado_no_hero ? "var(--goldenrod)" : undefined }}>
                        {l.fixado_no_hero ? "★ Fixado no hero — remover" : "Fixar no hero"}
                      </button>
                    </form>
                  </div>
                </div>
                <form action={atualizarLearn} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 16 }}>
                  <input type="hidden" name="learn_id" value={l.id} />
                  <label style={{ fontSize: 12.5, color: "var(--dusty-grey)" }}>
                    Título
                    <input name="titulo" defaultValue={l.titulo} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit" }} />
                  </label>
                  <label style={{ fontSize: 12.5, color: "var(--dusty-grey)" }}>
                    Preço (R$)
                    <input name="preco" defaultValue={(l.preco_centavos / 100).toFixed(2)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit" }} />
                  </label>
                  <label style={{ fontSize: 12.5, color: "var(--dusty-grey)" }}>
                    Status
                    <select name="status" defaultValue={l.status} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit" }}>
                      <option value="rascunho">rascunho</option>
                      <option value="em_revisao">em_revisao</option>
                      <option value="publicado">publicado</option>
                    </select>
                  </label>
                  <label style={{ fontSize: 12.5, color: "var(--dusty-grey)", gridColumn: "1 / -1" }}>
                    Descrição
                    <textarea name="resumo" defaultValue={l.resumo ?? ""} rows={2} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit", resize: "vertical" }} />
                  </label>
                  <label style={{ fontSize: 12.5, color: "var(--dusty-grey)", gridColumn: "1 / -1" }}>
                    Thumbnail (URL — override manual; vazio = fallback da marca)
                    <input name="thumbnail_url" defaultValue={l.thumbnail_url ?? ""} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit" }} />
                  </label>
                  <div>
                    <button type="submit" className="botao-goldenrod" style={{ fontSize: 14, padding: "10px 22px" }}>
                      Salvar alterações
                    </button>
                  </div>
                </form>
              </div>
            ))}
            {learns.length === 0 ? <p style={{ color: "var(--dusty-grey)" }}>Nenhum Learn cadastrado (rode o seed).</p> : null}
          </div>

          {/* ── USUÁRIOS / ACESSOS ── */}
          <h2 className="kicker" style={{ marginTop: 40 }}>Usuários e acessos</h2>
          <div className="tabela-scroll" style={{ marginTop: 12 }}><table style={{ borderCollapse: "collapse", width: "100%", background: "var(--dark-void)", borderRadius: 12, minWidth: 560 }}>
            <thead>
              <tr style={{ color: "var(--dusty-grey)" }}>
                <th style={celula}>E-mail</th><th style={celula}>Cadastro</th><th style={celula}>Learns com acesso</th>
              </tr>
            </thead>
            <tbody>
              {perfis.map((p) => {
                const doUsuario = aprovadas
                  .filter((c) => c.usuario_id === p.id)
                  .map((c) => (c.learn_id ? learnPorId.get(c.learn_id)?.titulo ?? "?" : "acesso global"));
                return (
                  <tr key={p.id}>
                    <td style={celula}>{revelar === "1" ? (p.email ?? "—") : mascarar(p.email)}</td>
                    <td style={celula}>{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                    <td style={celula}>{doUsuario.length > 0 ? doUsuario.join(" · ") : <span style={{ color: "var(--dusty-grey)" }}>nenhum</span>}</td>
                  </tr>
                );
              })}
              {perfis.length === 0 ? (
                <tr><td style={celula} colSpan={3}>Nenhum usuário cadastrado ainda.</td></tr>
              ) : null}
            </tbody>
          </table></div>

          <div className="cartao" style={{ marginTop: 16, padding: 20, maxWidth: 640 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Conceder acesso manual</p>
            <p style={{ color: "var(--dusty-grey)", fontSize: 13, marginTop: 6 }}>
              Pra suporte (cortesia, pagamento por fora): cria/acha o usuário pelo e-mail e
              libera o Learn (compra `manual`, R$ 0). O aluno entra por magic link em /entrar.
            </p>
            <form action={concederAcesso} style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <input name="email" type="email" required placeholder="email@do-aluno.com" style={{ flex: "1 1 220px", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit" }} />
              <select name="learn_id" required style={{ flex: "1 1 200px", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit" }}>
                {learns.map((l) => (
                  <option key={l.id} value={l.id}>{l.titulo}</option>
                ))}
              </select>
              <button type="submit" className="botao-goldenrod" style={{ fontSize: 14, padding: "10px 22px" }}>
                Conceder →
              </button>
            </form>
          </div>

          {/* ── FILA DE CONTEÚDO (esteira) ── */}
          <h2 className="kicker" style={{ marginTop: 40 }}>Fila de conteúdo (esteira do YouTube)</h2>
          <div className="tabela-scroll" style={{ marginTop: 12 }}><table style={{ borderCollapse: "collapse", width: "100%", background: "var(--dark-void)", borderRadius: 12, minWidth: 560 }}>
            <thead>
              <tr style={{ color: "var(--dusty-grey)" }}>
                <th style={celula}>Episódio</th><th style={celula}>Vídeo</th><th style={celula}>Estágio</th><th style={celula}>Processado em</th>
              </tr>
            </thead>
            <tbody>
              {fila.map((f) => (
                <tr key={f.youtube_video_id}>
                  <td style={celula}>{f.titulo ?? "—"}</td>
                  <td style={{ ...celula, color: "var(--dusty-grey)" }}>{f.youtube_video_id}</td>
                  <td style={{ ...celula, color: f.status_pipeline === "concluido" ? "var(--goldenrod)" : undefined, fontWeight: 600 }}>{f.status_pipeline}</td>
                  <td style={celula}>{f.processado_em ? new Date(f.processado_em).toLocaleString("pt-BR") : "—"}</td>
                </tr>
              ))}
              {fila.length === 0 ? (
                <tr><td style={celula} colSpan={4}>
                  Fila vazia — preenche sozinha quando a YOUTUBE_API_KEY chegar e a esteira
                  ingerir os episódios 172+.
                </td></tr>
              ) : null}
            </tbody>
          </table></div>

          {/* ── LOG DE ACESSO AO ADMIN ── */}
          <h2 className="kicker" style={{ marginTop: 40 }}>Últimos acessos ao admin</h2>
          <div className="tabela-scroll" style={{ marginTop: 12 }}><table style={{ borderCollapse: "collapse", width: "100%", background: "var(--dark-void)", borderRadius: 12, minWidth: 420 }}>
            <thead>
              <tr style={{ color: "var(--dusty-grey)" }}>
                <th style={celula}>Quando</th><th style={celula}>IP</th>
              </tr>
            </thead>
            <tbody>
              {acessosAdmin.map((a, i) => (
                <tr key={i}>
                  <td style={celula}>{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                  <td style={celula}>{a.ip ?? "—"}</td>
                </tr>
              ))}
              {acessosAdmin.length === 0 ? (
                <tr><td style={celula} colSpan={2}>Nenhum acesso registrado ainda.</td></tr>
              ) : null}
            </tbody>
          </table></div>
        </>
      )}
    </Bloco>
  );
}
