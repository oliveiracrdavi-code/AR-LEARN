"use client";

// Fileira horizontal da vitrine (comportamento obrigatório da
// arquitetura): scroll horizontal com swipe nativo no mobile, setas no
// desktop ao hover, navegação por teclado (setas quando o container tem
// foco), NUNCA vira grid vertical. Título = resultado, em goldenrod.
import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { CardLearn } from "@/lib/vitrine/fileiras";
import { LearnCard, LearnCardSkeleton } from "./LearnCard";

export function VitrineRow({
  titulo,
  cards,
  carregando = false,
}: {
  titulo: string;
  cards?: CardLearn[];
  carregando?: boolean;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const [podeEsq, setPodeEsq] = useState(false);
  const [podeDir, setPodeDir] = useState(true);

  function rolar(direcao: 1 | -1) {
    const el = trilho.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: "smooth" });
  }

  function aoRolar() {
    const el = trilho.current;
    if (!el) return;
    setPodeEsq(el.scrollLeft > 8);
    setPodeDir(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      rolar(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      rolar(-1);
    }
  }

  if (!carregando && (!cards || cards.length === 0)) return null;

  return (
    <motion.section
      className="vitrine-fileira"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h2 className="vitrine-fileira-titulo">{titulo}</h2>
      <div className="vitrine-fileira-area">
        <button
          type="button"
          className="vitrine-seta esq"
          aria-label={`Rolar "${titulo}" para a esquerda`}
          onClick={() => rolar(-1)}
          style={{ opacity: podeEsq ? undefined : 0, pointerEvents: podeEsq ? undefined : "none" }}
        >
          ‹
        </button>
        <div
          ref={trilho}
          className="vitrine-trilho"
          role="list"
          tabIndex={0}
          aria-label={titulo}
          onScroll={aoRolar}
          onKeyDown={aoTeclar}
        >
          {carregando
            ? Array.from({ length: 5 }).map((_, i) => <LearnCardSkeleton key={i} />)
            : (cards ?? []).map((c) => (
                <div role="listitem" key={c.slug}>
                  <LearnCard card={c} />
                </div>
              ))}
        </div>
        <button
          type="button"
          className="vitrine-seta dir"
          aria-label={`Rolar "${titulo}" para a direita`}
          onClick={() => rolar(1)}
          style={{ opacity: podeDir ? undefined : 0, pointerEvents: podeDir ? undefined : "none" }}
        >
          ›
        </button>
      </div>
    </motion.section>
  );
}
