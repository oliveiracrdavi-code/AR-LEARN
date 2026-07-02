import type { NextConfig } from "next";

// Deploy na Cloudflare Pages via adapter @cloudflare/next-on-pages
// (a configurar na fase de deploy) — não usar "output: export" aqui,
// pois a área de membros e os webhooks de pagamento precisam de
// rotas dinâmicas/API routes, incompatíveis com export estático.
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
