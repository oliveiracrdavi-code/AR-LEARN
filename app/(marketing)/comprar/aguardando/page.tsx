import Image from "next/image";
import Link from "next/link";

// Pós-checkout: o Pix confirma de forma assíncrona; o webhook da Stripe
// aprova a compra e o acesso é liberado no e-mail informado.
export default function AguardandoPage() {
  return (
    <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 6vw" }}>
      <div className="cartao" style={{ maxWidth: 560, textAlign: "center", borderColor: "var(--goldenrod)" }}>
        <Image src="/logo-ar.jpg" alt="Altamente Rentável Academy" width={72} height={72} style={{ borderRadius: 14, margin: "0 auto" }} />
        <h1 style={{ fontWeight: 800, fontSize: 30, marginTop: 20 }}>
          Pagamento em <span style={{ color: "var(--goldenrod)" }}>confirmação</span>
        </h1>
        <p style={{ color: "var(--dusty-grey)", marginTop: 14, lineHeight: 1.55 }}>
          Recebemos o seu Pix. Assim que a Stripe confirmar (normalmente em segundos),
          o acesso ao Learn — vídeo, Ebook e mapa mental — é liberado automaticamente
          no e-mail informado.
        </p>
        <Link href="/" className="botao-goldenrod" style={{ marginTop: 24 }}>
          Voltar ao início →
        </Link>
      </div>
    </main>
  );
}
