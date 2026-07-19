"use client";

// Wrapper de entrada-ao-scroll (Motion): fade + subida suave, uma vez.
// Padrão de acabamento do PDF de referência, adaptado — nada de 3D.
import { motion } from "motion/react";

export function Revelar({
  children,
  atraso = 0,
  ...rest
}: {
  children: React.ReactNode;
  atraso?: number;
} & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: atraso, ease: "easeOut" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
