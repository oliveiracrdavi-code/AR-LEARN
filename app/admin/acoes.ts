"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { ipDaRequisicao, permitido } from "@/lib/seguranca/rateLimit";
import { autorizado, COOKIE_ADMIN, VALIDADE_COOKIE_S } from "./gate";

export async function entrarAdmin(formData: FormData) {
  const h = await headers();
  const ip = ipDaRequisicao(h);

  // Força bruta: 5 tentativas por IP a cada 15 min.
  if (!permitido(`admin-login:${ip}`, 5, 15 * 60_000)) {
    redirect("/admin?erro=limite");
  }

  const esperado = process.env.ADMIN_TOKEN;
  const tentativa = formData.get("senha");
  if (esperado && tentativa === esperado) {
    const jar = await cookies();
    jar.set(COOKIE_ADMIN, esperado, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: VALIDADE_COOKIE_S,
      path: "/",
    });
    // Auditoria: quando e de onde o admin entrou (admin_access_log é
    // service-role only). Falha de log não pode travar o login.
    try {
      await createServiceRoleSupabaseClient().from("admin_access_log").insert({
        ip,
        user_agent: h.get("user-agent")?.slice(0, 300) ?? null,
      });
    } catch {
      // sem rede/na primeira config o log é melhor-esforço
    }
    redirect("/admin");
  }
  redirect("/admin?erro=1");
}

export async function sairAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE_ADMIN);
  redirect("/admin");
}

// Fixar/soltar o Learn do hero da vitrine (só 1 por vez).
export async function alternarHero(formData: FormData) {
  if (!(await autorizado())) return;
  const learnId = formData.get("learn_id");
  const fixar = formData.get("fixar") === "1";
  if (typeof learnId !== "string") return;

  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("learns").update({ fixado_no_hero: false }).eq("fixado_no_hero", true);
  if (fixar) {
    await supabase.from("learns").update({ fixado_no_hero: true }).eq("id", learnId);
  }
  revalidatePath("/admin");
}

// CRUD do Learn: título, descrição (resumo), preço, status e override
// manual da thumbnail (caso a automação pegue imagem ruim).
export async function atualizarLearn(formData: FormData) {
  if (!(await autorizado())) return;
  const id = formData.get("learn_id");
  if (typeof id !== "string") return;

  const titulo = formData.get("titulo");
  const resumo = formData.get("resumo");
  const precoReais = formData.get("preco");
  const status = formData.get("status");
  const thumbnail = formData.get("thumbnail_url");

  const mudancas: Record<string, unknown> = {};
  if (typeof titulo === "string" && titulo.trim()) mudancas.titulo = titulo.trim();
  if (typeof resumo === "string") mudancas.resumo = resumo.trim() || null;
  if (typeof precoReais === "string" && precoReais.trim()) {
    const centavos = Math.round(Number(precoReais.replace(",", ".")) * 100);
    if (Number.isFinite(centavos) && centavos > 0) mudancas.preco_centavos = centavos;
  }
  if (status === "publicado" || status === "rascunho" || status === "em_revisao") {
    mudancas.status = status;
    if (status === "publicado") mudancas.publicado_at = new Date().toISOString();
  }
  if (typeof thumbnail === "string") {
    mudancas.thumbnail_url = thumbnail.trim() || null;
  }

  if (Object.keys(mudancas).length > 0) {
    await createServiceRoleSupabaseClient().from("learns").update(mudancas).eq("id", id);
  }
  revalidatePath("/admin");
}

// Concessão manual de acesso (suporte: cortesia, pagamento por fora,
// ajuste). Resolve/cria o usuário pelo e-mail (mesmo caminho do webhook)
// e registra compra 'aprovado' com provedor 'manual' e valor 0.
export async function concederAcesso(formData: FormData) {
  if (!(await autorizado())) return;
  const email = formData.get("email");
  const learnId = formData.get("learn_id");
  if (typeof email !== "string" || !email.includes("@") || typeof learnId !== "string") {
    redirect("/admin?acesso=invalido");
  }

  const supabase = createServiceRoleSupabaseClient();
  let usuarioId: string | null = null;
  const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (!erroCriar && criado?.user) {
    usuarioId = criado.user.id;
  } else {
    const { data: lista } = await supabase.auth.admin.listUsers();
    usuarioId = lista?.users.find((u) => u.email === email)?.id ?? null;
  }
  if (!usuarioId) redirect("/admin?acesso=falhou");

  await supabase.from("perfis").upsert({ id: usuarioId, email }, { onConflict: "id" });
  const { error } = await supabase.from("compras").insert({
    usuario_id: usuarioId,
    email,
    learn_id: learnId,
    valor: 0,
    provedor: "manual",
    metodo_pagamento: "manual",
    status: "aprovado",
    aprovado_at: new Date().toISOString(),
  });
  redirect(error ? "/admin?acesso=falhou" : "/admin?acesso=ok");
}
