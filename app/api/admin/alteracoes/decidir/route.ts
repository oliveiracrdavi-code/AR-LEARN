import { NextRequest, NextResponse } from "next/server";
import { autorizado } from "@/app/admin/gate";
import { criarNovaVersao, type TipoAsset } from "@/lib/generation/config";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export const dynamic = "force-dynamic";

// Alteração GERAL — passo 2: decisão do admin sobre um preview.
// Aprovar => vira NOVA VERSÃO do generation_config (histórico mantém as
// anteriores; toda geração futura daquele tipo usa a nova receita).
// Descartar => nada muda.
export async function POST(req: NextRequest) {
  if (!(await autorizado())) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  try {
    const { id, decisao } = await req.json();
    if (typeof id !== "string" || !["aprovar", "descartar"].includes(decisao)) {
      return NextResponse.json({ erro: "id e decisao (aprovar|descartar) obrigatórios" }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data: alteracao, error } = await supabase
      .from("alteracoes_log")
      .select("id, tipo_asset, instrucao, resultado, status")
      .eq("id", id)
      .eq("escopo", "geral")
      .maybeSingle();
    if (error) throw error;
    if (!alteracao || alteracao.status !== "preview") {
      return NextResponse.json({ erro: "preview não encontrado ou já decidido" }, { status: 404 });
    }

    let versao: number | null = null;
    if (decisao === "aprovar") {
      const resultado = alteracao.resultado as { params: unknown };
      versao = await criarNovaVersao(
        alteracao.tipo_asset as TipoAsset,
        resultado.params,
        alteracao.instrucao
      );
    }

    await supabase
      .from("alteracoes_log")
      .update({
        status: decisao === "aprovar" ? "aprovada" : "descartada",
        decidido_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ ok: true, versao });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro inesperado";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
