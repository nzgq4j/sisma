import { NextRequest, NextResponse } from 'next/server';
import { planForRequest } from '@/lib/auth';
import { activity, depths, energy, fromGeoJson, magnitudes, perYear, regions, timesFromCsv } from '@/lib/seismic-stats';

// GET /api/science/data → worldwide statistics for Science → Data (sisma+ only; the plan is checked here, never trusted
// from the client). From the USGS catalog: the M4.5+ feed for the last 30 days (refreshed every 5 minutes here) and
// all M7+ earthquakes since 1900 (refreshed daily). lib/seismic-stats.ts does the counting.
export const dynamic = 'force-dynamic';

const FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson';
const FROM_YEAR = 1900;
const M7 = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&minmagnitude=7&starttime=${FROM_YEAR}-01-01&orderby=time-asc`;

export async function GET(req: NextRequest) {
  if ((await planForRequest(req)) !== 'plus') return NextResponse.json({ error: 'plus_required' }, { status: 403 });
  const now = Date.now();
  const [feed, m7] = await Promise.all([
    fetch(FEED, { next: { revalidate: 300 } }).then(r => (r.ok ? r.json() : null)).catch(() => null),
    fetch(M7, { next: { revalidate: 86_400 } }).then(r => (r.ok ? r.text() : null)).catch(() => null),
  ]);
  if (!feed) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  const evs = fromGeoJson(feed);
  const act = activity(evs, now);
  // The same 30 UTC days for every chart, so their totals agree.
  const month = evs.filter(e => e.time >= act.d30.start && e.time <= now);
  return NextResponse.json({
    updated: now,
    total30: month.length,
    activity: act,
    magnitudes: magnitudes(month),
    depths: depths(month),
    regions: regions(month),
    energy: energy(evs, now),
    history: m7 ? perYear(timesFromCsv(m7), FROM_YEAR, now) : null,
  }, { headers: { 'Cache-Control': 'private, max-age=300' } });
}
