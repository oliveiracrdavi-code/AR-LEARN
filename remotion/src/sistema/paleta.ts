// PALETA OFICIAL AR LEARN — Motion System V2 (Onyx / Carbon / Amarelo /
// Laranja). Cores definitivas de marca, confirmadas por Davi:
//   - ONYX  #020202 — card oficial "Onyx" (RGB 2,2,2), base quase-preta.
//   - AMARELO #F8C848 — medido por pixel do logo oficial A/R (preto sobre
//     amarelo). É a cor de destaque/assinatura da marca.
//   - CARBON — o card "Carbon" é uma TEXTURA halftone escura (não um
//     chapado); representado aqui como superfície carvão + tom de linha
//     para o grid técnico de fundo.
//   - LARANJA — destaque secundário quente, para ênfase/energia.
// Mantida separada da paleta antiga (cores.ts, direção descontinuada) para
// não misturar sistemas: este é o visual novo, baseado no Vídeo 1.
export const ONYX = "#020202";
export const CARBON = "#0E1113"; // superfície carvão um tom acima do onyx
export const CARBON_CLARO = "#171B1E"; // cartões/chips
export const CARBON_LINHA = "rgba(255,255,255,0.05)"; // grid técnico discreto
export const AMARELO = "#F8C848";
export const AMARELO_FORTE = "#FFD84D";
export const LARANJA = "#F2921E";
export const BRANCO = "#FFFFFF";
export const BRANCO_SUAVE = "#E8E8EA";

// Versões em componentes numéricos (para materiais Three.js, que aceitam
// hex/número — evita reconverter em cada cena).
export const ONYX_NUM = 0x020202;
export const AMARELO_NUM = 0xf8c848;
export const LARANJA_NUM = 0xf2921e;
export const CARBON_NUM = 0x171b1e;
