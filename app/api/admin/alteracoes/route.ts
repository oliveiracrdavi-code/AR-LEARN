import { NextRequest, NextResponse } from "next/server";
import { autorizado } from "@/app/admin/gate";
import { lerConfigAtivo } from "@/lib/generation/config";
import { traduzirAlteracaoGeral } from "@/lib/generation/traduzirAlteracao";
import { TIPOS_ASSET, type TipoAsset } from "@/lib/generation/config";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export const dynamic = "force-dynamic";

// Alteração GERAL — passo 1: gerar o PREVIEW (nada é aplicado ainda).
// A IA traduz a instrução em params novos; gravamos como 'preview' no
// alteracoes_log e devolvemos antes/depois pro admin decidir.
export async function POST(req: NextRequest) {
  if (!(await autorizado())) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  try {
    const { tipo, instrucao } = await req.json();
    if (!TIPOS_ASSET.includes(tipo) || typeof instrucao !== "string" || !instrucao.trim()) {
      return NextResponse.json({ erro: "tipo e instrucao são obrigatórios" }, { status: 400 });
    }

    const atual = await lerConfigAtivo(tipo as TipoAsset);
    const traducao = await traduzirAlteracaoGeral(tipo, atual.params, instrucao.trim());

    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("alteracoes_log")
      .insert({
        escopo: "geral",
        tipo_asset: tipo,
        instrucao: instrucao.trim(),
        resultado: { params: traducao.params, explicacao: traducao.explicacao },
        status: "preview",
        tokens_entrada: traducao.tokens_entrada,
        tokens_saida: traducao.tokens_saida,
        modelo: traducao.modelo,
      })
      .select("id")
      .single();
    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      params_atuais: atual.params,
      versao_atual: atual.versao,
      params_propostos: traducao.params,
      explicacao: traducao.explicacao,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro inesperado";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}

// Histórico das alterações (geral + individual) pro painel.
export async function GET() {
  if (!(await autorizado())) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("alteracoes_log")
    .select("id, escopo, tipo_asset, instrucao, status, modelo, tokens_entrada, tokens_saida, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  return NextResponse.json({ alteracoes: data ?? [] });
}
