// Reads the tsunami warning centres' feeds and keeps every new message in tsunami_messages (the feeds only carry the
// latest bulletin). Run by the per-minute job (POST /api/cron/alerts); loadIncidents() serves the app (GET /api/quakes).
import type { SupabaseClient } from '@supabase/supabase-js';
import { NOAA_FEEDS, parseNoaaAtom, parseNoaaCap } from './noaa';
import { JMA_LIST, jmaDetailUrl, parseJmaDetail, parseJmaList } from './jma';
import { incidents, type Incident } from './alerts';
import type { TsunamiMessage } from './types';

const UA = { 'user-agent': 'sisma.io earthquake app (https://sisma.io)' };
const LIMIT_MS = 8000;

async function get(url: string, as: 'text' | 'json'): Promise<string | unknown | null> {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), LIMIT_MS);
  try {
    const r = await fetch(url, { cache: 'no-store', headers: UA, signal: ctl.signal });
    if (!r.ok) return null;
    return as === 'text' ? await r.text() : await r.json();
  } catch { return null; } finally { clearTimeout(timer); }
}

interface Row {
  id: string; center: string; incident: string; level: string; cancelled: boolean; title: string; issued_at: string; expires_at: string | null;
  origin_at: string | null; lat: number | null; lon: number | null; mag: number | null; place: string; areas: TsunamiMessage['areas']; url: string;
}
const iso = (t: number | null) => (t == null ? null : new Date(t).toISOString());
const toRow = (m: TsunamiMessage): Row => ({
  id: m.id, center: m.center, incident: m.incident, level: m.level, cancelled: m.cancelled, title: m.title.slice(0, 300), issued_at: iso(m.issued)!,
  expires_at: iso(m.expires), origin_at: iso(m.origin), lat: m.lat, lon: m.lon, mag: m.mag == null ? null : Math.round(m.mag * 10) / 10,
  place: m.place.slice(0, 300), areas: m.areas.slice(0, 200), url: m.url.slice(0, 500),
});
const fromRow = (r: Row): TsunamiMessage => ({
  id: r.id, center: r.center as TsunamiMessage['center'], incident: r.incident, level: r.level as TsunamiMessage['level'], cancelled: r.cancelled,
  title: r.title, issued: Date.parse(r.issued_at), expires: r.expires_at ? Date.parse(r.expires_at) : null, origin: r.origin_at ? Date.parse(r.origin_at) : null,
  lat: r.lat, lon: r.lon, mag: r.mag == null ? null : Number(r.mag), place: r.place, areas: Array.isArray(r.areas) ? r.areas : [], url: r.url,
});

/** Fetches the feeds and stores messages not seen before; returns the new ones (for push). JMA bulletins older than
 *  three days are skipped, and at most ten JMA detail files are read per run. */
export async function pollTsunami(db: SupabaseClient, now = Date.now()): Promise<{ added: TsunamiMessage[]; errors: string[] }> {
  const errors: string[] = [];
  const found: TsunamiMessage[] = [];

  await Promise.all(NOAA_FEEDS.map(async f => {
    const atom = await get(f.url, 'text');
    if (typeof atom !== 'string') { errors.push(`${f.center} feed`); return; }
    for (const e of parseNoaaAtom(atom)) {
      const cap = await get(e.cap, 'text');
      const m = typeof cap === 'string' ? parseNoaaCap(cap, f.center, e.bulletin) : null;
      if (m) found.push(m); else errors.push(`${f.center} cap`);
    }
  }));

  const list = parseJmaList(await get(JMA_LIST, 'json'));
  const recent = list.filter(e => { const t = Date.parse(e.rdt ?? ''); return !Number.isFinite(t) || now - t < 3 * 864e5; });
  const jmaIds = recent.map(e => `jma:${e.json.replace(/\.json$/, '')}`);
  const ids = [...found.map(m => m.id), ...jmaIds];
  const { data: seen } = ids.length ? await db.from('tsunami_messages').select('id').in('id', ids) : { data: [] };
  const known = new Set((seen ?? []).map(r => r.id as string));
  for (const e of recent.filter((_, i) => !known.has(jmaIds[i])).slice(0, 10)) {
    const m = parseJmaDetail(await get(jmaDetailUrl(e.json), 'json'), e.json);
    if (m) found.push(m); else errors.push('JMA detail');
  }

  const fresh = found.filter(m => !known.has(m.id));
  if (!fresh.length) return { added: [], errors };
  const { data, error } = await db.from('tsunami_messages').upsert(fresh.map(toRow), { onConflict: 'id', ignoreDuplicates: true }).select('id');
  if (error) return { added: [], errors: [...errors, 'store'] };
  const stored = new Set((data ?? []).map(r => r.id as string));
  return { added: fresh.filter(m => stored.has(m.id)), errors };
}

/** Incidents with a message in the last `days` days. */
export async function loadIncidents(db: SupabaseClient, days = 30, now = Date.now()): Promise<Incident[]> {
  const { data, error } = await db.from('tsunami_messages').select('*').gte('issued_at', new Date(now - days * 864e5).toISOString())
    .order('issued_at', { ascending: false }).limit(2000);
  if (error || !data) return [];
  return incidents((data as Row[]).map(fromRow), now);
}
