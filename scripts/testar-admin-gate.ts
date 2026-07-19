// Teste do gate do /admin: sem token bloqueia; token errado bloqueia com
// erro; token certo (form -> cookie) libera; sessão persiste; sair volta
// a bloquear. Query param ?token= (compat) também libera.
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3311";

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage();

  // 1. Sem token: formulário de acesso restrito, sem tabelas
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  if (!(await page.getByText("Acesso restrito").isVisible())) throw new Error("1: deveria bloquear");
  if (await page.getByText("Encerrar sessão de admin").isVisible()) throw new Error("1: vazou painel");
  console.log("ok 1: sem token bloqueia");

  // 2. Token errado
  await page.fill('input[name="senha"]', "senha-errada");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin?erro=1");
  if (!(await page.getByText("Token incorreto").isVisible())) throw new Error("2: sem msg de erro");
  console.log("ok 2: token errado bloqueia com aviso");

  // 3. Token certo -> cookie -> painel (marcador: botão de sair; as
  // tabelas dependem de rede pro Supabase, bloqueada no sandbox)
  await page.fill('input[name="senha"]', "dev-token");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/admin`);
  await page.waitForSelector("text=Encerrar sessão de admin");
  console.log("ok 3: token certo libera o painel");

  // 4. Sessão persiste em nova navegação (cookie)
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  if (!(await page.getByText("Encerrar sessão de admin").isVisible())) throw new Error("4: cookie não persistiu");
  console.log("ok 4: sessão por cookie persiste");

  // 5. Encerrar sessão -> bloqueia de novo
  await page.click("text=Encerrar sessão de admin");
  await page.waitForSelector("text=Acesso restrito");
  console.log("ok 5: sair volta a bloquear");

  // 6. ?token= NÃO libera mais (removido: ecoava o token no payload RSC)
  await page.goto(`${BASE}/admin?token=dev-token`, { waitUntil: "networkidle" });
  if (!(await page.getByText("Acesso restrito").isVisible())) throw new Error("6: query param ainda libera");
  console.log("ok 6: ?token= não libera (removido de propósito)");

  // 7. No fluxo correto (form + cookie), o token NUNCA aparece no HTML —
  // nem na tela bloqueada, nem na autorizada. (Se o usuário colocar o
  // token numa URL, o Next ecoa a URL requisitada no estado do router,
  // como qualquer servidor ecoa a request — foi justamente por isso que
  // o auth por ?token= foi removido no cenário 6.)
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  const htmlBloqueado = await page.content();
  await page.fill('input[name="senha"]', "dev-token");
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Encerrar sessão de admin");
  const htmlAutorizado = await page.content();
  if (htmlBloqueado.includes("dev-token") || htmlAutorizado.includes("dev-token")) {
    throw new Error("7: token vazou no HTML");
  }
  console.log("ok 7: token não vaza no HTML no fluxo form+cookie");

  await browser.close();
  console.log("\nGATE DO ADMIN: todos os 7 cenários passaram.");
})().catch((e) => {
  console.error("FALHOU:", e);
  process.exit(1);
});
