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
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(new URL('../../app/package.json', import.meta.url));
const { chromium } = require('playwright');

const BASE = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:3100';
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('http'));
const ONLY_SCREENS = process.env.SCREENS ? process.env.SCREENS.split(',') : null; // e.g. SCREENS=alerts
export const LOCALES = { en: 'en-US', es: 'es-ES', ja: 'ja-JP', id: 'id-ID', tr: 'tr-TR', it: 'it-IT', pt: 'pt-BR', zh: 'zh-CN', fr: 'fr-FR', de: 'de-DE' };
/** CSS viewport and pixel ratio of each device's screen (phone and 7" use the phone layout, 10" the wide one). */
export const DEVICES = {
  phone: { width: 360, height: 640, dpr: 3, mobile: true },
  tablet7: { width: 600, height: 960, dpr: 2, mobile: true },
  tablet10: { width: 1024, height: 1638, dpr: 1.5, mobile: false },
};
const REGION = 'usgs:us7000tu4f'; // M6.2 Vanuatu: region view with nearby events

const TOKYO = { lat: 35.68, lon: 139.76 };
const km = (a, b) => { const r = Math.PI / 180, x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };

/**
 * The Alerts screen: a made-up sisma+ account ("Alex") with alerts on, two rules and the alerts they sent, taken from the
 * earthquakes the server is serving: "Tokyo" (M4+ within 500 km of the saved place Tokyo) and "M6+" (anywhere). The
 * newest strong one near Tokyo is also written to <n>-alerts.json for the notification banner in compose-store.mjs.
 */
async function alertData() {
  const { quakes } = await (await fetch(`${BASE}/api/quakes`)).json();
  const near = quakes.map(q => ({ ...q, km: km(TOKYO, q) })).filter(q => q.km <= 500 && q.mag >= 4.5).sort((a, b) => b.time - a.time);
  // "M6+" watches the Pacific region; western Pacific events (150° E – 150° W) stand in for it here.
  const big = quakes.filter(q => q.mag >= 6 && km(TOKYO, q) > 500 && Math.abs(q.lon) >= 150).sort((a, b) => b.time - a.time);
  const banner = [...near].sort((a, b) => b.mag - a.mag || b.time - a.time)[0];
  const sent = q => new Date(q.time + 4 * 60e3).toISOString();
  const deliveries = [...near.slice(0, 4).map(q => [q, 'Tokyo']), ...big.slice(0, 3).map(q => [q, 'M6+'])]
    .sort((a, b) => b[0].time - a[0].time)
    .map(([q, rule]) => ({ quake_id: q.id, quake_time: new Date(q.time).toISOString(), sent_at: sent(q), mag: q.mag, place: q.title, lat: q.lat, lon: q.lon, alert_rules: { name: rule } }));
  const rule = (id, position, name, min, nearPlaces, regions) => ({ id, position, name, enabled: true, min_magnitude: min, near_places: nearPlaces, radius_km: 500,
    countries: [], regions, quiet: false, quiet_from: 1380, quiet_to: 420, quiet_tz: 'Asia/Tokyo', quiet_major: true });
  return { banner, deliveries, rules: [rule('r1', 0, 'Tokyo', 4.5, true, []), rule('r2', 1, 'M6+', 6, false, ['pacific'])] };
}
const PLUS = { display_name: 'Alex', plan: 'plus', subscription_status: 'active', billing_interval: 'yearly', current_period_end: new Date(Date.now() + 200 * 864e5).toISOString(),
  cancel_at_period_end: false, trial_ends_at: null, billing_source: 'play', play_purchase_token: 'tok', stripe_customer_id: null, stripe_subscription_id: null, is_admin: false };

/** Signs the page in as the sample account and answers its Supabase requests. */
async function signIn(ctx, data, l) {
  // As in the Android app with notifications allowed: a stand-in for the Capacitor push plugin and a stored device token.
  await ctx.addInitScript(() => {
    localStorage.setItem('sisma.pushToken', 'store-screenshot');
    window.Capacitor = { isNativePlatform: () => true, Plugins: {
      PushNotifications: { checkPermissions: async () => ({ receive: 'granted' }), requestPermissions: async () => ({ receive: 'granted' }),
        register: async () => {}, addListener: async () => ({ remove() {} }), createChannel: async () => {} },
      App: { getInfo: async () => ({ build: '999' }), addListener: async () => ({ remove() {} }), removeAllListeners: async () => {} } } };
  });
  await ctx.addInitScript(() => localStorage.setItem('sisma.auth', JSON.stringify({ access_token: 'a.b.c', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'alex@example.com', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() } })));
  const json = (r, body) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await ctx.route('**/auth/v1/**', r => json(r, new URL(r.request().url()).pathname.endsWith('/settings') ? { external: { email: true, google: true } } : {}));
  await ctx.route('**/rest/v1/**', r => {
    const p = new URL(r.request().url()).pathname, get = r.request().method() === 'GET';
    if (!get) return json(r, {});
    if (p.endsWith('/profiles')) return json(r, { ...PLUS, locale: l, theme: 'dark' });
    if (p.endsWith('/saved_locations')) return json(r, [{ id: 'l1', name: PLACE[l] ?? 'Tokyo', detail: null, lat: TOKYO.lat, lon: TOKYO.lon, is_primary: true }]);
    if (p.endsWith('/alert_settings')) return json(r, { enabled: true });
    if (p.endsWith('/alert_rules')) return json(r, data.rules);
    if (p.endsWith('/alert_deliveries')) return json(r, data.deliveries);
    return json(r, []);
  });
}
/** The saved place's name as someone would type it. */
const PLACE = { ja: '東京', zh: '东京' };

const messages = l => JSON.parse(readFileSync(new URL(`../../app/src/i18n/messages/${l}.json`, import.meta.url), 'utf8'));
const togglePanel = async p => { const h = p.locator('[data-filter-panel] button').first(); await h.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(700); };

/** The eight screens: [name, path, action(page, messages, device), options]. */
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
  ['alerts', '/app/me/alerts', async (p, m, d) => {
    // Phone and 7": scroll to the alerts received, leaving room at the top for the notification banner.
    if (d === 'tablet10') return;
    await p.locator('#history').evaluate(e => { e.scrollIntoView({ block: 'start' }); let n = e.parentElement; while (n && n.scrollHeight <= n.clientHeight) n = n.parentElement; (n ?? document.scrollingElement).scrollBy(0, -330); });
    await p.waitForTimeout(600);
  }, { account: true }],
];

const browser = await chromium.launch();
const alerts = await alertData();
let failed = 0;
for (const [l, bcp] of Object.entries(LOCALES)) {
  if (ONLY.length && !ONLY.includes(l)) continue;
  const m = messages(l);
  for (const [d, v] of Object.entries(DEVICES)) {
    const out = `${dir}out/screens/${l}/${d}`; mkdirSync(out, { recursive: true });
    for (const [i, [name, path, act, opt]] of SCREENS.entries()) {
      if (ONLY_SCREENS && !ONLY_SCREENS.includes(name)) continue;
      const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr, isMobile: v.mobile, hasTouch: true,
        colorScheme: 'dark', locale: bcp, timezoneId: 'UTC', geolocation: { latitude: 35.68, longitude: 139.76 }, permissions: ['geolocation'] });
      await ctx.addInitScript(([loc, units]) => {
        localStorage.setItem('sisma.onboarded', '9'); sessionStorage.setItem('sisma.splash', '1');
        localStorage.setItem('sisma.locale', loc); localStorage.setItem('sisma.units', units); localStorage.setItem('sisma.theme', 'dark');
      }, [l, l === 'en' ? 'mi' : 'km']);
      await ctx.route('https://tile.openstreetmap.org/**', r => r.abort());
      if (opt?.account) await signIn(ctx, alerts, l);
      const p = await ctx.newPage();
      try {
        await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
        if (act) await act(p, m, d);
        await p.screenshot({ path: `${out}/${i + 1}-${name}.png` });
        if (opt?.account && alerts.banner) {
          // Notification text as the alert job builds it (lib/alerts/message.ts), in this language and units.
          const q = alerts.banner, units = l === 'en' ? 'mi' : 'km', nf = new Intl.NumberFormat(bcp, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          const dist = v => { const x = units === 'mi' ? v / 1.609344 : v; return `${new Intl.NumberFormat(bcp, { maximumFractionDigits: x < 10 ? 1 : 0 }).format(x < 10 ? x : Math.round(x / (x < 100 ? 1 : 5)) * (x < 100 ? 1 : 5))} ${units}`; };
          const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
          writeFileSync(`${out}/${i + 1}-${name}.json`, JSON.stringify({
            title: fill(m.notif.title_near, { mag: nf.format(q.mag), dist: dist(km(TOKYO, q)), place: PLACE[l] ?? 'Tokyo' }),
            body: fill(m.notif.body, { region: q.region, depth: dist(q.depthKm) }),
            when: new Intl.RelativeTimeFormat(bcp, { numeric: 'auto' }).format(0, 'second'),
          }));
        }
        console.log(`${l}/${d}/${i + 1}-${name}`);
      } catch (e) { failed++; console.warn(`${l}/${d}/${name} failed: ${String(e.message).split('\n')[0]}`); }
      await ctx.close();
    }
  }
}
await browser.close();
if (failed) { console.warn(`${failed} screen(s) failed`); process.exitCode = 1; }
