import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { adminClient, planForRequest } from '@/lib/auth';
import { GRID_STEP_KM, GRID_Y0_KM, WINDOW_MAX_KM, type Terrain3DResponse } from '@/lib/ribbon/shared';
import { northAt } from '@/lib/ribbon/north';

// GET /api/science/ribbon/terrain3d?from=<km>&to=<km> → one window of the 3D terrain grid for Science → Pacific Fire
// Ribbon (sisma+ only; plan checked here). Built once on the database from NOAA ETOPO 2022 (public.ribbon_terrain_grid,
// docs/fire-ribbon.md) and read with the service role. Windows are rounded to 100 km and kept for a day.
export const dynamic = 'force-dynamic';

const load = unstable_cache(async (b0: number, b1: number): Promise<Terrain3DResponse | null> => {
  const db = adminClient();
  if (!db) return null;
  const { data, error } = await db.from('ribbon_terrain_grid').select('xbin, z').gte('xbin', b0).lte('xbin', b1).order('xbin');
  if (error) throw error;
  if (!data?.length) return null;
  return { stepKm: GRID_STEP_KM, y0Km: GRID_Y0_KM, x0bin: data[0].xbin, rows: data.map(r => r.z), north: northAt(((b0 + b1) / 2) * GRID_STEP_KM) };
}, ['fire-ribbon-terrain3d', 'v2'], { revalidate: 86_400 });

export async function GET(req: NextRequest) {
  if ((await planForRequest(req)) !== 'plus') return NextResponse.json({ error: 'plus_required' }, { status: 403 });
  const q = req.nextUrl.searchParams;
  const from = Number(q.get('from')), to = Number(q.get('to'));
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return NextResponse.json({ error: 'bad_window' }, { status: 400 });
  const a = Math.floor(Math.max(0, from) / 100) * 100, b = Math.ceil(Math.min(from + WINDOW_MAX_KM, to) / 100) * 100;
  const t = await load(Math.floor(a / GRID_STEP_KM), Math.floor(b / GRID_STEP_KM)).catch(e => { console.error('fire ribbon terrain3d', e); return null; });
  if (!t) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  return NextResponse.json(t, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
