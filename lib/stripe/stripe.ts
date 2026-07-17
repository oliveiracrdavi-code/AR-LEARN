import "server-only";
import Stripe from "stripe";

// Cliente Stripe LAZY: instanciado só em request-time (nunca no build,
// que roda sem credenciais). Decisão fechada do projeto: pagamento via
// Stripe com Pix (não Mercado Pago/Asaas).
//
// Nota de ambiente: o conector MCP da Stripe estava indisponível na
// implementação (registrado no phase3_setup_log.md); o SDK oficial via
// STRIPE_SECRET_KEY cobre o mesmo fluxo. Habilitar o método Pix na conta
// (dashboard Stripe -> Settings -> Payment methods) é passo do Davi.
let cache: Stripe | null = null;

export function getStripe(): Stripe {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) {
    throw new Error(
      "STRIPE_SECRET_KEY ausente. Configure no provedor (nunca no código)."
    );
  }
  if (!cache) {
    cache = new Stripe(chave);
  }
  return cache;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
