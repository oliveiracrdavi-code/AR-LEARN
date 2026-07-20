import { chromium } from "playwright";
const BASE = "http://127.0.0.1:3311";
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // landing com CSP (sanidade)
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "scripts/output/admin_final/landing_com_csp.png" });
  // gate
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "scripts/output/admin_final/admin_gate.png" });
  // login e painel
  await page.fill('input[name="senha"]', "dev-token");
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Encerrar sessão de admin");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scripts/output/admin_final/admin_logado.png", fullPage: true });
  await browser.close();
  console.log("ok screenshots");
})().catch((e) => { console.error(e); process.exit(1); });
