import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { planForRequest } from '@/lib/auth';
import { feedUrls, ribbonQuakes, type FeedJson } from '@/lib/ribbon/feed';
import { COLUMNS, MIN_MAGS, PERIODS, POLL_MS, toRow, type MinMag, type Period, type RibbonResponse } from '@/lib/ribbon/shared';
import { END_ALLOWANCE_KM, LEFT_KM, RIGHT_KM, layout } from '@/lib/ribbon/transform';

// GET /api/science/ribbon?period=day|week|month&min=0|2.5|4.5 → the earthquakes of Science → Pacific Fire Ribbon
// (sisma+ only; the plan is checked here, never trusted from the client). From the USGS summary feeds of all
// earthquakes for that period (lib/ribbon/feed.ts), downloaded at most once an hour per period and kept between
// requests; when a download fails the last good copy is kept and its USGS publication time shows its age.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const load = (period: Period) => unstable_cache(async () => {
  const urls = feedUrls(period);
  const [geo, csv] = await Promise.all([
    fetch(urls.geojson, { cache: 'no-store' }).then(r => (r.ok ? (r.json() as Promise<FeedJson>) : null)),
    fetch(urls.csv, { cache: 'no-store' }).then(r => (r.ok ? r.text() : null)).catch(() => null),
  ]);
  if (!geo) throw new Error(`USGS ${period} feed unavailable`); // not cached: the previous copy stays
  const { quakes, counts, generated } = ribbonQuakes(geo, csv);
  return { retrieved: Date.now(), generated, counts, rows: quakes.map(toRow) };
}, ['fire-ribbon', period, 'v1'], { revalidate: POLL_MS / 1000 })();

export async function GET(req: NextRequest) {
  if ((await planForRequest(req)) !== 'plus') return NextResponse.json({ error: 'plus_required' }, { status: 403 });
  const q = req.nextUrl.searchParams;
  const period = (PERIODS as string[]).includes(q.get('period') ?? '') ? (q.get('period') as Period) : 'month';
  const min = (MIN_MAGS.find(m => String(m) === q.get('min')) ?? 2.5) as MinMag;
  const data = await load(period).catch(e => { console.error('fire ribbon', e); return null; });
  if (!data) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  const magAt = COLUMNS.indexOf('mag');
  const rows = min === 0 ? data.rows : data.rows.filter(r => typeof r[magAt] === 'number' && (r[magAt] as number) >= min);
  const body: RibbonResponse = {
    period, min, retrieved: data.retrieved, generated: data.generated, counts: data.counts,
    ...layout(), corridor: { leftKm: LEFT_KM, rightKm: RIGHT_KM, endKm: END_ALLOWANCE_KM },
    columns: COLUMNS, rows,
  };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, max-age=300' } });
}
