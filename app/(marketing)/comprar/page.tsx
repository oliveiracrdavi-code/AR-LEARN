"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// CHECKOUT — Altamente Rentável Academy. Fluxo: e-mail -> Checkout
// Session da Stripe (Pix; cartão como fallback temporário) -> página
// hospedada da Stripe exibe o QR do Pix -> volta em /comprar/aguardando
// -> webhook confirma e libera o acesso (RLS).
const LEARN_SLUG = "a-conta-que-ninguem-faz-ep-171";

export default function ComprarPage() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function comprar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnSlug: LEARN_SLUG, email }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.erro ?? "Falha ao iniciar o checkout");
      window.location.href = json.url;
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
      setCarregando(false);
    }
  }

  return (
    <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "28px 6vw" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image src="/logo-ar.jpg" alt="Altamente Rentável" width={48} height={48} style={{ borderRadius: 10 }} />
          <span style={{ fontWeight: 700 }}>
            Altamente Rentável <span style={{ color: "var(--goldenrod)" }}>Academy</span>
          </span>
        </Link>
      </header>

      <section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 6vw 60px" }}>
        <div className="cartao" style={{ maxWidth: 520, width: "100%", borderColor: "var(--goldenrod)" }}>
          <div className="kicker">Checkout · Episódio 171</div>
          <h1 style={{ fontWeight: 800, fontSize: 30, marginTop: 12, lineHeight: 1.2 }}>
            A conta que ninguém faz antes de investir em imóvel
          </h1>
          <p style={{ color: "var(--dusty-grey)", marginTop: 12, lineHeight: 1.5 }}>
            Acesso vitalício ao Learn completo: vídeo (6:50), <strong style={{ color: "var(--off-white)" }}>Ebook</strong> e
            mapa mental interativo.
          </p>
          <div style={{ fontWeight: 800, fontSize: 40, color: "var(--goldenrod)", margin: "18px 0 6px" }}>
            R$ 127,48
          </div>
          <div style={{ color: "var(--dusty-grey)", fontSize: 14, marginBottom: 20 }}>
            Pagamento único · Pix (QR code gerado pela Stripe)
          </div>

          <form onSubmit={comprar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              Seu e-mail (o acesso é liberado nele)
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(251,251,251,0.25)",
                  background: "var(--black)",
                  color: "var(--off-white)",
                  fontSize: 16,
                  fontFamily: "inherit",
                }}
              />
            </label>
            <button type="submit" className="botao-goldenrod" disabled={carregando} style={{ justifyContent: "center", opacity: carregando ? 0.7 : 1 }}>
              {carregando ? "Abrindo o Pix..." : "Pagar com Pix →"}
            </button>
            {erro ? (
              <div style={{ color: "#ff8a5c", fontSize: 14, lineHeight: 1.4 }}>
                {erro}
              </div>
            ) : null}
          </form>

          <p style={{ color: "var(--dusty-grey)", fontSize: 12.5, marginTop: 18, lineHeight: 1.5 }}>
            Após o pagamento, a confirmação chega em instantes; o acesso é liberado
            automaticamente e enviado para o seu e-mail.
          </p>
        </div>
      </section>
    </main>
  );
}
