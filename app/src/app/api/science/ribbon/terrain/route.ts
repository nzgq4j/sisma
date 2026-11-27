import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { adminClient, planForRequest } from '@/lib/auth';
import type { TerrainResponse } from '@/lib/ribbon/shared';

// GET /api/science/ribbon/terrain → the terrain profile of Science → Pacific Fire Ribbon (sisma+ only; plan checked
// here). Built once on the database from NOAA ETOPO 2022 (supabase/migrations/*_ribbon_terrain.sql, docs/fire-ribbon.md)
// and read here with the service role; it changes only when rebuilt, so it is kept for a day.
export const dynamic = 'force-dynamic';

const load = unstable_cache(async (): Promise<TerrainResponse | null> => {
  const db = adminClient();
  if (!db) return null;
  const { data, error } = await db.from('ribbon_terrain').select('built_at, source, params, crest, trench, trench_y').eq('id', 'etopo2022-60s').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { builtAt: Date.parse(data.built_at), source: data.source, params: data.params, crest: data.crest, trench: data.trench, trenchY: data.trench_y };
}, ['fire-ribbon-terrain', 'v2'], { revalidate: 86_400 });

export async function GET(req: NextRequest) {
  if ((await planForRequest(req)) !== 'plus') return NextResponse.json({ error: 'plus_required' }, { status: 403 });
  const t = await load().catch(e => { console.error('fire ribbon terrain', e); return null; });
  if (!t) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  return NextResponse.json(t, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
