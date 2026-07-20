import { NextRequest, NextResponse } from "next/server";
import { autorizado } from "@/app/admin/gate";
import { conversarAlteracaoIndividual } from "@/lib/generation/traduzirAlteracao";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export const dynamic = "force-dynamic";

// Alteração INDIVIDUAL — chatbot dedicado a UM Learn. A IA propõe
// mudanças de campos (aplicadas na hora) e/ou marca assets pra
// regeneração na esteira. Não toca o config geral, não afeta outros
// conteúdos. Tudo fica registrado no alteracoes_log.
export async function POST(req: NextRequest) {
  if (!(await autorizado())) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  try {
    const { learnId, mensagens } = await req.json();
    if (typeof learnId !== "string" || !Array.isArray(mensagens) || mensagens.length === 0) {
      return NextResponse.json({ erro: "learnId e mensagens são obrigatórios" }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data: learn, error } = await supabase
      .from("learns")
      .select("id, titulo, resumo")
      .eq("id", learnId)
      .maybeSingle();
    if (error) throw error;
    if (!learn) return NextResponse.json({ erro: "learn não encontrado" }, { status: 404 });

    const mudanca = await conversarAlteracaoIndividual(
      { titulo: learn.titulo, resumo: learn.resumo },
      mensagens
    );

    // Aplica os campos imediatamente (só neste learn).
    if (Object.keys(mudanca.campos).length > 0) {
      await supabase.from("learns").update(mudanca.campos).eq("id", learn.id);
    }

    // Regeneração de assets: registrada pro processador da fila
    // reprocessar este item no próximo ciclo (a esteira lê alterações
    // 'aplicada' com resultado.regenerar não-vazio).
    await supabase.from("alteracoes_log").insert({
      escopo: "individual",
      learn_id: learn.id,
      instrucao: String(mensagens[mensagens.length - 1]?.content ?? "").slice(0, 2000),
      resultado: { campos: mudanca.campos, regenerar: mudanca.regenerar, resposta: mudanca.resposta },
      status: "aplicada",
      tokens_entrada: mudanca.tokens_entrada,
      tokens_saida: mudanca.tokens_saida,
      modelo: mudanca.modelo,
      decidido_at: new Date().toISOString(),
    });

    return NextResponse.json({
      resposta: mudanca.resposta,
      campos: mudanca.campos,
      regenerar: mudanca.regenerar,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro inesperado";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
