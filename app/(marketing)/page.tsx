"use client";

import Image from "next/image";
import Link from "next/link";
import { Revelar } from "@/componentes/landing/Revelar";
import { CartaoGlow } from "@/componentes/landing/CartaoGlow";
import { PreviewVitrine } from "@/componentes/landing/PreviewVitrine";

// LANDING PÚBLICA — vende a ACADEMY como plataforma (correção crítica do
// prompt de finalização: o episódio #171 é UM produto DENTRO da Academy;
// a manchete/dados/player dele vivem na vitrine e em /learns/[slug]).
// Estrutura: hero institucional -> o que é -> benefícios -> "o que está
// incluso" em BENTO GRID -> prova social (podcast como fonte, sem número
// inventado) -> preview real da vitrine -> CTA final. Paleta travada;
// glassmorphism moderado (header + caixa do hero); Motion com propósito.

const BENEFICIOS = [
  {
    titulo: "7 minutos, não 2 horas",
    texto: "Cada Learn condensa um episódio inteiro do podcast em uma aula objetiva, direto ao ponto.",
  },
  {
    titulo: "Dados reais, não teoria",
    texto: "Percentuais, valores e contas do mercado imobiliário como eles são — sem achismo genérico.",
  },
  {
    titulo: "Ebook + mapa mental",
    texto: "Cada aula sai com resumo executivo em Ebook premium e um mapa mental navegável.",
  },
  {
    titulo: "Sem enrolação",
    texto: "Nada de módulo de boas-vindas de 40 minutos. Você entra, aprende e aplica.",
  },
];

export default function LandingPage() {
  return (
    <main className="fundo-grid" style={{ minHeight: "100vh", position: "relative" }}>
      <div className="hero-camadas" aria-hidden>
        <div className="hero-blob a" />
        <div className="hero-blob b" />
      </div>

      <header className="cabecalho-site cabecalho-glass">
        <div className="entrada" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image src="/logo-ar.jpg" alt="Altamente Rentável" width={46} height={46} style={{ borderRadius: 10 }} />
          <span style={{ fontWeight: 700, fontSize: 17 }}>
            Altamente Rentável <span style={{ color: "var(--goldenrod)" }}>Academy</span>
          </span>
        </div>
        <div className="entrada d1" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/entrar" className="chip">Já sou aluno</Link>
          <Link href="/comprar" className="botao-goldenrod" style={{ fontSize: 15, padding: "12px 26px" }}>
            Começar agora →
          </Link>
        </div>
      </header>

      {/* HERO — vende a plataforma, não um episódio */}
      <section style={{ padding: "72px 6vw 40px", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <div className="kicker entrada d1">
          Do podcast Altamente Rentável
        </div>
        <h1
          className="entrada d2"
          style={{
            fontWeight: 800,
            fontSize: "clamp(38px, 5.6vw, 78px)",
            lineHeight: 1.08,
            marginTop: 18,
            maxWidth: 1000,
          }}
        >
          Aprenda a investir em imóveis com{" "}
          <span style={{ color: "var(--goldenrod)" }}>aulas objetivas</span>, feitas de dados
          reais
        </h1>
        <div className="cartao caixa-glass entrada d3" style={{ marginTop: 30, maxWidth: 680 }}>
          <p style={{ color: "var(--off-white)", fontWeight: 600, fontSize: 18, lineHeight: 1.55 }}>
            A Academy transforma cada episódio do podcast Altamente Rentável em um Learn:
            vídeo-aula curta e prática, Ebook premium e mapa mental interativo — o
            conhecimento de quem já fez, sem horas de áudio pra garimpar.
          </p>
        </div>
        <div className="entrada d4" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28, alignItems: "center" }}>
          <Link href="/comprar" className="botao-goldenrod">
            Começar agora →
          </Link>
          <Link href="/entrar" className="chip">
            Já tenho acesso
          </Link>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section style={{ padding: "40px 6vw", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <Revelar>
          <div className="kicker" style={{ marginBottom: 20 }}>Por que a Academy</div>
        </Revelar>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 }}>
          {BENEFICIOS.map((b, i) => (
            <Revelar key={b.titulo} atraso={i * 0.1}>
              <CartaoGlow style={{ height: "100%", padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 19, color: "var(--goldenrod)" }}>{b.titulo}</h3>
                <p style={{ color: "var(--dusty-grey)", marginTop: 10, lineHeight: 1.55, fontSize: 14.5 }}>{b.texto}</p>
              </CartaoGlow>
            </Revelar>
          ))}
        </div>
      </section>

      {/* O QUE ESTÁ INCLUSO — bento grid (tendência consolidada 2026:
          tamanho do tile comunica hierarquia; vídeo-aula é o carro-chefe) */}
      <section style={{ padding: "40px 6vw", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <Revelar>
          <div className="kicker" style={{ marginBottom: 20 }}>O que está incluso em cada Learn</div>
        </Revelar>
        <div className="bento">
          <Revelar className="bento-tile grande">
            <CartaoGlow style={{ height: "100%" }}>
              <p className="kicker" style={{ fontSize: 11 }}>Vídeo-aula</p>
              <h3 style={{ fontWeight: 800, fontSize: 28, marginTop: 10, lineHeight: 1.2 }}>
                A aula inteira em <span style={{ color: "var(--goldenrod)" }}>~7 minutos</span>
              </h3>
              <p style={{ color: "var(--dusty-grey)", marginTop: 12, lineHeight: 1.55 }}>
                Motion graphics premium, dados-chave na tela, narração objetiva. O episódio
                destilado no que interessa pra sua decisão de investimento.
              </p>
            </CartaoGlow>
          </Revelar>
          <Revelar className="bento-tile" atraso={0.1}>
            <CartaoGlow style={{ height: "100%" }}>
              <p className="kicker" style={{ fontSize: 11 }}>Ebook</p>
              <h3 style={{ fontWeight: 700, fontSize: 20, marginTop: 10 }}>Resumo executivo premium</h3>
              <p style={{ color: "var(--dusty-grey)", marginTop: 10, lineHeight: 1.5, fontSize: 14.5 }}>
                Os dados, a fórmula e o passo a passo — pra consultar quando for fazer a conta.
              </p>
            </CartaoGlow>
          </Revelar>
          <Revelar className="bento-tile" atraso={0.18}>
            <CartaoGlow style={{ height: "100%" }}>
              <p className="kicker" style={{ fontSize: 11 }}>Mapa mental</p>
              <h3 style={{ fontWeight: 700, fontSize: 20, marginTop: 10 }}>Interativo e navegável</h3>
              <p style={{ color: "var(--dusty-grey)", marginTop: 10, lineHeight: 1.5, fontSize: 14.5 }}>
                Os conceitos ligados do jeito que o mercado funciona, num mapa que se explora.
              </p>
            </CartaoGlow>
          </Revelar>
          <Revelar className="bento-tile largo" atraso={0.26}>
            <CartaoGlow destaque style={{ height: "100%", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 20 }}>Acesso vitalício por Learn</h3>
                <p style={{ color: "var(--dusty-grey)", marginTop: 8, fontSize: 14.5 }}>
                  Pagamento único via Pix — sem mensalidade.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800, fontSize: 32, color: "var(--goldenrod)" }}>R$ 127,48</span>
                <Link href="/comprar" className="botao-goldenrod">Começar agora →</Link>
              </div>
            </CartaoGlow>
          </Revelar>
        </div>
      </section>

      {/* PROVA SOCIAL / AUTORIDADE — podcast como fonte, sem inventar número */}
      <section style={{ padding: "40px 6vw", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <Revelar>
          <div className="cartao caixa-glass" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Image src="/logo-ar-amarelo.jpg" alt="Podcast Altamente Rentável" width={64} height={64} style={{ borderRadius: 14 }} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ fontWeight: 700, fontSize: 20 }}>
                Nascida do podcast <span style={{ color: "var(--goldenrod)" }}>Altamente Rentável</span>
              </h3>
              <p style={{ color: "var(--dusty-grey)", marginTop: 8, lineHeight: 1.55, fontSize: 15 }}>
                Todo Learn nasce de um episódio real do podcast sobre mercado imobiliário e
                investimentos — a mesma fonte, agora em formato de aula.
              </p>
            </div>
          </div>
        </Revelar>
      </section>

      {/* PREVIEW REAL DA VITRINE (cards com thumbnail do YouTube) */}
      <section style={{ padding: "16px 6vw 40px", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <PreviewVitrine />
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "40px 6vw 72px", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <Revelar>
          <div className="vitrine-hero fundo-grid" style={{ textAlign: "center", marginTop: 0 }}>
            <div className="vitrine-hero-glow" aria-hidden />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 4vw, 44px)", lineHeight: 1.15 }}>
                Pronto pra fazer a conta <span style={{ color: "var(--goldenrod)" }}>do jeito certo</span>?
              </h2>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
                <Link href="/comprar" className="botao-goldenrod">Começar agora →</Link>
                <Link href="/entrar" className="chip">Já sou aluno</Link>
              </div>
            </div>
          </div>
        </Revelar>
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
          position: "relative",
        }}
      >
        <span>© {new Date().getFullYear()} Altamente Rentável Academy</span>
        <span>Conteúdo educacional gerado a partir do podcast Altamente Rentável.</span>
      </footer>
    </main>
  );
}
