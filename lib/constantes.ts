// Piso de duração do vídeo (Regra de Ouro do projeto — CLAUDE.md /
// docs/stack.md). Fonte única — importado tanto pelo cérebro (valida a
// ESTIMATIVA de duracao_seg do roteiro) quanto pela síntese de TTS
// (valida a duração REAL medida da narração, que sai mais curta que a
// estimativa — o Edge TTS fala mais rápido do que o LLM assume).
export const DURACAO_MINIMA_VIDEO_SEG = 420;

// Velocidade REAL medida da voz oficial (pt-BR-AntonioNeural, Edge
// TTS): ~17,8 caracteres/segundo. Pedir pro LLM aplicar essa taxa
// sozinho no duracao_seg de cada cena não é confiável (testado: o
// modelo continuou "chutando" por intuição, ~10-12 char/seg, mesmo com
// a fórmula explícita no prompt) — por isso o duracao_seg usado no
// gate de validação é RECALCULADO aqui em código a partir do
// texto_narrado real de cada cena, sobrescrevendo o que o LLM
// escreveu, em vez de confiar na aritmética embutida no prompt.
export const TAXA_CARACTERES_POR_SEGUNDO_ANTONIO = 17.8;

// Duração de uma cena de vídeo: piso ABSOLUTO de 5s; acima disso,
// proporcional ao tempo de LEITURA confortável da legenda (não à
// estimativa de narração). Taxa de leitura tranquila ~16 char/s (mais
// lenta que a fala do Antonio a 17,8 — então a cena sempre dura o
// bastante para a narração terminar sem corte). Determinístico.
export const PISO_DURACAO_CENA_SEG = 5;
export const TAXA_LEITURA_CPS = 16;

export function duracaoCenaSegundos(legenda: string): number {
  const porLeitura = legenda.length / TAXA_LEITURA_CPS;
  return Math.max(PISO_DURACAO_CENA_SEG, porLeitura);
}
