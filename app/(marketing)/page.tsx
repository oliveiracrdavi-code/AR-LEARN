"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Revelar } from "@/componentes/landing/Revelar";
import { CartaoGlow } from "@/componentes/landing/CartaoGlow";

// LANDING — Altamente Rentável Academy. Hero no padrão "Manchete Premium"
// aprovado (grid black + logo + manchete XXL goldenrod + caixa de
// descrição), apresentação do episódio #171, player do vídeo v2, seção de
// Ebook + mapa mental e CTA de compra. Paleta travada da Phase 3.
// Turbinada (rodada "todos os MCPs"): entradas staggered com Motion,
// glow em deriva no hero, spotlight goldenrod nos cartões, reveal ao
// scroll — mesmo copy, mesmo layout, nível de acabamento maior.
const VIDEO_URL =
  process.env.NEXT_PUBLIC_EP171_VIDEO_URL ?? "/videos/ar_learn_171_16x9_final_v2.mp4";

const DADOS_CHAVE = [
  { label: "Entrada", valor: "35-40%", contexto: "Crítica" },
  { label: "Recorrência", valor: "+20-25%", contexto: "Determinante" },
  { label: "Custo m²", valor: "R$ 45.000", contexto: "Referência" },
];

const entrada = {
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <main className="fundo-grid" style={{ minHeight: "100vh", position: "relative" }}>
      <div className="hero-camadas" aria-hidden>
        <div className="hero-blob a" />
        <div className="hero-blob b" />
      </div>

      <header
        className="cabecalho-site"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 6vw",
          position: "relative",
        }}
      >
        <motion.div
          {...entrada}
          transition={{ duration: 0.5 }}
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          <Image src="/logo-ar.jpg" alt="Altamente Rentável" width={54} height={54} style={{ borderRadius: 10 }} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            Altamente Rentável <span style={{ color: "var(--goldenrod)" }}>Academy</span>
          </span>
        </motion.div>
        <motion.div {...entrada} transition={{ duration: 0.5, delay: 0.1 }}>
          <Link href="/comprar" className="botao-goldenrod" style={{ fontSize: 15, padding: "12px 26px" }}>
            Ver Episódio Completo →
          </Link>
        </motion.div>
      </header>

      <section style={{ padding: "56px 6vw 40px", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <motion.div className="kicker" {...entrada} transition={{ duration: 0.5, delay: 0.15 }}>
          Mercado Imobiliário · Episódio 171
        </motion.div>
        <motion.h1
          {...entrada}
          transition={{ duration: 0.65, delay: 0.25, ease: "easeOut" }}
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
        </motion.h1>
        <motion.div
          {...entrada}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="cartao"
          style={{ marginTop: 30, maxWidth: 640, borderColor: "var(--goldenrod)" }}
        >
          <p style={{ color: "var(--off-white)", fontWeight: 600, fontSize: 18, lineHeight: 1.5 }}>
            Um guia prático com 3 dados-chave para calcular ROI real em imóveis. Aprenda a
            entrada, a recorrência e o custo por m².
          </p>
        </motion.div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 26 }}>
          {DADOS_CHAVE.map((d, i) => (
            <motion.span
              key={d.label}
              className="chip"
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.55 + i * 0.12 }}
              whileHover={{ scale: 1.06, borderColor: "rgba(255,203,0,0.6)" }}
            >
              {d.label} <strong style={{ color: "var(--goldenrod)" }}>{d.valor}</strong>
              <span style={{ color: "var(--dusty-grey)" }}>· {d.contexto}</span>
            </motion.span>
          ))}
        </div>
      </section>

      <section style={{ padding: "24px 6vw 48px", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <Revelar>
          <div className="kicker" style={{ marginBottom: 16 }}>Assista à aula</div>
          <video
            controls
            preload="metadata"
            poster="/logo-ar-amarelo.jpg"
            src={VIDEO_URL}
            className="moldura-video"
            style={{ width: "100%", display: "block" }}
          />
        </Revelar>
      </section>

      <section style={{ padding: "24px 6vw 48px", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <Revelar>
          <div className="kicker" style={{ marginBottom: 20 }}>Material da aula</div>
        </Revelar>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
          <Revelar atraso={0}>
            <CartaoGlow style={{ height: "100%" }}>
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
            </CartaoGlow>
          </Revelar>
          <Revelar atraso={0.12}>
            <CartaoGlow style={{ height: "100%" }}>
              <h3 style={{ fontWeight: 700, fontSize: 22 }}>Mapa mental interativo</h3>
              <p style={{ color: "var(--dusty-grey)", marginTop: 10, lineHeight: 1.5 }}>
                A aula inteira num mapa navegável: da entrada à liberdade financeira, com os
                conceitos ligados do jeito que o mercado funciona.
              </p>
              <Link href="/comprar" style={{ color: "var(--goldenrod)", fontWeight: 700, display: "inline-block", marginTop: 16 }}>
                Abrir mapa →
              </Link>
            </CartaoGlow>
          </Revelar>
          <Revelar atraso={0.24}>
            <CartaoGlow destaque style={{ height: "100%" }}>
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
            </CartaoGlow>
          </Revelar>
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
          position: "relative",
        }}
      >
        <span>© {new Date().getFullYear()} Altamente Rentável Academy</span>
        <span>Conteúdo educacional gerado a partir do podcast Altamente Rentável.</span>
      </footer>
    </main>
  );
}
