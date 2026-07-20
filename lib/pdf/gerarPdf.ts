import { chromium } from "playwright";
import type { LearnContrato } from "../openrouter/schema";

type Learn = LearnContrato["learn"];

// Parâmetros lidos do generation_config (tipo 'ebook') — a alteração
// GERAL via IA edita esses valores; defaults = o que o código sempre
// gerou. A esteira injeta via lerConfigAtivo("ebook").
export type ParamsEbook = {
  corpo: { tamanho_fonte_px: number; altura_linha: number };
  titulo_px: number;
  subtitulo_px: number;
  margem_px: number;
  espaco_entre_secoes_px: number;
};

export const PARAMS_EBOOK_DEFAULT: ParamsEbook = {
  corpo: { tamanho_fonte_px: 13, altura_linha: 1.5 },
  titulo_px: 24,
  subtitulo_px: 17,
  margem_px: 40,
  espaco_entre_secoes_px: 24,
};

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Estilo provisório, só funcional (Regra combinada: paleta final e
// polimento visual ficam para o prompt de design, mais à frente).
//
// O PDF contém só o conteúdo textual do resumo (gancho, seções, erros
// comuns, checklist, fechamento) — o mapa mental é um ativo TOTALMENTE
// separado (Markmap interativo + imagem via Kroki), nunca embutido
// aqui. Ajuste explícito de Davi em 2026-07-04: cada ativo (PDF, mapa
// mental, vídeo) é sua própria seção/link na tela do Learn.
function construirHtml(learn: Learn, p: ParamsEbook): string {
  const secoesHtml = learn.pdf.secoes
    .map(
      (secao) => `
        <section class="secao">
          <h2>${escaparHtml(secao.titulo)}</h2>
          <p>${escaparHtml(secao.corpo)}</p>
        </section>`
    )
    .join("\n");

  const errosHtml = learn.pdf.erros_comuns
    .map((erro) => `<li>${escaparHtml(erro)}</li>`)
    .join("\n");

  const checklistHtml = learn.pdf.checklist
    .map((item) => `<li>${escaparHtml(item)}</li>`)
    .join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: ${p.margem_px}px; }
  h1 { font-size: ${p.titulo_px}px; margin-bottom: 4px; }
  .trilha-modulo { color: #666; font-size: ${p.corpo.tamanho_fonte_px}px; margin-bottom: 20px; }
  .gancho { font-size: ${p.corpo.tamanho_fonte_px + 2}px; font-style: italic; margin-bottom: ${p.espaco_entre_secoes_px}px; }
  .secao { margin-bottom: ${p.espaco_entre_secoes_px}px; }
  .secao h2 { font-size: ${p.subtitulo_px}px; margin-bottom: 4px; }
  .secao p { font-size: ${p.corpo.tamanho_fonte_px}px; line-height: ${p.corpo.altura_linha}; margin-top: 0; }
  h3 { font-size: ${p.subtitulo_px - 2}px; margin-bottom: 6px; }
  ul { font-size: ${p.corpo.tamanho_fonte_px}px; line-height: ${p.corpo.altura_linha}; }
  .fechamento { margin-top: ${p.espaco_entre_secoes_px}px; font-weight: bold; }
</style>
</head>
<body>
  <h1>${escaparHtml(learn.titulo)}</h1>
  <div class="trilha-modulo">${escaparHtml(learn.trilha)} / ${escaparHtml(learn.modulo)}</div>
  <p class="gancho">${escaparHtml(learn.pdf.gancho)}</p>

  ${secoesHtml}

  <h3>Erros comuns</h3>
  <ul>${errosHtml}</ul>

  <h3>Checklist</h3>
  <ul>${checklistHtml}</ul>

  <p class="fechamento">${escaparHtml(learn.pdf.fechamento)}</p>
</body>
</html>`;
}

export async function gerarPdfDoLearn(
  learn: Learn,
  caminhoSaida: string,
  params: ParamsEbook = PARAMS_EBOOK_DEFAULT
): Promise<void> {
  const html = construirHtml(learn, params);

  // Usa o Chromium já pré-instalado no ambiente de dev (evita tentar
  // baixar uma revisão nova, que não teria acesso de rede pra isso).
  // Em produção/CI, sem essa env var, o Playwright usa a revisão que
  // ele mesmo baixar normalmente.
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined
  );
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({ path: caminhoSaida, format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
}
