"use client";

// Alteração GERAL via IA — editor da "receita de geração" por linguagem
// natural: escolhe o tipo, escreve o que quer mudar, a IA devolve o
// preview (antes/depois + amostra visual) e NADA é aplicado até o
// Aprovar. Aprovado = nova versão do generation_config, vale pra toda
// geração futura daquele tipo.
import { useEffect, useState } from "react";

type Preview = {
  id: string;
  params_atuais: Record<string, unknown>;
  versao_atual: number;
  params_propostos: Record<string, unknown>;
  explicacao: string;
};

type ItemHistorico = {
  id: string;
  escopo: string;
  tipo_asset: string | null;
  instrucao: string;
  status: string;
  tokens_entrada: number | null;
  tokens_saida: number | null;
  created_at: string;
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1.5px solid rgba(251,251,251,0.2)",
  background: "var(--black)",
  color: "var(--off-white)",
  fontFamily: "inherit",
};

// Amostra visual do efeito — não é o asset final (esse regenera na
// esteira), é uma prévia fiel dos parâmetros pro admin decidir.
function Amostra({ tipo, params }: { tipo: string; params: Record<string, unknown> }) {
  if (tipo === "video") {
    const l = (params.legenda ?? {}) as Record<string, unknown>;
    return (
      <div style={{ aspectRatio: "16/9", background: "#020202", borderRadius: 10, position: "relative", overflow: "hidden", border: "1px solid rgba(251,251,251,0.15)" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(248,200,72,0.4)", fontWeight: 800, fontSize: 34 }}>AR</div>
        <div style={{ position: "absolute", left: "6%", right: "6%", [String(l.posicao) === "centro" ? "top" : "bottom"]: String(l.posicao) === "centro" ? "42%" : "7%", textAlign: "center", fontWeight: 500, fontSize: Number(l.tamanho_fonte ?? 32) * 0.55, lineHeight: Number(l.altura_linha ?? 1.35), color: String(l.cor_texto ?? "#EDEBE6") }}>
          A conta considera <span style={{ color: String(l.cor_palavra_chave ?? "#F8C848"), fontWeight: 700 }}>entrada de 35-40%</span> do valor
        </div>
      </div>
    );
  }
  if (tipo === "ebook") {
    const corpo = (params.corpo ?? {}) as Record<string, unknown>;
    return (
      <div style={{ background: "#fff", color: "#1a1a1a", borderRadius: 10, padding: Number(params.margem_px ?? 40) * 0.5, maxHeight: 240, overflow: "hidden" }}>
        <div style={{ fontWeight: 800, fontSize: Number(params.titulo_px ?? 24) * 0.8 }}>A conta que ninguém faz</div>
        <div style={{ fontWeight: 700, fontSize: Number(params.subtitulo_px ?? 17) * 0.8, marginTop: Number(params.espaco_entre_secoes_px ?? 24) * 0.5 }}>Entrada: o número crítico</div>
        <p style={{ fontSize: Number(corpo.tamanho_fonte_px ?? 13) * 0.9, lineHeight: Number(corpo.altura_linha ?? 1.5), marginTop: 6 }}>
          A entrada de 35-40% define se o financiamento trabalha a favor ou contra o
          investidor. Abaixo disso, os juros consomem a margem da operação.
        </p>
      </div>
    );
  }
  const prof = (params.profundidade_maxima ?? null) as number | null;
  const niveis = ["ROI real", "Entrada 35-40%", "Custo da parcela", "Impacto no yield", "Cenário pessimista"];
  return (
    <div style={{ background: "var(--black)", borderRadius: 10, padding: 16, border: "1px solid rgba(251,251,251,0.15)", fontSize: 13 }}>
      {niveis.slice(0, prof ?? niveis.length).map((n, i) => (
        <div key={n} style={{ marginLeft: i * 18, color: i === 0 ? "var(--goldenrod)" : "var(--off-white)", fontWeight: i === 0 ? 700 : 500, marginTop: 4 }}>
          {"— "}{n}
        </div>
      ))}
      <p style={{ color: "var(--dusty-grey)", marginTop: 10, fontSize: 12 }}>
        Profundidade máxima: {prof ?? "sem limite"}
      </p>
    </div>
  );
}

export function AlteracoesPainel() {
  const [tipo, setTipo] = useState("video");
  const [instrucao, setInstrucao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);

  async function carregarHistorico() {
    const r = await fetch("/api/admin/alteracoes");
    if (r.ok) setHistorico((await r.json()).alteracoes ?? []);
  }
  useEffect(() => {
    carregarHistorico().catch(() => {});
  }, []);

  async function gerarPreview() {
    setCarregando(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await fetch("/api/admin/alteracoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, instrucao }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.erro ?? "falhou");
      setPreview(json);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  async function decidir(decisao: "aprovar" | "descartar") {
    if (!preview) return;
    setCarregando(true);
    try {
      const r = await fetch("/api/admin/alteracoes/decidir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preview.id, decisao }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.erro ?? "falhou");
      setAviso(
        decisao === "aprovar"
          ? `Aprovada — virou a versão v${json.versao} da receita de ${tipo}; vale pra toda geração futura.`
          : "Descartada — nada mudou."
      );
      setPreview(null);
      setInstrucao("");
      carregarHistorico().catch(() => {});
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="cartao" style={{ marginTop: 14, padding: 22 }}>
      <p style={{ fontWeight: 700, fontSize: 15 }}>Alteração geral (afeta TODA geração futura)</p>
      <p style={{ color: "var(--dusty-grey)", fontSize: 13, marginTop: 6 }}>
        Descreva em português o que quer mudar na receita de geração. A IA mostra o preview —
        nada é aplicado sem o seu Aprovar. Ex.: “legenda maior nos vídeos”, “Ebook com mais
        espaço entre parágrafos”, “mapa mental com menos níveis”.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ ...input, flex: "0 0 180px" }}>
          <option value="video">Video Overview</option>
          <option value="ebook">Ebooks</option>
          <option value="mindmap">Mapas Mentais</option>
        </select>
        <input
          value={instrucao}
          onChange={(e) => setInstrucao(e.target.value)}
          placeholder="O que você quer mudar?"
          style={{ ...input, flex: "1 1 280px" }}
        />
        <button
          onClick={gerarPreview}
          disabled={carregando || !instrucao.trim()}
          className="botao-goldenrod"
          style={{ fontSize: 14, padding: "10px 22px", opacity: carregando || !instrucao.trim() ? 0.6 : 1 }}
        >
          {carregando ? "Gerando preview..." : "Gerar preview →"}
        </button>
      </div>

      {erro ? <p style={{ color: "#ff8a5c", marginTop: 12, fontSize: 14 }}>{erro}</p> : null}
      {aviso ? <p style={{ color: "var(--goldenrod)", marginTop: 12, fontSize: 14 }}>{aviso}</p> : null}

      {preview ? (
        <div style={{ marginTop: 18, borderTop: "1px solid rgba(135,135,135,0.25)", paddingTop: 18 }}>
          <p style={{ fontSize: 14 }}>
            <strong style={{ color: "var(--goldenrod)" }}>IA:</strong> {preview.explicacao}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 14 }}>
            <div>
              <p className="kicker" style={{ fontSize: 10 }}>Antes (v{preview.versao_atual})</p>
              <div style={{ marginTop: 8 }}><Amostra tipo={tipo} params={preview.params_atuais} /></div>
            </div>
            <div>
              <p className="kicker" style={{ fontSize: 10, color: "var(--goldenrod)" }}>Depois (proposta)</p>
              <div style={{ marginTop: 8 }}><Amostra tipo={tipo} params={preview.params_propostos} /></div>
            </div>
          </div>
          <details style={{ marginTop: 12 }}>
            <summary style={{ color: "var(--dusty-grey)", fontSize: 13, cursor: "pointer" }}>Ver parâmetros (JSON antes/depois)</summary>
            <pre style={{ fontSize: 11.5, color: "var(--dusty-grey)", overflowX: "auto", marginTop: 8 }}>
              {JSON.stringify({ antes: preview.params_atuais, depois: preview.params_propostos }, null, 2)}
            </pre>
          </details>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => decidir("aprovar")} disabled={carregando} className="botao-goldenrod" style={{ fontSize: 14, padding: "10px 22px" }}>
              Aprovar — vira regra permanente
            </button>
            <button onClick={() => decidir("descartar")} disabled={carregando} className="chip" style={{ cursor: "pointer", background: "transparent" }}>
              Descartar
            </button>
          </div>
        </div>
      ) : null}

      {historico.length > 0 ? (
        <details style={{ marginTop: 18 }}>
          <summary style={{ color: "var(--dusty-grey)", fontSize: 13, cursor: "pointer" }}>
            Histórico de alterações ({historico.length})
          </summary>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {historico.map((h) => (
              <p key={h.id} style={{ fontSize: 12.5, color: "var(--dusty-grey)" }}>
                {new Date(h.created_at).toLocaleString("pt-BR")} · {h.escopo}
                {h.tipo_asset ? `/${h.tipo_asset}` : ""} ·{" "}
                <span style={{ color: h.status === "aprovada" || h.status === "aplicada" ? "var(--goldenrod)" : undefined }}>{h.status}</span>{" "}
                · “{h.instrucao.slice(0, 80)}” · {(h.tokens_entrada ?? 0) + (h.tokens_saida ?? 0)} tokens
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
