"use client";

// Cartão com spotlight goldenrod que segue o cursor + lift no hover
// (técnica MagicBento/React Bits adaptada à paleta AR — CSS vars, sem
// dependência extra).
import { useRef } from "react";
import { motion } from "motion/react";

export function CartaoGlow({
  children,
  destaque = false,
  style,
}: {
  children: React.ReactNode;
  destaque?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function aoMover(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={aoMover}
      className={`cartao cartao-glow${destaque ? " destaque" : ""}`}
      style={style}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}
