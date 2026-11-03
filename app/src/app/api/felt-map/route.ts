import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/auth';
import { findQuake } from '@/lib/quakes/find';
import { BASELINE_MIN, WINDOW_S, buildFeltMap, feltRadiusKm, type FeltMap, type Ping } from '@/lib/feltmap';

// GET /api/felt-map?quakeId=… → { status: 'collecting' | 'ready', cells, total, radiusKm, windowSec }
// Automatic felt map from app activity in the WINDOW_S seconds after the event (see lib/feltmap.ts). Built from the
// raw pings while the window is open; once it has closed (plus a short delay for late pings) the result is cached in
// felt_maps. Only aggregated cells with at least 3 people are ever returned.
const SETTLE_S = 120;
const MAX_PINGS = 50_000;

type Db = NonNullable<ReturnType<typeof adminClient>>;

async function pings(db: Db, from: Date, to: Date, box: { s: number; n: number; w: number; e: number } | null): Promise<Ping[]> {
  const out: Ping[] = [];
  for (let start = 0; start < MAX_PINGS; start += 1000) {
    let q = db.from('app_pings').select('lat, lon').gte('created_at', from.toISOString()).lt('created_at', to.toISOString());
    if (box) q = q.gte('lat', box.s).lte('lat', box.n).gte('lon', box.w).lte('lon', box.e);
    const { data, error } = await q.order('id').range(start, start + 999);
    if (error) throw error;
    for (const r of data ?? []) out.push({ lat: Number(r.lat), lon: Number(r.lon) });
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('quakeId');
  if (!id) return NextResponse.json({ error: 'missing_quake' }, { status: 400 });
  const db = adminClient();
  if (!db) return NextResponse.json({ status: 'ready', cells: [], total: 0, radiusKm: 0, windowSec: WINDOW_S, demo: true });

  const { data: cached } = await db.from('felt_maps').select('cells, total, radius_km').eq('quake_id', id).maybeSingle();
  if (cached) {
    return NextResponse.json({ status: 'ready', cells: cached.cells, total: cached.total, radiusKm: Number(cached.radius_km), windowSec: WINDOW_S },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  }

  const quake = await findQuake(id, 7);
  if (!quake) return NextResponse.json({ error: 'unknown_quake' }, { status: 404 });
  const t = quake.time, now = Date.now();
  const radiusKm = feltRadiusKm(quake.mag);
  const dLat = radiusKm / 111, dLon = radiusKm / (111 * Math.max(0.05, Math.cos((quake.lat * Math.PI) / 180)));
  const crossesDateline = quake.lon - dLon < -180 || quake.lon + dLon > 180;
  const box = crossesDateline ? null : { s: quake.lat - dLat, n: quake.lat + dLat, w: quake.lon - dLon, e: quake.lon + dLon };

  let map: FeltMap;
  try {
    const [win, base] = await Promise.all([
      pings(db, new Date(t), new Date(t + WINDOW_S * 1000), box),
      pings(db, new Date(t - BASELINE_MIN * 60_000), new Date(t), box),
    ]);
    map = buildFeltMap(quake, win, base);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
  const closed = now > t + (WINDOW_S + SETTLE_S) * 1000;
  if (closed) await db.from('felt_maps').upsert({ quake_id: id, radius_km: map.radiusKm, total: map.total, cells: map.cells });
  return NextResponse.json({ status: closed ? 'ready' : 'collecting', ...map, windowSec: WINDOW_S },
    { headers: { 'Cache-Control': closed ? 'public, s-maxage=300' : 'no-store' } });
}
