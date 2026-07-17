"use client";

// Erro global amigável (paleta travada) — nada de stack trace pro usuário.
export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 6vw" }}>
      <div className="cartao" style={{ maxWidth: 520, textAlign: "center", borderColor: "var(--goldenrod)" }}>
        <h1 style={{ fontWeight: 800, fontSize: 28 }}>
          Algo saiu do <span style={{ color: "var(--goldenrod)" }}>previsto</span>
        </h1>
        <p style={{ color: "var(--dusty-grey)", marginTop: 12, lineHeight: 1.5 }}>
          Estamos configurando esta parte da Academy. Tente novamente em instantes.
        </p>
        <button onClick={reset} className="botao-goldenrod" style={{ marginTop: 20 }}>
          Tentar de novo →
        </button>
      </div>
    </main>
  );
}
