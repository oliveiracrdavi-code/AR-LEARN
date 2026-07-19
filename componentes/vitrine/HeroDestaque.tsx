"use client";

// Hero da área de membros — mesmo papel do hero da Netflix: um Learn em
// destaque (fixado pelo admin ou o mais recente), na linguagem da
// Manchete Premium: kicker, título grande com corte goldenrod, CTA.
import Link from "next/link";
import { motion } from "motion/react";
import type { CardLearn } from "@/lib/vitrine/fileiras";

export function HeroDestaque({ card }: { card: CardLearn }) {
  const destino = card.comprado ? `/learns/${card.slug}` : "/comprar";
  return (
    <section className="vitrine-hero fundo-grid">
      <div className="vitrine-hero-glow" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ position: "relative" }}
      >
        <p className="kicker">Em destaque</p>
        <h1 className="vitrine-hero-titulo">{card.titulo}</h1>
        {card.resumo ? <p className="vitrine-hero-resumo">{card.resumo}</p> : null}
        <div className="vitrine-hero-acoes">
          <Link href={destino} className="botao-goldenrod">
            {card.comprado ? "Assistir agora →" : "Comprar acesso →"}
          </Link>
          {card.duracao_segundos ? (
            <span className="chip">{Math.round(card.duracao_segundos / 60)} min</span>
          ) : null}
          {card.novo ? <span className="chip" style={{ borderColor: "rgba(255,203,0,0.5)", color: "var(--goldenrod)" }}>Novo</span> : null}
        </div>
      </motion.div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section className="vitrine-hero fundo-grid" aria-hidden>
      <div style={{ position: "relative" }}>
        <div className="shimmer linha" style={{ width: 120, height: 14 }} />
        <div className="shimmer linha" style={{ width: "60%", height: 42, marginTop: 18 }} />
        <div className="shimmer linha" style={{ width: "40%", height: 18, marginTop: 14 }} />
      </div>
    </section>
  );
}
