import { NextRequest, NextResponse } from 'next/server';
import { fetchDyfi, isUsgsEventId } from '@/lib/quakes/dyfi';

// GET /api/dyfi?id=<USGS event id> → { id, responses, maxCdi, cells: [{ lat, lon, cdi, n, ring? }] }
// USGS "Did You Feel It?" community intensity in ~10 km boxes (lib/quakes/dyfi.ts), for the region view.
// Public USGS data; cached for 5 minutes. { cells: [] } when USGS has none for the event or can't be reached.
const MAX_CELLS = 3000;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!isUsgsEventId(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const d = await fetchDyfi(id);
    const cells = (d?.cells ?? []).sort((a, b) => b.n - a.n).slice(0, MAX_CELLS)
      .map(c => ({ ...c, lat: Math.round(c.lat * 1e3) / 1e3, lon: Math.round(c.lon * 1e3) / 1e3, cdi: Math.round(c.cdi * 10) / 10 }));
    return NextResponse.json({ id, responses: d?.responses ?? 0, maxCdi: d?.maxCdi ?? null, cells },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch {
    return NextResponse.json({ id, responses: 0, maxCdi: null, cells: [], unavailable: true }, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
