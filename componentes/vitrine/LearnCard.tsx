"use client";

// Card da vitrine — estados: normal | comprado (barra de progresso) |
// bloqueado (CTA de compra no hover). Hover rico (padrão do PDF de
// referência 21st.dev/React Bits adaptado à paleta AR): scale sutil,
// spotlight goldenrod que segue o cursor, border-glow, metadados extras.
import { useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { CardLearn } from "@/lib/vitrine/fileiras";

function minutos(seg: number | null): string | null {
  return seg ? `${Math.round(seg / 60)} min` : null;
}

export function LearnCard({ card }: { card: CardLearn }) {
  const ref = useRef<HTMLAnchorElement>(null);

  // Spotlight/border-glow acompanhando o mouse (técnica MagicBento,
  // via CSS vars — sem lib extra, glow na goldenrod oficial).
  function aoMover(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  const destino = card.comprado ? `/learns/${card.slug}` : "/comprar";

  return (
    <motion.div
      className="vitrine-card-wrap"
      whileHover={{ scale: 1.06, zIndex: 5 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      <Link
        ref={ref}
        href={destino}
        onMouseMove={aoMover}
        className={`vitrine-card ${card.comprado ? "comprado" : "bloqueado"}`}
        aria-label={`${card.titulo}${card.comprado ? "" : " (comprar acesso)"}`}
      >
        <div className="vitrine-card-capa">
          <span className="vitrine-card-monograma">AR</span>
          {card.novo ? <span className="vitrine-badge novo">NOVO</span> : null}
          {card.emAlta ? <span className="vitrine-badge alta">EM ALTA</span> : null}
          {!card.comprado ? (
            <span className="vitrine-cadeado" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
          ) : null}
          {card.progresso !== null ? (
            <div className="vitrine-progresso" aria-hidden>
              <div style={{ width: `${Math.round(card.progresso * 100)}%` }} />
            </div>
          ) : null}
        </div>

        <div className="vitrine-card-corpo">
          <h3>{card.titulo}</h3>
          <p className="vitrine-card-meta">
            {minutos(card.duracao_segundos) ?? "Learn"}
            {card.comprado ? " · seu" : null}
          </p>
          {/* Metadados extras só no hover (revelados via CSS) */}
          <div className="vitrine-card-extra">
            {card.resumo ? <p>{card.resumo}</p> : null}
            <span className="vitrine-card-cta">
              {card.comprado
                ? card.progresso !== null && card.progresso < 0.97
                  ? "Continuar assistindo →"
                  : "Assistir agora →"
                : "Comprar acesso →"}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function LearnCardSkeleton() {
  return (
    <div className="vitrine-card-wrap" aria-hidden>
      <div className="vitrine-card esqueleto">
        <div className="vitrine-card-capa shimmer" />
        <div className="vitrine-card-corpo">
          <div className="shimmer linha" style={{ width: "80%" }} />
          <div className="shimmer linha" style={{ width: "45%" }} />
        </div>
      </div>
    </div>
  );
}
