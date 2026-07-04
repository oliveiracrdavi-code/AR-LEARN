import { chromium } from "playwright";
import type { LearnContrato } from "../openrouter/schema";

type Learn = LearnContrato["learn"];

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Estilo provisório, só funcional (Regra combinada: paleta final e
// polimento visual ficam para o prompt de design, mais à frente).
function construirHtml(learn: Learn, mapaMentalSvg?: string): string {
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
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 40px; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .trilha-modulo { color: #666; font-size: 13px; margin-bottom: 20px; }
  .gancho { font-size: 15px; font-style: italic; margin-bottom: 24px; }
  .secao h2 { font-size: 17px; margin-bottom: 4px; }
  .secao p { font-size: 13px; line-height: 1.5; margin-top: 0; }
  h3 { font-size: 15px; margin-bottom: 6px; }
  ul { font-size: 13px; line-height: 1.5; }
  .fechamento { margin-top: 24px; font-weight: bold; }
  .mapa { margin: 24px 0; text-align: center; }
  .mapa img, .mapa svg { max-width: 100%; }
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

  ${mapaMentalSvg ? `<div class="mapa">${mapaMentalSvg}</div>` : ""}

  <p class="fechamento">${escaparHtml(learn.pdf.fechamento)}</p>
</body>
</html>`;
}

export async function gerarPdfDoLearn(
  learn: Learn,
  caminhoSaida: string,
  opcoes?: { mapaMentalSvg?: string }
): Promise<void> {
  const html = construirHtml(learn, opcoes?.mapaMentalSvg);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({ path: caminhoSaida, format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
}
