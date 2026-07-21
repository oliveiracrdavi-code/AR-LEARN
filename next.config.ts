import type { NextConfig } from "next";

// Headers de segurança (audit da rodada final — ver
// docs/security-audit-log.md). A CSP é deliberadamente enxuta:
// - script/style 'unsafe-inline': exigidos pelo runtime do Next (RSC
//   flight inline) e pelos estilos inline do design system;
// - connect-src inclui o Supabase (auth/dados/storage assinado);
// - img-src inclui i.ytimg.com (thumbnails reais dos episódios);
// - media-src cobre o vídeo por URL assinada: Supabase (Ebook/mapa não
//   passam por <video>, então não precisam aqui) + R2 (migração
//   2026-07-21 — domínio genérico *.r2.cloudflarestorage.com porque o
//   account_id específico ainda não chegou; refinar pro subdomínio
//   exato assim que a conta existir);
// - frame-ancestors 'none' + X-Frame-Options DENY: ninguém emoldura o
//   site (clickjacking).
const SUPABASE = "https://gmwtkcjpjmcwsnjrgeen.supabase.co";
const R2 = "https://*.r2.cloudflarestorage.com";
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${SUPABASE}`,
  "img-src 'self' data: https://i.ytimg.com",
  `media-src 'self' blob: ${SUPABASE} ${R2}`,
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
