import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "qa/shots";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "m375", width: 375, height: 812, isMobile: true },
  { name: "t768", width: 768, height: 1024, isMobile: false },
  { name: "d1280", width: 1280, height: 900, isMobile: false },
];

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("main").getByRole("button", { name: /войти/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function shot(page, name, fullPage = false) {
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage });
  console.log("✓", file);
}

const browser = await chromium.launch({ channel: "chrome" });

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((t) => {
    localStorage.setItem("ferma-theme", JSON.stringify({ state: { theme: t }, version: 0 }));
  }, theme);

  // ===== Публичные страницы (desktop) =====
  const desktop = await ctx.newPage();
  desktop.on("console", (m) => m.type() === "error" && console.log("CONSOLE-ERR", theme, m.text().slice(0, 200)));
  desktop.on("pageerror", (e) => console.log("PAGE-ERR", theme, String(e).slice(0, 200)));

  await desktop.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1500);
  await shot(desktop, `${theme}-d1280-home`);

  await desktop.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(800);
  await shot(desktop, `${theme}-d1280-catalog`);

  // первая карточка товара
  const firstProduct = await desktop.locator('a[href^="/product/"]').first();
  if (await firstProduct.count()) {
    await firstProduct.click();
    await desktop.waitForTimeout(1200);
    await shot(desktop, `${theme}-d1280-product`);
  }

  await desktop.goto(`${BASE}/farmers`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(800);
  await shot(desktop, `${theme}-d1280-farmers`);

  // мобильный: home + catalog + nav
  for (const vp of VIEWPORTS.filter((v) => v.name !== "d1280")) {
    const ctxM = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      deviceScaleFactor: vp.isMobile ? 2 : 1,
    });
    await ctxM.addInitScript((t) => {
      localStorage.setItem("ferma-theme", JSON.stringify({ state: { theme: t }, version: 0 }));
    }, theme);
    const m = await ctxM.newPage();
    await m.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await m.waitForTimeout(1000);
    await shot(m, `${theme}-${vp.name}-home`);
    await m.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
    await m.waitForTimeout(800);
    await shot(m, `${theme}-${vp.name}-catalog`);
    await ctxM.close();
  }

  // ===== Login (customer demo через farmer + admin) =====
  await login(desktop, "ayana.demo@ferma.kz", "demo1234");
  await desktop.waitForTimeout(600);

  // фермер: dashboard, products
  await desktop.goto(`${BASE}/farmer`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1000);
  await shot(desktop, `${theme}-d1280-farmer-dash`);
  await desktop.goto(`${BASE}/farmer/products`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(800);
  await shot(desktop, `${theme}-d1280-farmer-products`);

  // чат (у фермера могут быть диалоги, может быть пусто — ок)
  await desktop.goto(`${BASE}/chat`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(800);
  await shot(desktop, `${theme}-d1280-chat`);

  // корзина/checkout с товаром
  const p1 = await desktop.locator('a[href^="/product/"]').first();
  if (await p1.count()) {
    await desktop.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
    await desktop.waitForTimeout(500);
    const addBtn = desktop.locator('button[aria-label="Добавить в корзину"]').first();
    if (await addBtn.count()) {
      await addBtn.click();
      await desktop.waitForTimeout(800);
    }
  }
  await desktop.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(800);
  await shot(desktop, `${theme}-d1280-cart`);

  // кабинет
  await desktop.goto(`${BASE}/account/orders`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(800);
  await shot(desktop, `${theme}-d1280-orders`);
  await desktop.goto(`${BASE}/account/profile`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(800);
  await shot(desktop, `${theme}-d1280-profile`);

  // админка (отдельный контекст, чтобы не терять фермерский логин)
  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await adminCtx.addInitScript((t) => {
    localStorage.setItem("ferma-theme", JSON.stringify({ state: { theme: t }, version: 0 }));
  }, theme);
  const admin = await adminCtx.newPage();
  await login(admin, "admin@ferma.kz", "admin123");
  await admin.waitForTimeout(600);
  await admin.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await admin.waitForTimeout(1000);
  await shot(admin, `${theme}-d1280-admin-dash`);
  await admin.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
  await admin.waitForTimeout(800);
  await shot(admin, `${theme}-d1280-admin-orders`);

  await desktop.context().close();
  await adminCtx.close();
}

await browser.close();
console.log("DONE");
