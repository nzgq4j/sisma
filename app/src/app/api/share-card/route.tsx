// GET /api/share-card?id=<quake id>&locale=en&units=km&tz=Europe/Rome → 1080×1350 PNG share card:
// regional map (lib/share-map.ts) with the event in focus and other recent events, the main details, sisma branding
// and the "not an official warning service" line. The event is looked up on the server by id (last 30 days), so a
// card can only show real data from the feeds.
/* eslint-disable @next/next/no-img-element -- Satori renders <img> */
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { recentQuakes } from '@/lib/quakes/find';
import { shareMapScale, shareMapSvg } from '@/lib/share-map';
import { MAG_INK_LIGHT, MAG_MARKER_LIGHT, THEME, magIndex } from '@/lib/theme';
import { countryAt } from '@/lib/country';
import { formatDms } from '@/lib/geo';
import { convertKmInText, KM_PER_MI, type Units } from '@/lib/units';
import { EARTHQUAKE_PATH } from '@/components/logo-path';
import { asLocale, serverMessages as messages } from '@/i18n/server';
const W = 1080, H = 1350, PAD = 56, MAP_W = W - PAD * 2, MAP_H = 600;
const SPAN = 7.5;
const C = THEME.light;

// Google Fonts serves TrueType (which Satori needs) when no browser user agent is sent.
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();
function googleFont(family: string, weight: number, text?: string) {
  const key = `${family}:${weight}:${text ?? ''}`;
  if (!fontCache.has(key)) {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}${text ? `&text=${encodeURIComponent(text)}` : ''}`;
    fontCache.set(key, fetch(url).then(r => r.text()).then(css => {
      const src = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
      return src ? fetch(src).then(r => r.arrayBuffer()) : null;
    }).catch(() => null));
  }
  const p = fontCache.get(key)!;
  if (text) p.then(v => { if (!v) fontCache.delete(key); }); // retry subset fonts that failed
  return p;
}

async function asDataUri(url: string, type: string) {
  try {
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) return null;
    return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  } catch { return null; }
}
async function json<T>(url: string): Promise<T | null> {
  try { const r = await fetch(url, { next: { revalidate: 86400 } }); return r.ok ? ((await r.json()) as T) : null; } catch { return null; }
}

function validTz(tz: string | null) {
  if (!tz) return 'UTC';
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } catch { return 'UTC'; }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('id');
  if (!id) return Response.json({ error: 'missing_id' }, { status: 400 });
  const locale = asLocale(sp.get('locale'));
  const units: Units = sp.get('units') === 'mi' ? 'mi' : 'km';
  const tz = validTz(sp.get('tz'));
  const origin = req.nextUrl.origin;

  const [all, m, plates, lakes] = await Promise.all([
    recentQuakes(30), messages(locale),
    json<GeoJSON.MultiLineString>(`${origin}/data/plate-boundaries.json`), json<GeoJSON.GeoJsonObject>(`${origin}/data/lakes.json`),
  ]);
  const q = all.find(x => x.id === id);
  if (!q) return Response.json({ error: 'not_found' }, { status: 404 });

  const since = Date.now() - 7 * 864e5;
  const nearby = all.filter(x => x.time >= since && Math.abs(x.lat - q.lat) < SPAN && Math.abs(((x.lon - q.lon + 540) % 360) - 180) < SPAN);
  const map = shareMapSvg({
    q, nearby, w: MAP_W, h: MAP_H, span: SPAN, units, plates, lakes: lakes as never, font: 'Figtree', scaleText: false,
    colors: { sea: C.mapSea, land: C.mapLand, line: C.mapLine, plate: C.mapPlate, ink: C.ink, surface: C.surface },
  });
  // The scale label is drawn by the card (below), not inside the map image: text inside an embedded SVG is rendered
  // without the card's fonts and came out as empty boxes on the server.
  const scale = shareMapScale({ q, w: MAP_W, h: MAP_H, span: SPAN, units });

  const country = countryAt(q.lat, q.lon);
  const flag = country ? await asDataUri(`${origin}/flags/${country.code}.svg`, 'image/svg+xml') : null;
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const depth = units === 'mi' ? `${nf.format(q.depthKm / KM_PER_MI)} mi` : `${nf.format(q.depthKm)} km`;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: tz }).format(q.time);
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: tz, timeZoneName: 'short' }).format(q.time);
  const status = q.status ? m[`st_${q.status}` as const] : '—';
  const source = [q.source, ...(q.alsoIn ?? [])].map(s => s.toUpperCase()).join(' · ');
  const title = convertKmInText(q.title, units, v => nf.format(v));
  // Some sources give the same text for the place and the region (e.g. "Fiji region" twice): show it once.
  const same = (a: string, b: string) => a.trim().toLocaleLowerCase('en') === b.trim().toLocaleLowerCase('en');
  const subtitle = title && !same(title, q.region) ? title : null;
  // Badge in the light pin colours, like the card's map and the app's light mode.
  const mc = { fill: MAG_MARKER_LIGHT[magIndex(q.mag)], text: MAG_INK_LIGHT[magIndex(q.mag)] };
  const stats: [string, string][] = [[m.depth, depth], [m.coords, formatDms(q.lat, q.lon)], [m.review_status, status], [m.source, source]];

  // Every string on the card, so CJK fonts can be fetched as a small subset.
  const text = [m.sharecard.label, m.sharecard.nearby, m.sharecard.disclaimer, q.region, title, date, time, status, ...stats.flat(), `${nf.format(scale.len)} ${units}`].join('');
  const cjk = locale === 'ja' ? 'Noto Sans JP' : locale === 'zh' ? 'Noto Sans SC' : null;
  const [f500, f700, f800, c500, c700] = await Promise.all([
    googleFont('Figtree', 500), googleFont('Figtree', 700), googleFont('Figtree', 800),
    cjk ? googleFont(cjk, 500, text) : null, cjk ? googleFont(cjk, 700, text) : null,
  ]);
  const fonts = [
    ...(f500 ? [{ name: 'Figtree', data: f500, weight: 500 as const }] : []),
    ...(f700 ? [{ name: 'Figtree', data: f700, weight: 700 as const }] : []),
    ...(f800 ? [{ name: 'Figtree', data: f800, weight: 800 as const }] : []),
    ...(c500 ? [{ name: 'CJK', data: c500, weight: 500 as const }] : []),
    ...(c700 ? [{ name: 'CJK', data: c700, weight: 700 as const }] : []),
  ];
  const logo = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="31.06" fill="${C.violet}"/><svg x="16.94" y="16.94" width="62.12" height="62.12" viewBox="0 -960 960 960"><path fill="#fff" d="${EARTHQUAKE_PATH}"/></svg></svg>`).toString('base64')}`;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', padding: PAD, background: C.bg, color: C.ink, fontFamily: 'Figtree, CJK' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <img src={logo} width={72} height={72} alt="" />
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, letterSpacing: '-0.02em' }}>sisma<span style={{ color: C.ink2, fontWeight: 700 }}>.io</span></div>
          </div>
          <div style={{ display: 'flex', padding: '12px 26px', borderRadius: 999, background: C.violetSoft, color: C.violetText, fontSize: 28, fontWeight: 700 }}>{m.sharecard.label}</div>
        </div>

        <div style={{ display: 'flex', position: 'relative', marginTop: 28, width: MAP_W, height: MAP_H, borderRadius: 40, overflow: 'hidden', border: `2px solid ${C.line}` }}>
          <img src={`data:image/svg+xml;base64,${Buffer.from(map).toString('base64')}`} width={MAP_W} height={MAP_H} alt="" />
          <div style={{ position: 'absolute', left: scale.bx, top: scale.by - 38, display: 'flex', fontSize: 22, fontWeight: 700, lineHeight: 1, color: C.ink }}>{nf.format(scale.len)} {units}</div>
          {nearby.length > 1 && (
            <div style={{ position: 'absolute', top: 22, right: 22, display: 'flex', padding: '10px 20px', borderRadius: 18, background: 'rgba(255,255,255,.88)', color: C.ink2, fontSize: 22, fontWeight: 700 }}>{m.sharecard.nearby}</div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 168, height: 168, borderRadius: 52, background: mc.fill, color: mc.text, flex: 'none' }}>
            <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, lineHeight: 1 }}>{q.mag.toFixed(1)}</div>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, marginTop: 6, opacity: 0.8 }}>{q.magType ? `M${q.magType.replace(/^m/i, '').toLowerCase()}` : 'M'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {flag && <img src={flag} width={48} height={48} style={{ borderRadius: 24 }} alt="" />}
              <div style={{ display: 'flex', fontSize: 50, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{q.region}</div>
            </div>
            {subtitle && <div style={{ display: 'flex', fontSize: 30, fontWeight: 500, color: C.ink2 }}>{subtitle}</div>}
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700 }}>{date} · {time}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 28 }}>
          {stats.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, width: (MAP_W - 16) / 2, height: 108, padding: '0 28px', borderRadius: 28, background: C.surface }}>
              <div style={{ display: 'flex', fontSize: 23, fontWeight: 500, color: C.ink2 }}>{k}</div>
              <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginTop: 'auto' }}>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 500, color: C.ink2, maxWidth: 780 }}>{m.sharecard.disclaimer}</div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: C.violetText }}>sisma.io</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  );
}
