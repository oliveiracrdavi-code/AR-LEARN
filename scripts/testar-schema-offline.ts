// Smoke test 100% offline do contrato JSON do Learn (schema.ts), sem
// tocar rede. Serve pra provar que a validação zod está correta mesmo
// quando OpenRouter/Groq estão inacessíveis (ex.: política de rede do
// ambiente). Não é conteúdo real — é um fixture sintético de teste.
import { learnContratoSchema } from "../lib/openrouter/schema";

const fixtureValido = {
  learn: {
    titulo: "Teste offline — não é conteúdo real",
    trilha: "Trilha de Teste",
    modulo: "Módulo de Teste",
    episodios_origem: ["TESTE_LOCAL"],
    introducao_learn: "Introdução de exemplo.",
    pdf: {
      gancho: "Gancho de exemplo.",
      secoes: [{ titulo: "Seção 1", corpo: "Corpo de exemplo." }],
      erros_comuns: ["Erro de exemplo."],
      checklist: ["Item de exemplo."],
      fechamento: "Fechamento de exemplo.",
    },
    video_roteiro: {
      cenas: [
        {
          texto_narrado: "Fala de exemplo.",
          duracao_seg: 420,
          visual: "Tela de exemplo.",
          visual_tipo: "skyline_abertura",
        },
      ],
    },
    mapa_mental_mermaid: "mindmap\n  root((Conceito))\n    Ramo 1",
  },
};

const fixtureInvalidoFaltaCampo = structuredClone(fixtureValido) as Record<string, unknown>;
delete (fixtureInvalidoFaltaCampo.learn as Record<string, unknown>).mapa_mental_mermaid;

const fixtureInvalidoCampoExtra = structuredClone(fixtureValido) as Record<string, unknown>;
(fixtureInvalidoCampoExtra.learn as Record<string, unknown>).campo_inventado = "não deveria existir";

function testar(nome: string, dado: unknown, esperado: "valido" | "invalido") {
  const resultado = learnContratoSchema.safeParse(dado);
  const passou = esperado === "valido" ? resultado.success : !resultado.success;
  console.log(`[${passou ? "OK" : "FALHOU"}] ${nome} — esperado: ${esperado}, obtido: ${resultado.success ? "valido" : "invalido"}`);
  if (!resultado.success && esperado === "invalido") {
    console.log("  motivo (esperado):", resultado.error.issues[0]?.message);
  }
  return passou;
}

const resultados = [
  testar("fixture completo (deve validar)", fixtureValido, "valido"),
  testar("fixture sem mapa_mental_mermaid (deve rejeitar)", fixtureInvalidoFaltaCampo, "invalido"),
  testar("fixture com campo extra (deve rejeitar, .strict())", fixtureInvalidoCampoExtra, "invalido"),
];

if (resultados.every(Boolean)) {
  console.log("\nSchema do contrato JSON do Learn validado com sucesso (offline).");
} else {
  console.error("\nSchema não se comportou como esperado — investigar antes de usar em produção.");
  process.exit(1);
}
