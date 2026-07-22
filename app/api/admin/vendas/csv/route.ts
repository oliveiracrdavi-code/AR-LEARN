import { NextResponse } from "next/server";
import { autorizado } from "@/app/admin/gate";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export const dynamic = "force-dynamic";

// Exportação CSV das vendas — item novo da auditoria final, pra
// contabilidade/imposto. Dado NÃO mascarado (diferente da tabela do
// painel): é exatamente o mesmo dado que o admin já vê com
// ?revelar=1, só serializado — mesmo gate, mesmo nível de confiança,
// nenhuma exposição nova.
function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  if (!(await autorizado())) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const { data: compras, error } = await createServiceRoleSupabaseClient()
    .from("compras")
    .select("created_at, email, valor, provedor, status, aprovado_at, learn_id, learns(titulo)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const cabecalho = ["data", "email", "learn", "valor_reais", "provedor", "status", "aprovado_em"];
  const linhas = (compras ?? []).map((c) => {
    const learn = c.learns as unknown as { titulo?: string } | { titulo?: string }[] | null;
    const titulo = Array.isArray(learn) ? learn[0]?.titulo : learn?.titulo;
    return [
      c.created_at,
      c.email,
      c.learn_id ? (titulo ?? "") : "acesso global",
      Number(c.valor).toFixed(2),
      c.provedor,
      c.status,
      c.aprovado_at ?? "",
    ]
      .map(csvEscape)
      .join(",");
  });

  const csv = "﻿" + [cabecalho.join(","), ...linhas].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas-ar-academy-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
