import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdminConfig } from '@/lib/supabase-env';
import { SOURCES } from '@/lib/quakes/sources';
import { hasId, mergeQuakes } from '@/lib/quakes/merge';
import { REPORT_GRACE_MS, REPORT_WINDOW_MS } from '@/lib/quakes/report-window';

export interface FeltCell { lat: number; lon: number; n: number; mmi: number }

const int = (v: unknown, min: number, max: number) => (Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : null);

/** Finds the quake in the last day's merged feed (source responses are cached for 60 s). */
async function findRecentQuake(id: string) {
  const results = await Promise.allSettled([
    SOURCES.usgs({ days: 1, minMag: 2.5 }), SOURCES.emsc({ days: 1, minMag: 2.5 }),
    SOURCES.geonet({ days: 1, minMag: 0 }), SOURCES.jma({ days: 1, minMag: 0 }),
  ]);
  const merged = mergeQuakes(results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : [])));
  return merged.find(q => hasId(q, id)) ?? null;
}

// POST /api/reports  { quakeId, mmi 1-10, note?, place? 0|1, duration? 0-3, moved?: number[], damage? 0-3, lat?, lon?, locale }
// Reports are only accepted for quakes up to 6 hours old (plus a short grace period for forms already open).
export async function POST(req: NextRequest) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }
  const mmi = int(b.mmi, 1, 10);
  if (typeof b.quakeId !== 'string' || !b.quakeId || mmi === null) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const quake = await findRecentQuake(b.quakeId);
  if (!quake) return NextResponse.json({ error: 'unknown_quake' }, { status: 404 });
  if (Date.now() - quake.time > REPORT_WINDOW_MS + REPORT_GRACE_MS) return NextResponse.json({ error: 'closed' }, { status: 409 });

  const lat = typeof b.lat === 'number' && Math.abs(b.lat) <= 90 ? b.lat : null;
  const lon = typeof b.lon === 'number' && Math.abs(b.lon) <= 180 ? b.lon : null;
  const row = {
    quake_id: quake.id, mmi, note: typeof b.note === 'string' && b.note.trim() ? b.note.trim().slice(0, 500) : null,
    place: int(b.place, 0, 1), duration: int(b.duration, 0, 3), damage: int(b.damage, 0, 3),
    moved: Array.isArray(b.moved) ? [...new Set(b.moved.filter(x => int(x, 0, 4) !== null) as number[])].slice(0, 5) : null,
    // Coarsen location to ~10 km to protect privacy.
    lat: lat === null ? null : Math.round(lat * 10) / 10, lon: lon === null ? null : Math.round(lon * 10) / 10,
    locale: String(b.locale ?? 'en').slice(0, 5),
  };
  const db = supabaseAdminConfig();
  if (!db) return NextResponse.json({ ok: true, demo: true });
  const { error } = await createClient(db.url, db.key, { auth: { persistSession: false } }).from('felt_reports').insert(row);
  if (error) return NextResponse.json({ error: 'store_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/reports?quakeId=…  → felt reports for one quake, grouped into ~10 km cells (0.1°).
// Only cell centres, counts and mean intensity are returned: never individual reports or exact positions.
export async function GET(req: NextRequest) {
  const quakeId = req.nextUrl.searchParams.get('quakeId');
  if (!quakeId) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const db = supabaseAdminConfig();
  if (!db) return NextResponse.json({ quakeId, total: 0, cells: [], demo: true });
  const { data, error } = await createClient(db.url, db.key, { auth: { persistSession: false } }).from('felt_reports').select('lat, lon, mmi').eq('quake_id', quakeId).limit(5000);
  if (error) return NextResponse.json({ error: 'read_failed' }, { status: 500 });
  const cells = new Map<string, { lat: number; lon: number; n: number; sum: number }>();
  for (const r of data ?? []) {
    if (r.lat == null || r.lon == null) continue;
    const lat = Math.round(Number(r.lat) * 10) / 10, lon = Math.round(Number(r.lon) * 10) / 10, k = `${lat},${lon}`;
    const c = cells.get(k) ?? { lat, lon, n: 0, sum: 0 };
    c.n++; c.sum += r.mmi; cells.set(k, c);
  }
  const out: FeltCell[] = [...cells.values()].map(c => ({ lat: c.lat, lon: c.lon, n: c.n, mmi: Math.round((c.sum / c.n) * 10) / 10 }));
  return NextResponse.json({ quakeId, total: data?.length ?? 0, cells: out }, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
}
