import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { autorizado } from "./gate";
import {
  alternarHero,
  aprovarLearn,
  aprovarLearnsEmLote,
  atualizarLearn,
  concederAcesso,
  definirModoPublicacao,
  entrarAdmin,
  injetarEpisodio,
  rejeitarLearn,
  rejeitarLearnsEmLote,
  sairAdmin,
} from "./acoes";
import { AlteracoesPainel } from "./AlteracoesPainel";
import { ChatLearn } from "./ChatLearn";

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

type Props = {
  searchParams: Promise<{
    erro?: string;
    acesso?: string;
    revelar?: string;
    injecao?: string;
    qLearns?: string;
    statusLearns?: string;
    qUsuarios?: string;
  }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const { erro, acesso, revelar, injecao, qLearns, statusLearns, qUsuarios } = await searchParams;

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
  // Lista filtrada (busca/status) só pra seção "Learns — gestão" — a
  // `learns` acima fica sempre COMPLETA porque alimenta o lookup de
  // título em Compras/Usuários e a fila de "pendentes de revisão"; se
  // ela também fosse filtrada, um filtro de título quebraria essas
  // duas seções sem relação nenhuma com o filtro.
  let learnsGestao: typeof learns = [];
  let perfis: { id: string; email: string | null; created_at: string }[] = [];
  let fila: { youtube_video_id: string; titulo: string | null; status_pipeline: string; processado_em: string | null; prioridade: boolean }[] = [];
  let acessosAdmin: { ip: string | null; created_at: string }[] = [];
  let modoPublicacao = "revisao_manual";
  // Saúde da esteira (item novo): tamanho real da fila, última execução
  // com sucesso e erros nas últimas 24h — contagens direto no banco
  // (não sobre os 20 itens exibidos), pra valer em escala de 700 eps.
  let saudeEsteira = { pendentes: 0, ultimoSucesso: null as string | null, erros24h: 0 };

  const filtroLearns = (qLearns ?? "").trim();
  const filtroStatusLearns = statusLearns ?? "";
  const filtroUsuarios = (qUsuarios ?? "").trim();

  try {
    const supabase = createServiceRoleSupabaseClient();

    const colunasLearns = "id, slug, titulo, resumo, status, preco_centavos, fixado_no_hero, thumbnail_url, publicado_at";
    let queryLearnsGestao = supabase.from("learns").select(colunasLearns).order("created_at");
    if (filtroLearns) queryLearnsGestao = queryLearnsGestao.ilike("titulo", `%${filtroLearns}%`);
    if (filtroStatusLearns) queryLearnsGestao = queryLearnsGestao.eq("status", filtroStatusLearns);

    let queryUsuarios = supabase
      .from("perfis")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filtroUsuarios) queryUsuarios = queryUsuarios.ilike("email", `%${filtroUsuarios}%`);

    const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [c, l, lg, p, f, a, m, pendentesCount, erros24hCount, ultimoConcluido] = await Promise.all([
      supabase.from("compras").select("id, usuario_id, email, valor, status, provedor, created_at, aprovado_at, learn_id").order("created_at", { ascending: false }),
      supabase.from("learns").select(colunasLearns).order("created_at"),
      queryLearnsGestao,
      queryUsuarios,
      supabase.from("episodios_processados").select("youtube_video_id, titulo, status_pipeline, processado_em, prioridade").order("prioridade", { ascending: false }).order("created_at", { ascending: false }).limit(20),
      supabase.from("admin_access_log").select("ip, created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("plataforma_config").select("valor").eq("chave", "modo_publicacao").maybeSingle(),
      supabase.from("episodios_processados").select("id", { count: "exact", head: true }).eq("status_pipeline", "pendente"),
      supabase.from("episodios_processados").select("id", { count: "exact", head: true }).eq("status_pipeline", "erro").gte("created_at", desde24h),
      supabase.from("episodios_processados").select("processado_em").eq("status_pipeline", "concluido").order("processado_em", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (c.error) throw c.error;
    compras = (c.data ?? []) as Compra[];
    learns = l.data ?? [];
    learnsGestao = lg.data ?? [];
    perfis = p.data ?? [];
    fila = f.data ?? [];
    acessosAdmin = a.data ?? [];
    modoPublicacao = m.data?.valor ?? "revisao_manual";
    saudeEsteira = {
      pendentes: pendentesCount.count ?? 0,
      erros24h: erros24hCount.count ?? 0,
      ultimoSucesso: ultimoConcluido.data?.processado_em ?? null,
    };
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
        {injecao === "ok" ? <span className="chip" style={{ borderColor: "var(--goldenrod)", color: "var(--goldenrod)" }}>Episódio injetado com prioridade ✓</span> : null}
        {injecao === "invalido" ? <span className="chip" style={{ color: "#ff8a5c" }}>URL inválida — cole o link do vídeo do YouTube</span> : null}
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, flexWrap: "wrap", gap: 10 }}>
            <h3 className="kicker" style={{ margin: 0 }}>Últimas compras</h3>
            <a href="/api/admin/vendas/csv" className="chip">Exportar CSV de vendas ↓</a>
          </div>
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

          {/* ── CONFIGURAÇÕES: MODO DE PUBLICAÇÃO ── */}
          <h2 className="kicker" style={{ marginTop: 40 }}>Configurações</h2>
          <div className="cartao" style={{ marginTop: 14, padding: 20, maxWidth: 640 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Modo de publicação da esteira</p>
            <p style={{ color: "var(--dusty-grey)", fontSize: 13, marginTop: 6 }}>
              Revisão manual: tudo que a esteira gerar cai em “em revisão” na fila abaixo e
              só entra na vitrine depois do seu Aprovar. Automático: publica direto ao
              terminar. Ajustável a qualquer momento.
            </p>
            <form action={definirModoPublicacao} style={{ display: "flex", gap: 16, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, cursor: "pointer" }}>
                <input type="radio" name="modo" value="automatico" defaultChecked={modoPublicacao === "automatico"} /> Automático
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, cursor: "pointer" }}>
                <input type="radio" name="modo" value="revisao_manual" defaultChecked={modoPublicacao === "revisao_manual"} /> Revisão manual
                <span style={{ color: "var(--dusty-grey)", fontSize: 12 }}>(recomendado)</span>
              </label>
              <button type="submit" className="chip" style={{ cursor: "pointer", background: "transparent" }}>Salvar</button>
            </form>
          </div>

          {/* ── ALTERAÇÕES VIA IA (GERAL) ── */}
          <h2 className="kicker" style={{ marginTop: 40 }}>Alterações via IA</h2>
          <AlteracoesPainel />

          {/* ── FILA DE REVISÃO (aprovação manual, com aprovação em lote) ── */}
          {learns.some((l) => l.status === "em_revisao") ? (
            <>
              <h2 className="kicker" style={{ marginTop: 40 }}>Pendentes de revisão</h2>
              <p style={{ color: "var(--dusty-grey)", fontSize: 12.5, marginTop: 6 }}>
                Marque vários e use os botões de lote — essencial com o catálogo em ~700
                episódios, onde aprovar um por um não é viável.
              </p>
              {/* Form "fantasma": só declara o contexto pros checkboxes e
                  botões de lote abaixo, que se associam a ele via
                  form="form-lote-revisao" mesmo estando fora do DOM dele —
                  os forms individuais de cada item continuam à parte, sem
                  conflito (cada um só tem o PRÓPRIO learn_id). */}
              <form id="form-lote-revisao" style={{ display: "none" }} />
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button form="form-lote-revisao" formAction={aprovarLearnsEmLote} type="submit" className="botao-goldenrod" style={{ fontSize: 13.5, padding: "9px 20px" }}>
                  Aprovar selecionados → publicar
                </button>
                <button form="form-lote-revisao" formAction={rejeitarLearnsEmLote} type="submit" className="chip" style={{ cursor: "pointer", background: "transparent", color: "#ff8a5c" }}>
                  Rejeitar selecionados
                </button>
              </div>
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {learns.filter((l) => l.status === "em_revisao").map((l) => (
                  <div key={l.id} className="cartao" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", borderColor: "rgba(255,203,0,0.5)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input type="checkbox" form="form-lote-revisao" name="learn_ids" value={l.id} style={{ width: 18, height: 18, cursor: "pointer" }} aria-label={`Selecionar ${l.titulo}`} />
                      <div>
                        <strong>{l.titulo}</strong>
                        <span style={{ color: "var(--dusty-grey)", fontSize: 13, marginLeft: 10 }}>/{l.slug}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <form action={aprovarLearn}>
                        <input type="hidden" name="learn_id" value={l.id} />
                        <button type="submit" className="botao-goldenrod" style={{ fontSize: 13.5, padding: "9px 20px" }}>Aprovar → publicar</button>
                      </form>
                      <ChatLearn learnId={l.id} titulo={l.titulo} />
                      <form action={rejeitarLearn}>
                        <input type="hidden" name="learn_id" value={l.id} />
                        <button type="submit" className="chip" style={{ cursor: "pointer", background: "transparent", color: "#ff8a5c" }}>Rejeitar</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {/* ── GESTÃO DE LEARNS (CRUD) ── */}
          <h2 className="kicker" style={{ marginTop: 40 }}>Learns — gestão</h2>
          <form method="get" style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              name="qLearns"
              defaultValue={filtroLearns}
              placeholder="Buscar por título..."
              style={{ flex: "1 1 220px", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit", fontSize: 13.5 }}
            />
            <select name="statusLearns" defaultValue={filtroStatusLearns} style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit", fontSize: 13.5 }}>
              <option value="">Todos os status</option>
              <option value="rascunho">rascunho</option>
              <option value="em_revisao">em_revisao</option>
              <option value="publicado">publicado</option>
            </select>
            <button type="submit" className="chip" style={{ cursor: "pointer", background: "transparent" }}>Filtrar</button>
            {(filtroLearns || filtroStatusLearns) ? <a href="/admin" className="chip">Limpar</a> : null}
          </form>
          <div style={{ display: "grid", gap: 16, marginTop: 14 }}>
            {learnsGestao.map((l) => (
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
                <div style={{ marginTop: 12 }}>
                  <ChatLearn learnId={l.id} titulo={l.titulo} />
                </div>
              </div>
            ))}
            {learnsGestao.length === 0 ? (
              <p style={{ color: "var(--dusty-grey)" }}>
                {filtroLearns || filtroStatusLearns
                  ? "Nenhum Learn bate com o filtro."
                  : "Nenhum Learn cadastrado (rode o seed)."}
              </p>
            ) : null}
          </div>

          {/* ── USUÁRIOS / ACESSOS ── */}
          <h2 className="kicker" style={{ marginTop: 40 }}>Usuários e acessos</h2>
          <form method="get" style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              name="qUsuarios"
              defaultValue={filtroUsuarios}
              placeholder="Buscar por e-mail..."
              style={{ flex: "1 1 220px", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit", fontSize: 13.5 }}
            />
            <button type="submit" className="chip" style={{ cursor: "pointer", background: "transparent" }}>Filtrar</button>
            {filtroUsuarios ? <a href="/admin" className="chip">Limpar</a> : null}
          </form>
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
                <tr><td style={celula} colSpan={3}>{filtroUsuarios ? "Nenhum usuário bate com o filtro." : "Nenhum usuário cadastrado ainda."}</td></tr>
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

          {/* Saúde da esteira: item novo — visibilidade operacional sem
              custo, só consulta ao banco que já existe. */}
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            <StatCard rotulo="Na fila agora (pendentes)" valor={String(saudeEsteira.pendentes)} />
            <StatCard
              rotulo="Última execução com sucesso"
              valor={saudeEsteira.ultimoSucesso ? new Date(saudeEsteira.ultimoSucesso).toLocaleString("pt-BR") : "—"}
              detalhe={saudeEsteira.ultimoSucesso ? undefined : "nenhum episódio concluído ainda"}
            />
            <StatCard
              rotulo="Erros nas últimas 24h"
              valor={String(saudeEsteira.erros24h)}
              detalhe={saudeEsteira.erros24h > 0 ? "confira erro_log em episodios_processados" : "tudo certo"}
            />
          </div>

          {/* Injeção manual por URL: item novo — pula a ordem normal
              (mais novo primeiro) pra processar um episódio específico
              já na próxima execução da esteira. */}
          <div className="cartao" style={{ marginTop: 16, padding: 20, maxWidth: 640 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Injetar episódio com prioridade</p>
            <p style={{ color: "var(--dusty-grey)", fontSize: 13, marginTop: 6 }}>
              Cole a URL (ou o ID) de um vídeo do canal — ele entra/volta pra fila como
              pendente com prioridade e é pego antes dos demais na próxima execução, sem
              esperar o cron.
            </p>
            <form action={injetarEpisodio} style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <input
                name="url_video"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                style={{ flex: "1 1 280px", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--black)", color: "var(--off-white)", fontFamily: "inherit" }}
              />
              <button type="submit" className="botao-goldenrod" style={{ fontSize: 14, padding: "10px 22px" }}>
                Injetar com prioridade →
              </button>
            </form>
          </div>

          <div className="tabela-scroll" style={{ marginTop: 16 }}><table style={{ borderCollapse: "collapse", width: "100%", background: "var(--dark-void)", borderRadius: 12, minWidth: 560 }}>
            <thead>
              <tr style={{ color: "var(--dusty-grey)" }}>
                <th style={celula}>Episódio</th><th style={celula}>Vídeo</th><th style={celula}>Estágio</th><th style={celula}>Processado em</th>
              </tr>
            </thead>
            <tbody>
              {fila.map((f) => (
                <tr key={f.youtube_video_id}>
                  <td style={celula}>
                    {f.prioridade ? <span title="Prioridade" style={{ color: "var(--goldenrod)", marginRight: 6 }}>★</span> : null}
                    {f.titulo ?? "—"}
                  </td>
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
