// Piso de duração do vídeo (Regra de Ouro do projeto — CLAUDE.md /
// docs/stack.md). Fonte única — importado tanto pelo cérebro (valida a
// ESTIMATIVA de duracao_seg do roteiro) quanto pela síntese de TTS
// (valida a duração REAL medida da narração, que sai mais curta que a
// estimativa — o Edge TTS fala mais rápido do que o LLM assume).
export const DURACAO_MINIMA_VIDEO_SEG = 420;
