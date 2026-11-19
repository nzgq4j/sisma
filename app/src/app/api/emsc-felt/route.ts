import { NextRequest, NextResponse } from 'next/server';
import { fetchEmscFelt, isEmscUnid, unzip } from '@/lib/quakes/emsc-felt';

// GET /api/emsc-felt?unid=<EMSC unid> → { unid, reports, maxMmi, cells: [{ lat, lon, n, mmi }] }
// EMSC felt reports (lib/quakes/emsc-felt.ts) grouped into ~10 km cells on the server: individual positions are never
// returned. Data © EMSC (CC BY 4.0). Cached for 5 minutes; { cells: [] } when EMSC has none or can't be reached.
export async function GET(req: NextRequest) {
  const unid = req.nextUrl.searchParams.get('unid') ?? '';
  if (!isEmscUnid(unid)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const dbg = req.nextUrl.searchParams.get('debug');
  if (dbg === 'csv') { // TEMPORARY diagnostic, removed before merge
    const r = await fetch(`https://www.seismicportal.eu/testimonies-ws/api/search?unids=[${unid}]&includeTestimonies=true`, { cache: 'no-store' });
    const files = unzip(new Uint8Array(await r.arrayBuffer()));
    return NextResponse.json(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, { len: v.length, lines: v.split(/\r?\n/).length, head: v.slice(0, 2500) }])));
  }
  if (dbg) { // TEMPORARY diagnostic, removed before merge
    const urls = [`https://www.seismicportal.eu/testimonies-ws/api/search?unids=[${unid}]&includeTestimonies=true`, `https://www.seismicportal.eu/testimonies-ws/api/search?unids=%5B${unid}%5D&includeTestimonies=true`, `https://www.seismicportal.eu/testimonies-ws/api/search?eventid=${unid}&format=json`, `https://www.seismicportal.eu/testimonies-ws/api/openapi.json`];
    const out = [];
    for (const u of urls) {
      try { const r = await fetch(u, { cache: 'no-store', redirect: 'manual' }); const b = new Uint8Array(await r.arrayBuffer());
        out.push({ u, status: r.status, type: r.headers.get('content-type'), loc: r.headers.get('location'), len: b.length, head: Buffer.from(b.slice(0, dbg === 'long' ? 6000 : 400)).toString('latin1') });
      } catch (e) { out.push({ u, error: String(e) }); }
    }
    return NextResponse.json(out);
  }
  try {
    const d = await fetchEmscFelt(unid);
    return NextResponse.json({ unid, ...d }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch {
    return NextResponse.json({ unid, reports: 0, maxMmi: null, cells: [], unavailable: true }, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
