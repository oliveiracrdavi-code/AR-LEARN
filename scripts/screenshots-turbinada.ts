// Screenshots da landing institucional + vitrine (desktop 1440 / mobile 390).
// Nota: no fullPage o header sticky é convertido em static só na captura
// (artefato conhecido do screenshot de página inteira); o shot "hero" em
// viewport mostra o header glass na posição real.
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3311";
const alvos: [string, string, string][] = [
  ["landing", "/", "landing_v2"],
  ["vitrine", "/dev-vitrine", "dashboard_vitrine"],
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  for (const [nome, rota, pasta] of alvos) {
    for (const [vpNome, vp] of [
      ["desktop", { width: 1440, height: 900 }],
      ["mobile", { width: 390, height: 844 }],
    ] as const) {
      const page = await browser.newPage({ viewport: vp });
      await page.goto(BASE + rota, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      await page.evaluate(async () => {
        // passo a passo pra disparar todos os reveals whileInView
        const alturaTotal = document.body.scrollHeight;
        for (let y = 0; y < alturaTotal; y += Math.round(window.innerHeight * 0.7)) {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
          await new Promise((r) => setTimeout(r, 220));
        }
        window.scrollTo({ top: alturaTotal, behavior: "instant" as ScrollBehavior });
        await new Promise((r) => setTimeout(r, 500));
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        await new Promise((r) => setTimeout(r, 600));
      });
      // hero em viewport (header sticky na posição real)
      await page.screenshot({ path: `scripts/output/${pasta}/${vpNome}_${nome}_hero.png` });
      // página inteira (sticky -> static só pra captura)
      await page.addStyleTag({ content: ".cabecalho-glass{position:static !important;}" });
      await page.screenshot({
        path: `scripts/output/${pasta}/${vpNome}_${nome}.png`,
        fullPage: true,
      });
      await page.close();
      console.log("ok:", pasta, vpNome);
    }
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
