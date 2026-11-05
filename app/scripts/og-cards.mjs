// Builds the 1200 × 630 social cards in public/og/ from a running local copy of the app, using the card texts in
// src/lib/seo.ts and live captures of each topic (feed list, map, globe in depth view, science visuals).
//
//   OG_CARDS=1 npm run build && OG_CARDS=1 npx next start -p 3100     (in another terminal)
//   node scripts/og-cards.mjs [http://localhost:3100] [card …]
//
// Needs Playwright with Chromium (npx playwright install chromium). The home card (home.jpg) is kept as it is
// unless "home" is named. Earthquake data is whatever the local server is serving.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Playwright is not a project dependency: require() also finds a global install (NODE_PATH=$(npm root -g)).
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:3100';
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('http'));
const OUT = fileURLToPath(new URL('../public/og/', import.meta.url));
const BG = '#100c1d';

const browser = await chromium.launch();
const cards = await (await fetch(BASE + '/api/og-cards')).json();

/** A dark phone-sized page of the app, past onboarding and the splash. */
async function appPage(path, { width = 412, height = 760, scale = 2 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'en-US' });
  await ctx.addInitScript(() => { localStorage.setItem('sisma.onboarded', '9'); sessionStorage.setItem('sisma.splash', '1'); });
  await ctx.route('https://tile.openstreetmap.org/**', r => r.abort());
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  return page;
}
const png = buf => 'data:image/png;base64,' + buf.toString('base64');

/** Picture for each card: { src, bleed } where bleed = transparent image drawn without a frame. */
const visuals = {
  async feed() {
    const p = await appPage('/app');
    await p.getByText('Strongest', { exact: true }).first().click(); await p.waitForTimeout(800);
    const seg = await p.getByText('Strongest', { exact: true }).first().boundingBox();
    const src = png(await p.screenshot({ clip: { x: 0, y: seg.y + seg.height + 14, width: 412, height: 450 } }));
    await p.context().close(); return { src };
  },
  async map() {
    const p = await appPage('/app/map', { width: 640, height: 640 });
    await p.addStyleTag({ content: '[data-filter-panel]{display:none!important} button{visibility:hidden!important}' });
    const src = png(await p.screenshot({ clip: { x: 0, y: 64, width: 640, height: 520 } }));
    await p.context().close(); return { src };
  },
  async globe() {
    const p = await appPage('/app/globe', { width: 560, height: 760 });
    const handle = p.locator('[data-filter-panel] button').first();
    await handle.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    await p.getByRole('switch', { name: /Depth/ }).click(); await p.waitForTimeout(1200);
    await p.addStyleTag({ content: 'html,body,*{background:transparent!important} body *:not(canvas){visibility:hidden!important} canvas{visibility:visible!important}' });
    await p.waitForTimeout(300);
    const src = png(await p.locator('canvas').first().screenshot({ omitBackground: true }));
    await p.context().close(); return { src, bleed: true };
  },
  async science() {
    const parts = [];
    for (const id of ['plates', 'faults', 'waves', 'tsunami']) parts.push((await articleVisual(id)).src);
    return { grid: parts };
  },
};
/** The article's illustration (canvas or widget): the block after the intro. */
async function articleVisual(id) {
  const p = await appPage('/app/science/' + id, { width: 412, height: 900 });
  await p.waitForTimeout(1500);
  const src = png(await p.locator('article > *').nth(3).screenshot());
  await p.context().close(); return { src };
}

/** Lays out one card: logo, kicker, heading, sub line and URL on the left; the picture on the right. */
async function render(key, card, vis) {
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
  await page.goto(BASE + '/terms');
  const faces = await page.evaluate(() => [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } })
    .filter(r => r instanceof CSSFontFaceRule && /Figtree/.test(r.style.fontFamily)).map(r => r.cssText).join('\n'));
  const icon = await (await fetch(BASE + '/icon.svg')).text();
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const frame = 'border-radius:28px;border:1px solid rgba(255,255,255,.10);box-shadow:0 30px 80px rgba(0,0,0,.45)';
  const picture = vis.bleed
    ? `<img src="${vis.src}" style="position:absolute;right:-120px;top:50%;transform:translateY(-50%);height:700px">`
    : vis.grid
      ? `<div style="position:absolute;right:56px;top:50%;transform:translateY(-50%);display:grid;grid-template-columns:250px 250px;gap:14px">${vis.grid.map(s => `<div style="width:250px;height:230px;overflow:hidden;${frame};background:#191431"><img src="${s}" style="width:100%;height:100%;object-fit:cover"></div>`).join('')}</div>`
      : `<div style="position:absolute;right:56px;top:50%;transform:translateY(-50%);width:500px;max-height:500px;overflow:hidden;${frame};background:#191431"><img src="${vis.src}" style="width:100%;display:block"></div>`;
  const url = 'sisma.io' + (card.path === '/' ? '' : card.path);
  await page.setContent(`<html><head><style>${faces} html,body{margin:0;font-family:Figtree,sans-serif}</style></head><body>
    <div style="position:fixed;inset:0;background:radial-gradient(circle at 900px 315px,#2e2275 0,${BG} 520px);overflow:hidden">
      ${picture}
      <div style="position:absolute;left:68px;top:64px;bottom:60px;width:${vis.bleed ? 600 : 540}px;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:14px"><div style="width:52px;height:52px">${icon}</div><div style="font-size:40px;font-weight:800;color:#fff">sisma</div></div>
        <div style="margin-top:auto;font-size:22px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a996ff">${esc(card.kicker)}</div>
        <div style="margin-top:12px;font-size:58px;font-weight:800;color:#fff;line-height:1.05;letter-spacing:-1px">${esc(card.heading)}</div>
        <div style="margin-top:20px;font-size:26px;color:#cfc8f2;line-height:1.35">${esc(card.sub)}</div>
        <div style="margin-top:auto;padding-top:24px;font-size:22px;font-weight:700;color:#a996ff">${esc(url)}</div>
      </div>
    </div></body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(OUT + key + '.jpg', await page.screenshot({ type: 'jpeg', quality: 88 }));
  await page.context().close();
  console.log('og/' + key + '.jpg');
}

for (const [key, card] of Object.entries(cards)) {
  if (ONLY.length ? !ONLY.includes(key) : (key === 'home' || !card.heading)) continue;
  const vis = key.startsWith('science-') ? await articleVisual(key.slice(8)) : await visuals[key]?.();
  if (!vis) { console.warn('no picture for', key); continue; }
  await render(key, card, vis);
}
await browser.close();
