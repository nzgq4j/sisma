import { NextRequest, NextResponse } from 'next/server';
import { fetchEmscFelt, isEmscUnid } from '@/lib/quakes/emsc-felt';

// GET /api/emsc-felt?unid=<EMSC unid> → { unid, reports, maxMmi, cells: [{ lat, lon, n, mmi }] }
// EMSC felt reports (lib/quakes/emsc-felt.ts) grouped into ~10 km cells on the server: individual positions are never
// returned. Data © EMSC (CC BY 4.0). Cached for 5 minutes; { cells: [] } when EMSC has none or can't be reached.
export async function GET(req: NextRequest) {
  const unid = req.nextUrl.searchParams.get('unid') ?? '';
  if (!isEmscUnid(unid)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const d = await fetchEmscFelt(unid);
    return NextResponse.json({ unid, ...d }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch {
    return NextResponse.json({ unid, reports: 0, maxMmi: null, cells: [], unavailable: true }, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
