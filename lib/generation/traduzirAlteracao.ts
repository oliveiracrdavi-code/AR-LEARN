// Tradutor da alteração GERAL: linguagem natural do admin -> mudança
// concreta no JSON do generation_config. A IA NÃO edita código — edita
// o config que os geradores já consomem. Economia de tokens (regras do
// prompt): contexto mínimo (só o config atual + instrução, nunca
// transcrição/conteúdo) e modelo BARATO para tarefa simples de
// parâmetro — o modelo robusto fica só pra estruturação de episódio.
import { jsonrepair } from "jsonrepair";
import { SCHEMAS, type TipoAsset } from "./config";

const MODELO_ALTERACOES =
  process.env.OPENROUTER_MODEL_ALTERACOES || "google/gemini-2.5-flash-lite";

export type Traducao = {
  params: unknown;
  explicacao: string;
  tokens_entrada: number;
  tokens_saida: number;
  modelo: string;
};

export async function traduzirAlteracaoGeral(
  tipo: TipoAsset,
  paramsAtuais: unknown,
  instrucao: string
): Promise<Traducao> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO_ALTERACOES,
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content:
            `Você edita a configuração de geração de ${tipo} de uma plataforma. ` +
            `Receberá o JSON atual e uma instrução em português. Devolva SOMENTE um JSON: ` +
            `{"params": <o JSON COMPLETO com a mudança aplicada, mantendo todas as chaves existentes>, ` +
            `"explicacao": "<1-2 frases em pt-BR do que mudou e o efeito prático>"}. ` +
            `Não invente chaves novas; altere apenas valores das chaves existentes. ` +
            `Se a instrução não se aplicar a nenhuma chave, devolva params IGUAL ao atual e explique o porquê na explicacao.`,
        },
        {
          role: "user",
          content: `Config atual:\n${JSON.stringify(paramsAtuais)}\n\nInstrução: ${instrucao}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter falhou: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  let bruto: { params?: unknown; explicacao?: string };
  const conteudo = json.choices[0].message.content;
  try {
    bruto = JSON.parse(conteudo);
  } catch {
    bruto = JSON.parse(jsonrepair(conteudo));
  }

  // Gate de segurança: o schema .strict() garante que a IA só mexeu em
  // parâmetros reais dentro dos limites (piso de 7min não desce etc.).
  const params = SCHEMAS[tipo].parse(bruto.params);

  return {
    params,
    explicacao: typeof bruto.explicacao === "string" ? bruto.explicacao : "Mudança aplicada.",
    tokens_entrada: json.usage?.prompt_tokens ?? 0,
    tokens_saida: json.usage?.completion_tokens ?? 0,
    modelo: MODELO_ALTERACOES,
  };
}

// Chat de alteração INDIVIDUAL: mexe só num Learn específico. A IA
// devolve mudanças de CAMPOS (título/descrição) e/ou pedido de
// REGERAÇÃO de assets — nunca toca o config geral. Contexto mínimo:
// só os campos leves do learn + a conversa.
export type MudancaIndividual = {
  campos: { titulo?: string; resumo?: string };
  regenerar: TipoAsset[];
  resposta: string;
  tokens_entrada: number;
  tokens_saida: number;
  modelo: string;
};

export async function conversarAlteracaoIndividual(
  learn: { titulo: string; resumo: string | null },
  mensagens: { role: "user" | "assistant"; content: string }[]
): Promise<MudancaIndividual> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO_ALTERACOES,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content:
            `Você é o assistente de alteração de UM conteúdo específico ("Learn") de uma plataforma. ` +
            `Learn atual: ${JSON.stringify(learn)}. ` +
            `Responda SOMENTE JSON: {"campos": {"titulo"?: string, "resumo"?: string}, ` +
            `"regenerar": ["video"|"ebook"|"mindmap", ...], "resposta": "<resposta curta em pt-BR pro admin>"}. ` +
            `"campos" só com o que deve mudar AGORA (vazio se nada); "regenerar" só com os assets que a mudança ` +
            `pedida exige reprocessar na esteira (ex.: corrigir um dado do vídeo => ["video","ebook","mindmap"]); ` +
            `"resposta" explica o que foi feito ou pergunta o que faltar. Nunca invente dados do episódio.`,
        },
        ...mensagens,
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter falhou: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  let bruto: Partial<MudancaIndividual>;
  const conteudo = json.choices[0].message.content;
  try {
    bruto = JSON.parse(conteudo);
  } catch {
    bruto = JSON.parse(jsonrepair(conteudo));
  }

  const regenerar = Array.isArray(bruto.regenerar)
    ? (bruto.regenerar.filter((t) => ["video", "ebook", "mindmap"].includes(t as string)) as TipoAsset[])
    : [];
  const campos: MudancaIndividual["campos"] = {};
  const camposBrutos = (bruto.campos ?? {}) as Record<string, unknown>;
  if (typeof camposBrutos.titulo === "string" && camposBrutos.titulo.trim()) campos.titulo = camposBrutos.titulo.trim();
  if (typeof camposBrutos.resumo === "string") campos.resumo = camposBrutos.resumo.trim();

  return {
    campos,
    regenerar,
    resposta: typeof bruto.resposta === "string" ? bruto.resposta : "Feito.",
    tokens_entrada: json.usage?.prompt_tokens ?? 0,
    tokens_saida: json.usage?.completion_tokens ?? 0,
    modelo: MODELO_ALTERACOES,
  };
}
