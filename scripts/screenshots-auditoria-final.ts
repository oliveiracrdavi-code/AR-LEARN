// Screenshots — Auditoria Final Completa (Seção B). Desktop 1440 +
// mobile 390, todas as páginas vivas do app. Pressupõe `next start
// -p 3311` com ADMIN_TOKEN=dev-token e VITRINE_PREVIEW=1.
//
// Admin: login real via formulário (token em texto puro na URL foi
// removido de propósito — ver scripts/testar-admin-gate.ts, cenário 6)
// — screenshot tanto do estado bloqueado quanto do painel autorizado.
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3311";
const SLUG_REAL = "a-conta-que-ninguem-faz-ep-171";

const paginasSimples: [string, string][] = [
  ["landing", "/"],
  ["entrar", "/entrar"],
  ["comprar", "/comprar"],
  ["comprar_cancelado", "/comprar?cancelado=1"],
  ["comprar_aguardando", "/comprar/aguardando"],
  ["dashboard_sem_sessao", "/dashboard"],
  ["learn_sem_sessao", `/learns/${SLUG_REAL}`],
  ["privacidade", "/privacidade"],
  ["dev_vitrine_preview", "/dev-vitrine"],
  ["notfound", "/pagina-inexistente"],
  ["admin_bloqueado", "/admin"],
];

// Rola a página inteira antes do print — o hero usa CSS puro (sem
// custo de LCP), mas seções abaixo da dobra (bento, preview da
// vitrine) usam Motion `whileInView` (reveal ao entrar na viewport) e
// só ficam visíveis com um scroll de verdade — um fullPage screenshot
// sem rolar antes mostra a página com essas seções em opacity:0
// (parece "quebrado", mas é só o teste não ter rolado, não um bug).
async function rolarPagina(page: import("playwright").Page) {
  const altura = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < altura; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });

  for (const [nomeVp, vp] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    const page = await browser.newPage({ viewport: vp });

    for (const [nome, rota] of paginasSimples) {
      await page.goto(BASE + rota, { waitUntil: "networkidle" });
      await rolarPagina(page);
      await page.screenshot({ path: `scripts/output/auditoria-final/${nomeVp}_${nome}.png`, fullPage: true });
    }

    // Admin autorizado: login real via form (não ?token=).
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await page.fill('input[name="senha"]', "dev-token");
    await page.click('button[type="submit"]');
    await page.waitForSelector("text=Encerrar sessão de admin");
    await page.waitForTimeout(300);
    await rolarPagina(page);
    await page.screenshot({ path: `scripts/output/auditoria-final/${nomeVp}_admin_autorizado.png`, fullPage: true });

    await page.close();
    console.log("ok:", nomeVp);
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
