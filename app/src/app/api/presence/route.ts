import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/auth';

// POST /api/presence { lat, lon } — one approximate position from an open app, for automatic felt maps.
// The device has already blurred it (lib/feltmap.ts blur, up to ~500 m). Stored with a timestamp only: no user,
// device or IP. Deleted after 7 days (pg_cron 'app-pings-retention').
const seen = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), hits = (seen.get(ip) ?? []).filter(t => now - t < 60_000);
  hits.push(now); seen.set(ip, hits);
  if (seen.size > 20_000) seen.clear();
  return hits.length > 3; // the app sends at most one a minute; allow a little slack for several tabs
}

export async function POST(req: NextRequest) {
  let b: { lat?: unknown; lon?: unknown };
  try { b = await req.json(); } catch { return new NextResponse(null, { status: 400 }); }
  const lat = Number(b.lat), lon = Number(b.lon);
  if (typeof b.lat !== 'number' || typeof b.lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return new NextResponse(null, { status: 400 });
  }
  if (limited(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown')) return new NextResponse(null, { status: 429 });
  const db = adminClient();
  if (db) await db.from('app_pings').insert({ lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4 });
  return new NextResponse(null, { status: 204 });
}
