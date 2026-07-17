// Screenshots das telas (desktop 1440 + mobile 390) — entregável do
// polimento Phase 3.1. Pressupõe `next start -p 3311` e ADMIN_TOKEN=dev-token.
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3311";
const paginas: [string, string][] = [
  ["landing", "/"],
  ["checkout", "/comprar"],
  ["checkout_cancelado", "/comprar?cancelado=1"],
  ["aguardando", "/comprar/aguardando"],
  ["entrar", "/entrar"],
  ["admin", "/admin?token=dev-token"],
  ["notfound", "/pagina-inexistente"],
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  for (const [nomeVp, vp] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    const page = await browser.newPage({ viewport: vp });
    for (const [nome, rota] of paginas) {
      await page.goto(BASE + rota, { waitUntil: "networkidle" });
      await page.screenshot({ path: `scripts/output/frontend/${nomeVp}_${nome}.png`, fullPage: true });
    }
    await page.close();
    console.log("ok:", nomeVp);
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
