// Screenshots da landing turbinada + vitrine (desktop 1440 / mobile 390).
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
      // deixa as animações de entrada terminarem e força os reveals
      await page.waitForTimeout(900);
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 700));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 400));
      });
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
