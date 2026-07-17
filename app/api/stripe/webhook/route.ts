import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/stripe";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export const dynamic = "force-dynamic";

// Webhook Stripe: confirma pagamento (Pix é assíncrono => o evento-chave
// é checkout.session.async_payment_succeeded; cartão confirma direto em
// checkout.session.completed com payment_status=paid). Ao confirmar:
// resolve/cria o usuário pelo e-mail (Supabase Auth admin), garante o
// perfil e marca a compra como 'aprovado' — isso libera o Learn via RLS.
export async function POST(req: NextRequest) {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!segredo) {
    return NextResponse.json({ erro: "STRIPE_WEBHOOK_SECRET ausente" }, { status: 500 });
  }

  const corpo = await req.text();
  const assinatura = req.headers.get("stripe-signature");
  if (!assinatura) {
    return NextResponse.json({ erro: "assinatura ausente" }, { status: 400 });
  }

  let evento: Stripe.Event;
  try {
    evento = getStripe().webhooks.constructEvent(corpo, assinatura, segredo);
  } catch {
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  async function aprovar(session: Stripe.Checkout.Session) {
    const email = session.customer_email ?? (session.metadata?.email as string | undefined);
    let usuarioId: string | null = null;

    if (email) {
      // Resolve ou cria o usuário (acesso liberado por e-mail; senha via
      // "esqueci minha senha" / magic link na tela de entrar).
      const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (!erroCriar && criado?.user) {
        usuarioId = criado.user.id;
      } else {
        // Já existia: busca por e-mail.
        const { data: lista } = await supabase.auth.admin.listUsers();
        usuarioId = lista?.users.find((u) => u.email === email)?.id ?? null;
      }
      if (usuarioId) {
        await supabase.from("perfis").upsert({ id: usuarioId, email }, { onConflict: "id" });
      }
    }

    const { error } = await supabase
      .from("compras")
      .update({
        status: "aprovado",
        usuario_id: usuarioId,
        metodo_pagamento: session.payment_method_types?.[0] ?? "pix",
        aprovado_at: new Date().toISOString(),
      })
      .eq("stripe_checkout_session_id", session.id);
    if (error) throw error;
  }

  try {
    switch (evento.type) {
      case "checkout.session.completed": {
        const s = evento.data.object as Stripe.Checkout.Session;
        if (s.payment_status === "paid") await aprovar(s); // cartão: síncrono
        break; // Pix fica 'pendente' até o async_payment_succeeded
      }
      case "checkout.session.async_payment_succeeded":
        await aprovar(evento.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.async_payment_failed": {
        const s = evento.data.object as Stripe.Checkout.Session;
        await supabase
          .from("compras")
          .update({ status: "recusado" })
          .eq("stripe_checkout_session_id", s.id);
        break;
      }
      default:
        break; // eventos não tratados: 200 mesmo assim (Stripe re-tenta os úteis)
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro inesperado";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
