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
