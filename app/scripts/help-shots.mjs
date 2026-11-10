// Takes the help centre's phone screenshots (public/help/<name>-light.webp and -dark.webp, 585 × 1266) from a running
// copy of the app, in both themes. Signed-in screens use a made-up account ("Alex", alex@example.com): the script answers
// the app's Supabase requests itself, so no real account or data is touched. Earthquakes are whatever the server serves.
//
//   npm run build && npx next start -p 3100          (in another terminal; any Supabase URL works)
//   node scripts/help-shots.mjs [http://localhost:3100] [name …]
//
// Needs Playwright with Chromium (npx playwright install chromium; a global install works with
// NODE_PATH=$(npm root -g)). Images are written with sharp (installed with Next.js). Names: see SHOTS below. Retake the
// affected screenshots whenever a pictured screen changes (help rule in CLAUDE.md).
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');

const BASE = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:3100';
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('http'));
const OUT = fileURLToPath(new URL('../public/help/', import.meta.url));

const day = 864e5, iso = n => new Date(Date.now() + n * day).toISOString();
const PLUS = { plan: 'plus', subscription_status: 'active', billing_interval: 'yearly', current_period_end: iso(200), cancel_at_period_end: false, trial_ends_at: null, billing_source: 'play', play_purchase_token: 'tok', stripe_customer_id: null, stripe_subscription_id: null };
const FREE = { plan: 'free', subscription_status: null, billing_interval: null, current_period_end: null, cancel_at_period_end: false, trial_ends_at: null, billing_source: null, play_purchase_token: null, stripe_customer_id: null, stripe_subscription_id: null };

/** A phone-sized page of the app in one theme, past onboarding, optionally signed in as the sample account. */
async function open(browser, theme, { path = '/app', account = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true, colorScheme: theme, locale: 'en-US', geolocation: { latitude: 35.68, longitude: 139.76 }, permissions: ['geolocation'] });
  await ctx.addInitScript(([signed, th]) => {
    localStorage.setItem('sisma.onboarded', '9'); sessionStorage.setItem('sisma.splash', '1'); localStorage.setItem('sisma.theme', th);
    if (signed) localStorage.setItem('sisma.auth', JSON.stringify({ access_token: 'a.b.c', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'alex@example.com', app_metadata: { provider: 'email' }, user_metadata: { locale: 'en' }, created_at: new Date().toISOString() } }));
  }, [!!account, theme]);
  await ctx.route('https://tile.openstreetmap.org/**', r => r.abort());
  const json = (r, body) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await ctx.route('**/auth/v1/**', r => {
    const p = new URL(r.request().url()).pathname;
    if (p.endsWith('/settings')) return json(r, { external: { email: true, google: true } });
    return json(r, {});
  });
  await ctx.route('**/rest/v1/**', r => {
    const p = new URL(r.request().url()).pathname, m = r.request().method();
    if (p.endsWith('/profiles') && m === 'GET') return json(r, { display_name: 'Alex', locale: 'en', theme, is_admin: false, ...(account ?? {}) });
    if (p.endsWith('/saved_locations') && m === 'GET') return json(r, account ? [{ id: 'l1', name: 'Tokyo', lat: 35.68, lon: 139.76, is_primary: true }] : []);
    return json(r, m === 'GET' ? [] : {});
  });
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  return page;
}
const firstRow = p => p.getByRole('button').filter({ hasText: / ago/ }).first();
const strongestEvent = async () => {
  const j = await (await fetch(BASE + '/api/quakes')).json();
  return [...j.quakes].sort((a, b) => b.mag - a.mag)[0];
};

/** Each screenshot: where it starts, as which account, and what to tap first. */
const SHOTS = {
  feed: {},
  detail: { act: async p => { await p.getByText('Strongest', { exact: true }).first().click(); await p.waitForTimeout(500); await firstRow(p).click(); await p.waitForTimeout(1500); } },
  felt: { act: async p => { await firstRow(p).click(); await p.waitForTimeout(1000); await p.getByRole('button', { name: /I felt it|Felt it\?/ }).first().click({ timeout: 5000 }); await p.waitForTimeout(900); } },
  share: { act: async p => {
    await p.getByText('Strongest', { exact: true }).first().click(); await p.waitForTimeout(500); await firstRow(p).click(); await p.waitForTimeout(1000);
    await p.getByRole('button', { name: /^Share$/ }).first().click(); await p.waitForTimeout(3500);
    const ta = p.locator('textarea').first(); await ta.fill((await ta.inputValue()).replace(/https?:\/\/[^/\s]+/, 'https://sisma.io')); await ta.blur();
  } },
  map: { path: '/app/map' },
  filters: { path: '/app/map', act: async p => { const h = p.locator('[data-filter-panel] button').first(); await h.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(900); } },
  region: { path: async () => `/app/map?focus=${encodeURIComponent((await strongestEvent()).id)}` },
  globe: { path: '/app/globe' },
  science: { path: '/app/science/waves' },
  signin: { path: '/app/me', act: async p => { await p.getByRole('button', { name: 'Sign in' }).first().click(); await p.waitForTimeout(900); } },
  forgot: { path: '/app/me', act: async p => { await p.getByRole('button', { name: 'Sign in' }).first().click(); await p.waitForTimeout(700); await p.getByPlaceholder('you@example.com').fill('alex@example.com'); await p.getByRole('button', { name: 'Forgot password?' }).click(); await p.waitForTimeout(1200); } },
  me: { path: '/app/me', account: PLUS, act: async p => { await p.getByRole('button', { name: /Display name/ }).evaluate(e => e.parentElement.previousElementSibling.scrollIntoView({ block: 'start' })); await p.waitForTimeout(600); } },
  me_more: { path: '/app/me', account: PLUS, act: async p => { await p.getByRole('button').filter({ hasText: /^languageLanguage/ }).first().evaluate(e => { e.scrollIntoView({ block: 'start' }); let n = e.parentElement; while (n && n.scrollHeight <= n.clientHeight) n = n.parentElement; (n ?? document.scrollingElement).scrollBy(0, -70); }); await p.waitForTimeout(600); } },
  password: { path: '/app/me', account: PLUS, act: async p => { await p.getByRole('button', { name: /Set or change password/ }).click(); await p.waitForTimeout(900); } },
  delete: { path: '/app/me', account: FREE, act: async p => { await p.getByRole('button', { name: 'Delete account' }).click(); await p.waitForTimeout(900); } },
  paywall: { path: '/app/me', account: FREE, act: async p => { await p.getByRole('button', { name: /free trial/ }).click(); await p.waitForTimeout(1200); } },
  subscription: { path: '/app/me/subscription', account: PLUS },
  alerts: { path: '/app/me/alerts', account: PLUS },
  addloc: { path: '/app/me', account: PLUS, act: async p => { await p.getByRole('button', { name: /Add location/ }).first().click(); await p.waitForTimeout(900); } },
};

const browser = await chromium.launch();
let failed = 0;
for (const [name, s] of Object.entries(SHOTS)) {
  if (ONLY.length && !ONLY.includes(name)) continue;
  for (const theme of ['light', 'dark']) {
    let page;
    try {
      const path = typeof s.path === 'function' ? await s.path() : s.path;
      page = await open(browser, theme, { path, account: s.account });
      if (s.act) await s.act(page);
      const png = await page.screenshot();
      await sharp(png).resize({ width: 585 }).webp({ quality: 82 }).toFile(`${OUT}${name}-${theme}.webp`);
      console.log(`help/${name}-${theme}.webp`);
    } catch (e) {
      failed++;
      console.warn(`${name} (${theme}) failed: ${String(e.message).split('\n')[0]}`);
    } finally { await page?.context().close(); }
  }
}
await browser.close();
if (failed) { console.warn(`${failed} screenshot(s) failed; the old images were kept.`); process.exitCode = 1; }
