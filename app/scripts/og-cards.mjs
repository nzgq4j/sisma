// Builds the 1200 × 630 social cards in public/og/ from a running local copy of the app, using the card texts in
// src/lib/seo.ts and live captures of each topic (feed list, map, globe in depth view, science visuals; In Depth
// articles use the science illustration closest to their subject, LIBRARY_VISUAL).
//
//   OG_CARDS=1 npm run build && OG_CARDS=1 npx next start -p 3100     (in another terminal)
//   node scripts/og-cards.mjs [http://localhost:3100] [card …]
//
// Needs Playwright with Chromium (npx playwright install chromium). The home card (home.jpg) is kept as it is
// unless "home" is named. Earthquake data is whatever the local server is serving.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

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
  // In Depth (the long-form library): four of the illustrations its articles build on.
  async library() {
    const parts = [];
    for (const id of ['plates', 'faults', 'waves', 'depth']) parts.push((await articleVisual(id)).src);
    return { grid: parts };
  },
};
/** In Depth articles (library-<id> cards) take the science illustration closest to their subject. */
const LIBRARY_VISUAL = {
  'earthquake-prediction': 'mag', 'plate-tectonics-subduction': 'plates', 'faults-and-stress': 'faults',
  'earth-interior-seismic-waves': 'waves', 'aftershocks-and-hazards': 'depth',
  // "article:Tab" picks a tab of the illustration first (English tab label).
  'surface-waves-and-damage': 'waves:Surface', 'magnitude-scales': 'mag',
  'deep-focus-earthquakes': 'plates', 'volcano-seismology': 'ring',
};
/** In Depth articles with a picture of their own instead of a science illustration. */
const LIBRARY_CUSTOM = { 'italian-earthquakes': italyMap };

/**
 * Outline of Italy (world-atlas 50m) with the M6+ earthquakes of the Apennines since 1279 from the INGV CPTI15 v4.0
 * catalogue (scripts/data/italy-apennines-cpti15.json), sized by magnitude, in the app's dark map colours.
 */
function italyMap() {
  const req = createRequire(import.meta.url);
  const world = req('world-atlas/countries-50m.json');
  const { events } = req('./data/italy-apennines-cpti15.json');
  const countries = feature(world, world.objects.countries).features;
  const italy = countries.find(f => f.id === '380');
  const W = 500, H = 560;
  const proj = geoMercator().fitExtent([[6, 70], [W - 70, H - 58]], italy);
  const path = geoPath(proj);
  const others = countries.filter(f => f !== italy).map(f => path(f)).filter(Boolean).join('');
  const r = m => 5 + (m - 6) * 9;
  const color = m => (m >= 7 ? '#B5179E' : '#EE4266');
  const dots = [...events].sort((a, b) => b.mw - a.mw).map(e => {
    const [x, y] = proj([e.lon, e.lat]);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r(e.mw).toFixed(1)}" fill="${color(e.mw)}" fill-opacity="0.82" stroke="#0C1E36" stroke-width="1.5"/>`;
  }).join('');
  // A few of the events the article discusses, labelled on the Adriatic side with a short leader line.
  // Right-aligned to the panel edge on the Adriatic side, name over magnitude, with a leader line to the dot.
  const LABELS = [['2016-10-30', 'Norcia 2016', 150], ['2009-04-06', "L'Aquila 2009", 218], ['1915-01-13', 'Marsica 1915', 286], ['1980-11-23', 'Irpinia 1980', 380]];
  const labels = LABELS.map(([date, text, ty]) => {
    const e = events.find(v => v.date === date); const [x, y] = proj([e.lon, e.lat]);
    const tx = W - 16, left = tx - text.length * 10.2;
    return `<path d="M${(x + r(e.mw) * 0.75).toFixed(1)} ${(y - r(e.mw) * 0.4).toFixed(1)}L${(left - 8).toFixed(1)} ${(ty - 6).toFixed(1)}" stroke="#E4DFF5" stroke-opacity="0.75" stroke-width="1.5" fill="none"/>
<text x="${tx}" y="${ty}" text-anchor="end" font-size="19" font-weight="700" fill="#F2EFFB" stroke="#0C1E36" stroke-width="4" paint-order="stroke">${text}</text>
<text x="${tx}" y="${ty + 21}" text-anchor="end" font-size="16" font-weight="600" fill="#A9A2C6" stroke="#0C1E36" stroke-width="4" paint-order="stroke">Mw ${e.mw.toFixed(1)}</text>`;
  }).join('');
  const legend = (y, x, m, t) => `<circle cx="${x}" cy="${y - 6}" r="${r(m)}" fill="${color(m)}" fill-opacity="0.82"/><text x="${x + 18}" y="${y}" font-size="17" font-weight="600" fill="#E4DFF5">${t}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block">
<rect width="${W}" height="${H}" fill="#0C1E36"/>
<path d="${others}" fill="#173A2A" fill-opacity="0.55" stroke="#2C5443" stroke-width="1"/>
<path d="${path(italy)}" fill="#1E4A35" stroke="#8FD1B0" stroke-width="2.5" stroke-linejoin="round"/>
${dots}${labels}
<rect width="${W}" height="62" fill="#191431" fill-opacity="0.92"/>
<text x="24" y="38" font-size="19" font-weight="700" fill="#CFC8F2">${events.length} M6+ earthquakes in the Apennines since ${Math.min(...events.map(e => e.year))}</text>
<rect y="${H - 52}" width="${W}" height="52" fill="#191431" fill-opacity="0.92"/>
${legend(H - 20, 30, 6.5, 'M6–6.9')}${legend(H - 20, 150, 7.1, 'M7+')}
<text x="${W - 24}" y="${H - 20}" text-anchor="end" font-size="15" fill="#A9A2C6">INGV CPTI15 catalogue</text></svg>`;
  return { svg };
}

/** The article's illustration (canvas or widget): the block after the intro. */
async function articleVisual(spec) {
  const [id, tab] = spec.split(':');
  const p = await appPage('/app/science/' + id, { width: 412, height: 900 });
  if (tab) await p.locator('article').getByRole('button', { name: tab, exact: true }).first().click();
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
      : vis.svg
        ? `<div style="position:absolute;right:56px;top:50%;transform:translateY(-50%);width:500px;overflow:hidden;${frame};background:#191431">${vis.svg}</div>`
        : `<div style="position:absolute;right:56px;top:50%;transform:translateY(-50%);width:500px;max-height:500px;overflow:hidden;${frame};background:#191431"><img src="${vis.src}" style="width:100%;display:block"></div>`;
  const url = 'sisma.io' + (card.path === '/' ? '' : card.path);
  // Long titles (In Depth articles) get a smaller heading and a shorter sub line, so nothing runs into the logo or the
  // address; a long address gets a smaller size so it stays on one line.
  const hl = card.heading.length, headSize = hl <= 30 ? 58 : hl <= 48 ? 50 : 42;
  const sub = hl > 48 ? card.sub.replace(/^(.{0,90}\S*).*$/s, (m, a) => (a.length < card.sub.length ? a.replace(/[\s,;:.–—-]+$/, '') + '…' : a)) : card.sub;
  const urlSize = url.length > 44 ? 17 : 22;
  await page.setContent(`<html><head><style>${faces} html,body{margin:0;font-family:Figtree,sans-serif}</style></head><body>
    <div style="position:fixed;inset:0;background:radial-gradient(circle at 900px 315px,#2e2275 0,${BG} 520px);overflow:hidden">
      ${picture}
      <div style="position:absolute;left:68px;top:64px;bottom:60px;width:${vis.bleed ? 600 : 540}px;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:14px"><div style="width:52px;height:52px">${icon}</div><div style="font-size:40px;font-weight:800;color:#fff">sisma</div></div>
        <div style="margin-top:auto;font-size:22px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a996ff">${esc(card.kicker)}</div>
        <div style="margin-top:12px;font-size:${headSize}px;font-weight:800;color:#fff;line-height:1.05;letter-spacing:-1px">${esc(card.heading)}</div>
        <div style="margin-top:20px;font-size:${hl > 48 ? 23 : 26}px;color:#cfc8f2;line-height:1.35">${esc(sub)}</div>
        <div style="margin-top:auto;padding-top:24px;font-size:${urlSize}px;font-weight:700;color:#a996ff;white-space:nowrap">${esc(url)}</div>
      </div>
    </div></body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(OUT + key + '.jpg', await page.screenshot({ type: 'jpeg', quality: 88 }));
  await page.context().close();
  console.log('og/' + key + '.jpg');
}

for (const [key, card] of Object.entries(cards)) {
  if (ONLY.length ? !ONLY.includes(key) : (key === 'home' || !card.heading)) continue;
  const vis = key.startsWith('science-') ? await articleVisual(key.slice(8))
    : key.startsWith('library-') ? (LIBRARY_CUSTOM[key.slice(8)]?.() ?? await articleVisual(LIBRARY_VISUAL[key.slice(8)] ?? 'plates'))
      : await visuals[key]?.();
  if (!vis) { console.warn('no picture for', key); continue; }
  await render(key, card, vis);
}
await browser.close();
