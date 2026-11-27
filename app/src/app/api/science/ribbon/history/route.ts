import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { planForRequest } from '@/lib/auth';
import { ribbonQuakes, type FeedJson } from '@/lib/ribbon/feed';
import { HISTORY_MAX_ROWS, fdsnUrls, historyPieces, pieceIsSettled } from '@/lib/ribbon/history';
import { COLUMNS, MIN_MAGS, toRow, type HistoryResponse, type MinMag, type RibbonQuake } from '@/lib/ribbon/shared';

// GET /api/science/ribbon/history?start=YYYY-MM-DD&end=YYYY-MM-DD&min=0|2.5|4.5 → the ribbon's earthquakes from the
// USGS ComCat catalogue for those whole UTC days (sisma+ only; plan checked here). The range is searched in calendar
// pieces (lib/ribbon/history.ts); each piece is kept for a week once it is more than two days old, otherwise for an
// hour. Earthquakes are placed and filtered exactly as for the live feeds (lib/ribbon/feed.ts).
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TOO_MANY = /exceeds search limit/i;

/** One USGS search (GeoJSON + CSV); a piece matching more than the service allows is split in two and searched again. */
async function search(from: number, to: number, min: MinMag, depth = 0): Promise<{ quakes: RibbonQuake[]; earthquakes: number }> {
  const urls = fdsnUrls(from, to, min);
  const r = await fetch(urls.geojson, { cache: 'no-store' });
  if (r.status === 400 && depth < 4 && TOO_MANY.test(await r.clone().text())) {
    const mid = from + Math.floor((to - from) / 2);
    const [a, b] = await Promise.all([search(from, mid, min, depth + 1), search(mid, to, min, depth + 1)]);
    return { quakes: [...a.quakes, ...b.quakes], earthquakes: a.earthquakes + b.earthquakes };
  }
  if (!r.ok) throw new Error(`USGS search ${r.status}`);
  const geo = (await r.json()) as FeedJson;
  const csv = await fetch(urls.csv, { cache: 'no-store' }).then(x => (x.ok ? x.text() : null)).catch(() => null);
  const { quakes, counts } = ribbonQuakes(geo, csv);
  return { quakes, earthquakes: counts.earthquakes };
}

/** One piece, cached; rows without the event link (rebuilt by the page). */
const piece = (from: number, to: number, min: MinMag, settled: boolean) => unstable_cache(async () => {
  const { quakes, earthquakes } = await search(from, to, min);
  return { earthquakes, rows: quakes.map(q => toRow({ ...q, url: '' })) };
}, ['fire-ribbon-history', String(from), String(to), String(min), 'v1'], { revalidate: settled ? 7 * 86_400 : 3_600 })();

/** Runs at most `n` tasks at a time, in order. */
async function limited<T>(tasks: (() => Promise<T>)[], n: number): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => { while (i < tasks.length) { const k = i++; out[k] = await tasks[k](); } }));
  return out;
}

export async function GET(req: NextRequest) {
  if ((await planForRequest(req)) !== 'plus') return NextResponse.json({ error: 'plus_required' }, { status: 403 });
  const q = req.nextUrl.searchParams;
  const min = MIN_MAGS.find(m => String(m) === q.get('min'));
  if (min === undefined) return NextResponse.json({ error: 'bad_min' }, { status: 400 });
  const now = Date.now();
  const range = historyPieces(q.get('start'), q.get('end'), min, now);
  if (!range.ok) return NextResponse.json({ error: range.error }, { status: 400 });
  let parts: Awaited<ReturnType<typeof piece>>[];
  try {
    parts = await limited(range.pieces.map(([a, b]) => () => piece(a, b, min, pieceIsSettled(b, now))), 6);
  } catch (e) {
    console.error('fire ribbon history', e);
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
  // Pieces meet at their edges: an event exactly on an edge can come back twice, so keep one row per id.
  const idAt = COLUMNS.indexOf('id'), updAt = COLUMNS.indexOf('updated'), timeAt = COLUMNS.indexOf('time');
  const byId = new Map<string, unknown[]>();
  for (const p of parts) for (const r of p.rows) {
    const prev = byId.get(r[idAt] as string);
    if (!prev || (r[updAt] as number) > (prev[updAt] as number)) byId.set(r[idAt] as string, r);
  }
  const rows = [...byId.values()].sort((a, b) => (a[timeAt] as number) - (b[timeAt] as number));
  const earthquakes = parts.reduce((s, p) => s + p.earthquakes, 0);
  if (rows.length > HISTORY_MAX_ROWS) return NextResponse.json({ error: 'too_many', ribbon: rows.length, max: HISTORY_MAX_ROWS }, { status: 413 });
  const body: HistoryResponse = {
    start: q.get('start')!, end: q.get('end')!, min, from: range.from, to: range.to, retrieved: now,
    counts: { earthquakes, ribbon: rows.length }, columns: COLUMNS, rows,
  };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, max-age=600' } });
}
