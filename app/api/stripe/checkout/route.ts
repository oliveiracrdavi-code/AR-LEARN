import { NextRequest, NextResponse } from "next/server";
import { getStripe, siteUrl } from "@/lib/stripe/stripe";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export const dynamic = "force-dynamic";

// POST /api/stripe/checkout  { learnSlug: string, email: string }
// Cria a Checkout Session (Pix + cartão como fallback temporário até o
// Pix ser habilitado no dashboard) e registra a compra 'pendente'. O QR
// do Pix é exibido pela página hospedada da Stripe; a confirmação chega
// pelo webhook (app/api/stripe/webhook).
export async function POST(req: NextRequest) {
  try {
    const { learnSlug, email } = await req.json();
    if (!learnSlug || !email) {
      return NextResponse.json({ erro: "learnSlug e email são obrigatórios" }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data: learn, error } = await supabase
      .from("learns")
      .select("id, titulo, preco_centavos, status")
      .eq("slug", learnSlug)
      .maybeSingle();
    if (error) throw error;
    if (!learn || learn.status !== "publicado") {
      return NextResponse.json({ erro: "Learn não encontrado ou não publicado" }, { status: 404 });
    }

    const stripe = getStripe();
    // Métodos de pagamento DINÂMICOS (sem payment_method_types): a Stripe
    // usa o que estiver habilitado no dashboard da conta. Fixar
    // ["pix","card"] derrubava a criação da sessão inteira em conta sem
    // Pix ativo (confirmado via MCP: o sandbox atual é BRL só com card) —
    // não existe "fallback" dentro desse parâmetro. Assim, hoje o sandbox
    // oferece cartão; quando o Davi ativar Pix na conta de produção, o
    // Pix aparece primeiro pra BRL sem tocar em código — só trocar a chave.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: learn.preco_centavos,
            product_data: {
              name: `Learn — ${learn.titulo}`,
              description: "Altamente Rentável Academy: vídeo + Ebook + mapa mental",
            },
          },
          quantity: 1,
        },
      ],
      metadata: { learn_id: learn.id, email },
      success_url: `${siteUrl()}/comprar/aguardando?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/comprar?cancelado=1`,
    });

    // Registro 'pendente' — aprovado só pelo webhook. usuario_id é
    // resolvido/criado na confirmação (guest checkout por email).
    const { error: erroCompra } = await supabase.from("compras").insert({
      usuario_id: null,
      learn_id: learn.id,
      valor: learn.preco_centavos / 100,
      // metodo_pagamento fica nulo no 'pendente' — o método real (pix ou
      // cartão, agora dinâmico) é gravado pelo webhook na confirmação.
      metodo_pagamento: null,
      provedor: "stripe",
      provedor_transacao_id: session.id,
      stripe_checkout_session_id: session.id,
      status: "pendente",
    });
    if (erroCompra) throw erroCompra;

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro inesperado";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
