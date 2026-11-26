import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { planForRequest } from '@/lib/auth';
import {
  ERUPTION_URL, REPORT_URL, VOLCANO_URL, decodeMixed, eruptionHistory, ribbonVolcanoes, weeklyReports, withReports,
  type VolcanoResponse, type WeeklyReport,
} from '@/lib/ribbon/volcanoes';

// GET /api/science/ribbon/volcanoes → the volcanoes of Science → Pacific Fire Ribbon (sisma+ only; plan checked here).
// The Smithsonian catalogue and eruption history change rarely: downloaded at most once a day. The weekly activity
// report: at most once an hour. A failed download keeps the last good copy; with no copy of the report, statuses are
// "unknown" (lib/ribbon/volcanoes.ts).
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const get = (url: string) => fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });

const catalogue = unstable_cache(async () => {
  const [v, e] = await Promise.all([get(VOLCANO_URL), get(ERUPTION_URL)]);
  if (!v.ok || !e.ok) throw new Error(`GVP catalogue ${v.status}/${e.status}`);
  const list = ribbonVolcanoes(await v.json(), eruptionHistory(await e.json()), new Map());
  if (!list.length) throw new Error('GVP catalogue: no volcanoes on the ribbon');
  return { retrieved: Date.now(), list };
}, ['fire-ribbon-volcanoes', 'v1'], { revalidate: 86_400 });

const report = unstable_cache(async () => {
  const r = await get(REPORT_URL);
  if (!r.ok) throw new Error(`GVP weekly report ${r.status}`);
  const { published, reports } = weeklyReports(decodeMixed(new Uint8Array(await r.arrayBuffer())));
  return { retrieved: Date.now(), published, reports: [...reports.values()] };
}, ['fire-ribbon-weekly-report', 'v1'], { revalidate: 3_600 });

export async function GET(req: NextRequest) {
  if ((await planForRequest(req)) !== 'plus') return NextResponse.json({ error: 'plus_required' }, { status: 403 });
  const [cat, rep] = await Promise.all([
    catalogue().catch(e => { console.error('fire ribbon volcanoes', e); return null; }),
    report().catch(e => { console.error('fire ribbon weekly report', e); return null; }),
  ]);
  if (!cat) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  const reports = rep ? new Map<number, WeeklyReport>(rep.reports.map(x => [x.n, x])) : null;
  const body: VolcanoResponse = {
    catalogue: { retrieved: cat.retrieved },
    report: rep ? { retrieved: rep.retrieved, published: rep.published } : null,
    volcanoes: withReports(cat.list, reports),
  };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, max-age=300' } });
}
