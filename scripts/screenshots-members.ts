// Screenshots dos estados da área de membros (deslogado) — entregável do
// fechamento de Auth. Pressupõe `next start -p 3311`.
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3311";
const paginas: [string, string][] = [
  ["dashboard_deslogado", "/dashboard"],
  ["learn_deslogado", "/learns/a-conta-que-ninguem-faz-ep-171"],
  ["entrar", "/entrar"],
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [nome, rota] of paginas) {
    await page.goto(BASE + rota, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `scripts/output/members/${nome}.png`, fullPage: true });
    console.log("ok:", nome);
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
