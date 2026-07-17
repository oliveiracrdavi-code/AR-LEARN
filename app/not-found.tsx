import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 6vw" }}>
      <div className="cartao" style={{ maxWidth: 480, textAlign: "center" }}>
        <div className="kicker">404</div>
        <h1 style={{ fontWeight: 800, fontSize: 28, marginTop: 10 }}>Página não encontrada</h1>
        <p style={{ color: "var(--dusty-grey)", marginTop: 10 }}>
          O conteúdo pode estar sendo configurado ou o endereço mudou.
        </p>
        <Link href="/" className="botao-goldenrod" style={{ marginTop: 20 }}>
          Ir para a Academy →
        </Link>
      </div>
    </main>
  );
}
