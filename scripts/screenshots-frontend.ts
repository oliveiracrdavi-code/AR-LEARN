// Screenshots das telas principais do Academy (entregável Phase 3).
// Pressupõe `next start -p 3311` rodando e ADMIN_TOKEN=dev-token.
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3311";
const paginas: [string, string][] = [
  ["landing", "/"],
  ["checkout", "/comprar"],
  ["aguardando", "/comprar/aguardando"],
  ["admin", "/admin?token=dev-token"],
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [nome, rota] of paginas) {
    await page.goto(BASE + rota, { waitUntil: "networkidle" });
    await page.screenshot({ path: `scripts/output/frontend/tela_${nome}.png`, fullPage: true });
    console.log("shot:", nome);
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
