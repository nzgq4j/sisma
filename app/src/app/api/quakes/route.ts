import { NextRequest, NextResponse } from 'next/server';
import { SOURCES } from '@/lib/quakes/sources';
import { mergeQuakes } from '@/lib/quakes/merge';
import { RANGE_DAYS, type RangeKey, type SortKey } from '@/lib/quakes/types';
import { distanceKm } from '@/lib/geo';
import { limits, type Plan } from '@/lib/entitlements';
import { planForRequest } from '@/lib/auth';

export const revalidate = 60;

// GET /api/quakes?range=7d&sort=time&region=Japan&lat=..&lon=..&minMag=..&maxDepth=..&felt=1&tsunami=1
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const plan: Plan = await planForRequest(req);
  const L = limits(plan);
  const range = (q.get('range') ?? '7d') as RangeKey;
  const days = RANGE_DAYS[range] ?? 7;
  if (days > L.historyDays) return NextResponse.json({ error: 'upgrade_required', entitlement: 'historyDays' }, { status: 402 });

  const results = await Promise.allSettled([
    SOURCES.usgs({ days, minMag: days > 30 ? 5 : 2.5 }),
    SOURCES.emsc({ days: Math.min(days, 30), minMag: 2.5 }),
    SOURCES.geonet({ days, minMag: 0 }),
    SOURCES.jma({ days, minMag: 0 }),
  ]);
  let list = mergeQuakes(results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : [])));
  const since = Date.now() - days * 864e5;
  list = list.filter(x => x.time >= since);

  const region = q.get('region');
  if (region && region !== 'all') list = list.filter(x => x.region === region);
  if (L.advancedFilters) {
    const minMag = Number(q.get('minMag') ?? 0), maxDepth = Number(q.get('maxDepth') ?? 1000);
    list = list.filter(x => x.mag >= minMag && x.depthKm <= maxDepth);
    if (q.get('felt') === '1') list = list.filter(x => (x.felt ?? 0) > 0);
    if (q.get('tsunami') === '1') list = list.filter(x => x.tsunami);
  }
  const lat = Number(q.get('lat')), lon = Number(q.get('lon'));
  const withDist = list.map(x => ({ ...x, distanceKm: Number.isFinite(lat) && Number.isFinite(lon) ? distanceKm(lat, lon, x.lat, x.lon) : null }));
  const sort = (q.get('sort') ?? 'time') as SortKey;
  if (sort === 'mag') withDist.sort((a, b) => b.mag - a.mag);
  if (sort === 'distance') withDist.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  return NextResponse.json({ plan, count: withDist.length, quakes: withDist, sources: ['usgs', 'emsc', 'geonet', 'jma'] });
}
