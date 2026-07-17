import Image from "next/image";
import Link from "next/link";

// LANDING — Altamente Rentável Academy. Hero no padrão "Manchete Premium"
// aprovado (grid black + logo + manchete XXL goldenrod + caixa de
// descrição), apresentação do episódio #171, player do vídeo v2, seção de
// Ebook + mapa mental e CTA de compra. Paleta travada da Phase 3.
const VIDEO_URL =
  process.env.NEXT_PUBLIC_EP171_VIDEO_URL ?? "/videos/ar_learn_171_16x9_final_v2.mp4";

const DADOS_CHAVE = [
  { label: "Entrada", valor: "35-40%", contexto: "Crítica" },
  { label: "Recorrência", valor: "+20-25%", contexto: "Determinante" },
  { label: "Custo m²", valor: "R$ 45.000", contexto: "Referência" },
];

export default function LandingPage() {
  return (
    <main className="fundo-grid" style={{ minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 6vw",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image src="/logo-ar.jpg" alt="Altamente Rentável" width={54} height={54} style={{ borderRadius: 10 }} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            Altamente Rentável <span style={{ color: "var(--goldenrod)" }}>Academy</span>
          </span>
        </div>
        <Link href="/comprar" className="botao-goldenrod" style={{ fontSize: 15, padding: "12px 26px" }}>
          Ver Episódio Completo →
        </Link>
      </header>

      <section style={{ padding: "56px 6vw 40px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="kicker">Mercado Imobiliário · Episódio 171</div>
        <h1
          style={{
            fontWeight: 800,
            fontSize: "clamp(40px, 6vw, 84px)",
            lineHeight: 1.08,
            marginTop: 18,
            maxWidth: 1000,
          }}
        >
          A conta que <span style={{ color: "var(--goldenrod)" }}>ninguém faz</span> antes de
          investir em imóvel
        </h1>
        <div className="cartao" style={{ marginTop: 30, maxWidth: 640, borderColor: "var(--goldenrod)" }}>
          <p style={{ color: "var(--off-white)", fontWeight: 600, fontSize: 18, lineHeight: 1.5 }}>
            Um guia prático com 3 dados-chave para calcular ROI real em imóveis. Aprenda a
            entrada, a recorrência e o custo por m².
          </p>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 26 }}>
          {DADOS_CHAVE.map((d) => (
            <span key={d.label} className="chip">
              {d.label} <strong style={{ color: "var(--goldenrod)" }}>{d.valor}</strong>
              <span style={{ color: "var(--dusty-grey)" }}>· {d.contexto}</span>
            </span>
          ))}
        </div>
      </section>

      <section style={{ padding: "24px 6vw 48px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="kicker" style={{ marginBottom: 16 }}>Assista à aula</div>
        <video
          controls
          preload="metadata"
          poster="/logo-ar-amarelo.jpg"
          src={VIDEO_URL}
          style={{
            width: "100%",
            borderRadius: 18,
            border: "1px solid rgba(255,203,0,0.35)",
            background: "var(--dark-void)",
            display: "block",
          }}
        />
      </section>

      <section style={{ padding: "24px 6vw 48px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="kicker" style={{ marginBottom: 20 }}>Material da aula</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
          <div className="cartao">
            <h3 style={{ fontWeight: 700, fontSize: 22 }}>
              <span style={{ color: "var(--goldenrod)" }}>Ebook</span> do episódio
            </h3>
            <p style={{ color: "var(--dusty-grey)", marginTop: 10, lineHeight: 1.5 }}>
              O resumo executivo com os 3 dados-chave, a fórmula do ROI real e o passo a passo
              da conta — em formato Ebook premium.
            </p>
            <Link href="/comprar" style={{ color: "var(--goldenrod)", fontWeight: 700, display: "inline-block", marginTop: 16 }}>
              Baixar Ebook →
            </Link>
          </div>
          <div className="cartao">
            <h3 style={{ fontWeight: 700, fontSize: 22 }}>Mapa mental interativo</h3>
            <p style={{ color: "var(--dusty-grey)", marginTop: 10, lineHeight: 1.5 }}>
              A aula inteira num mapa navegável: da entrada à liberdade financeira, com os
              conceitos ligados do jeito que o mercado funciona.
            </p>
            <Link href="/comprar" style={{ color: "var(--goldenrod)", fontWeight: 700, display: "inline-block", marginTop: 16 }}>
              Abrir mapa →
            </Link>
          </div>
          <div className="cartao" style={{ borderColor: "var(--goldenrod)" }}>
            <h3 style={{ fontWeight: 700, fontSize: 22 }}>Acesso completo</h3>
            <p style={{ color: "var(--dusty-grey)", marginTop: 10, lineHeight: 1.5 }}>
              Vídeo completo + Ebook + mapa mental deste Learn, com pagamento único via Pix.
            </p>
            <div style={{ fontWeight: 800, fontSize: 34, color: "var(--goldenrod)", marginTop: 14 }}>
              R$ 127,48
            </div>
            <Link href="/comprar" className="botao-goldenrod" style={{ marginTop: 18 }}>
              Comprar com Pix →
            </Link>
          </div>
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid rgba(135,135,135,0.25)",
          padding: "26px 6vw",
          color: "var(--dusty-grey)",
          fontSize: 14,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span>© {new Date().getFullYear()} Altamente Rentável Academy</span>
        <span>Conteúdo educacional gerado a partir do podcast Altamente Rentável.</span>
      </footer>
    </main>
  );
}
