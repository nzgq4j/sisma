// Store screenshots, step 1: the app's own screens in every language and device size, from a running copy of the app
// (dark theme, location Tokyo, miles for English and kilometres otherwise, times in UTC). Written to
// out/screens/<locale>/<device>/<n>-<name>.png; step 2 (compose-store.mjs) puts them in frames with headlines.
//
//   (in app/) npm run build && npx next start -p 3100
//   NODE_PATH=$(npm root -g) node mobile/store/capture-screens.mjs [http://localhost:3100] [locale …]
//
// The Play listing used a copy of the app serving the 26 Oct – 2 Nov 2026 earthquakes with the times moved forward so
// the newest is 25 minutes old. Japanese and Chinese need a CJK font on the machine (fonts-noto-cjk), as on Android.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(new URL('../../app/package.json', import.meta.url));
const { chromium } = require('playwright');

const BASE = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:3100';
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('http'));
export const LOCALES = { en: 'en-US', es: 'es-ES', ja: 'ja-JP', id: 'id-ID', tr: 'tr-TR', it: 'it-IT', pt: 'pt-BR', zh: 'zh-CN', fr: 'fr-FR', de: 'de-DE' };
/** CSS viewport and pixel ratio of each device's screen (phone and 7" use the phone layout, 10" the wide one). */
export const DEVICES = {
  phone: { width: 360, height: 640, dpr: 3, mobile: true },
  tablet7: { width: 600, height: 960, dpr: 2, mobile: true },
  tablet10: { width: 1024, height: 1638, dpr: 1.5, mobile: false },
};
const REGION = 'usgs:us7000tu4f'; // M6.2 Vanuatu: region view with nearby events

const messages = l => JSON.parse(readFileSync(new URL(`../../app/src/i18n/messages/${l}.json`, import.meta.url), 'utf8'));
const togglePanel = async p => { const h = p.locator('[data-filter-panel] button').first(); await h.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(700); };

/** The eight screens: [name, path, action(page, messages, device)]. */
const SCREENS = [
  ['feed', '/app', async (p, m, d) => { if (d !== 'tablet10') { await p.getByRole('button', { name: m.sort_mag, exact: true }).first().click(); await p.waitForTimeout(800); } }],
  ['detail', '/app', async (p, m, d) => {
    if (d === 'tablet10') { await p.getByRole('button').filter({ hasText: m.dash.strongest }).first().click(); await p.waitForTimeout(1500); return; }
    await p.getByRole('button', { name: m.sort_mag, exact: true }).first().click(); await p.waitForTimeout(600);
    await p.locator('button[style*="border-radius: 18"]').nth(1).click(); await p.waitForTimeout(1500);
  }],
  ['map', '/app/map', null],
  ['region', `/app/map?focus=${encodeURIComponent(REGION)}`, null],
  ['globe', '/app/globe', null],
  ['depth', '/app/globe', async (p, m) => {
    await togglePanel(p); await p.getByRole('switch', { name: new RegExp(m.depth_view) }).first().click(); await p.waitForTimeout(400);
    await togglePanel(p); await togglePanel(p); await p.waitForTimeout(1200);
  }],
  ['science', '/app/science/plates', null],
  ['plus', '/app/me', async (p, m) => { await p.getByRole('button', { name: new RegExp(m.trial) }).first().click(); await p.waitForTimeout(1400); }],
];

const browser = await chromium.launch();
let failed = 0;
for (const [l, bcp] of Object.entries(LOCALES)) {
  if (ONLY.length && !ONLY.includes(l)) continue;
  const m = messages(l);
  for (const [d, v] of Object.entries(DEVICES)) {
    const out = `${dir}out/screens/${l}/${d}`; mkdirSync(out, { recursive: true });
    for (const [i, [name, path, act]] of SCREENS.entries()) {
      const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr, isMobile: v.mobile, hasTouch: true,
        colorScheme: 'dark', locale: bcp, timezoneId: 'UTC', geolocation: { latitude: 35.68, longitude: 139.76 }, permissions: ['geolocation'] });
      await ctx.addInitScript(([loc, units]) => {
        localStorage.setItem('sisma.onboarded', '9'); sessionStorage.setItem('sisma.splash', '1');
        localStorage.setItem('sisma.locale', loc); localStorage.setItem('sisma.units', units); localStorage.setItem('sisma.theme', 'dark');
      }, [l, l === 'en' ? 'mi' : 'km']);
      await ctx.route('https://tile.openstreetmap.org/**', r => r.abort());
      const p = await ctx.newPage();
      try {
        await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
        if (act) await act(p, m, d);
        await p.screenshot({ path: `${out}/${i + 1}-${name}.png` });
        console.log(`${l}/${d}/${i + 1}-${name}`);
      } catch (e) { failed++; console.warn(`${l}/${d}/${name} failed: ${String(e.message).split('\n')[0]}`); }
      await ctx.close();
    }
  }
}
await browser.close();
if (failed) { console.warn(`${failed} screen(s) failed`); process.exitCode = 1; }
