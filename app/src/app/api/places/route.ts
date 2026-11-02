import { NextRequest, NextResponse } from 'next/server';
import { parseNominatim } from '@/lib/places';
import { SITE } from '@/lib/site';

// GET /api/places?q=Oslo&lang=en → { results: PlaceHit[], attribution }
// Server-side proxy for Nominatim: identifies the app, keeps to ≤ 1 upstream request/s per instance, caches results
// for a week (fetch cache + CDN), and limits each client to 20 searches a minute.
const LANGS = new Set(['en', 'es', 'ja', 'id', 'tr', 'it', 'pt', 'zh', 'fr', 'de']);
const ATTRIBUTION = '© OpenStreetMap contributors';

let gate = Promise.resolve();
let last = 0;
function throttle() {
  const run = gate.then(async () => {
    const wait = last + 1100 - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    last = Date.now();
  });
  gate = run.catch(() => {});
  return run;
}

const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string) {
  const now = Date.now(), h = hits.get(ip);
  if (!h || h.reset < now) { hits.set(ip, { n: 1, reset: now + 60_000 }); if (hits.size > 5000) hits.clear(); return false; }
  return ++h.n > 20;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().replace(/\s+/g, ' ');
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en';
  if (q.length < 2 || q.length > 100) return NextResponse.json({ results: [], attribution: ATTRIBUTION, error: 'bad_query' }, { status: 400 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return NextResponse.json({ results: [], attribution: ATTRIBUTION, error: 'rate_limited' }, { status: 429 });

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.search = new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', limit: '8', featureType: 'settlement', 'accept-language': LANGS.has(lang) ? lang : 'en' }).toString();
  try {
    await throttle();
    const r = await fetch(url, { headers: { 'User-Agent': `sisma.io/1.0 (+${SITE.url})`, Referer: SITE.url }, next: { revalidate: 604_800 } });
    if (!r.ok) throw new Error(String(r.status));
    const results = parseNominatim(await r.json()).slice(0, 6);
    return NextResponse.json({ results, attribution: ATTRIBUTION }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch {
    return NextResponse.json({ results: [], attribution: ATTRIBUTION, error: 'upstream' }, { status: 502 });
  }
}
