"use client";

// Alteração INDIVIDUAL — chatbot mínimo dedicado a UM Learn (campo de
// texto + histórico). A IA aplica mudanças de campos na hora e marca os
// assets afetados pra regeneração na esteira; não toca no config geral.
import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatLearn({ learnId, titulo }: { learnId: string; titulo: string }) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || carregando) return;
    const novas: Msg[] = [...mensagens, { role: "user", content: conteudo }];
    setMensagens(novas);
    setTexto("");
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/learns/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnId, mensagens: novas }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.erro ?? "falhou");
      const sufixo =
        json.regenerar?.length > 0
          ? ` (marquei pra regenerar: ${json.regenerar.join(", ")} — a esteira reprocessa no próximo ciclo)`
          : "";
      setMensagens([...novas, { role: "assistant", content: `${json.resposta}${sufixo}` }]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="chip" style={{ cursor: "pointer", background: "transparent" }}>
        Alterar este conteúdo (IA)
      </button>
    );
  }

  return (
    <div style={{ marginTop: 12, border: "1px solid rgba(255,203,0,0.35)", borderRadius: 12, padding: 14, background: "var(--black)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 700 }}>
          Alterando: <span style={{ color: "var(--goldenrod)" }}>{titulo}</span>
        </p>
        <button onClick={() => setAberto(false)} className="chip" style={{ cursor: "pointer", background: "transparent", fontSize: 12 }}>
          Fechar
        </button>
      </div>
      <div style={{ marginTop: 10, display: "grid", gap: 8, maxHeight: 220, overflowY: "auto" }}>
        {mensagens.length === 0 ? (
          <p style={{ color: "var(--dusty-grey)", fontSize: 13 }}>
            Descreva a mudança só deste Learn. Ex.: “o dado de recorrência está errado,
            deveria ser 22% não 25%”, “deixa o título mais direto”.
          </p>
        ) : null}
        {mensagens.map((m, i) => (
          <p key={i} style={{ fontSize: 13.5, color: m.role === "user" ? "var(--off-white)" : "var(--dusty-grey)" }}>
            <strong style={{ color: m.role === "user" ? "var(--goldenrod)" : undefined }}>
              {m.role === "user" ? "Você" : "IA"}:
            </strong>{" "}
            {m.content}
          </p>
        ))}
        {carregando ? <p style={{ color: "var(--dusty-grey)", fontSize: 13 }}>IA pensando...</p> : null}
      </div>
      {erro ? <p style={{ color: "#ff8a5c", fontSize: 13, marginTop: 8 }}>{erro}</p> : null}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="O que mudar neste Learn?"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(251,251,251,0.2)", background: "var(--dark-void)", color: "var(--off-white)", fontFamily: "inherit", fontSize: 14 }}
        />
        <button onClick={enviar} disabled={carregando || !texto.trim()} className="botao-goldenrod" style={{ fontSize: 14, padding: "10px 18px", opacity: carregando || !texto.trim() ? 0.6 : 1 }}>
          Enviar
        </button>
      </div>
    </div>
  );
}
