"use client";

import { useState } from "react";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// ENTRAR — acesso do comprador por magic link (o webhook cria o usuário
// pelo e-mail da compra; aqui ele recebe o link de acesso).
export default function EntrarPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMsg("Link de acesso enviado! Confira seu e-mail.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro ao enviar o link");
    }
  }

  return (
    <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 6vw" }}>
      <div className="cartao" style={{ maxWidth: 460, width: "100%", textAlign: "center", borderColor: "var(--goldenrod)" }}>
        <Image src="/logo-ar.jpg" alt="Altamente Rentável Academy" width={64} height={64} style={{ borderRadius: 12, margin: "0 auto" }} />
        <h1 style={{ fontWeight: 800, fontSize: 26, marginTop: 16 }}>
          Entrar na <span style={{ color: "var(--goldenrod)" }}>Academy</span>
        </h1>
        <p style={{ color: "var(--dusty-grey)", marginTop: 10, fontSize: 15 }}>
          Use o e-mail da sua compra — enviaremos um link de acesso.
        </p>
        <form onSubmit={enviar} style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid rgba(251,251,251,0.25)", background: "var(--black)", color: "var(--off-white)", fontSize: 16, fontFamily: "inherit" }}
          />
          <button type="submit" className="botao-goldenrod" style={{ justifyContent: "center" }}>
            Enviar link de acesso →
          </button>
        </form>
        {msg ? <p style={{ marginTop: 14, fontSize: 14, color: "var(--off-white)" }}>{msg}</p> : null}
      </div>
    </main>
  );
}
