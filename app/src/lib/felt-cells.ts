// "I felt it" reports grouped into ~10 km (0.1°) cells: centre, count and mean intensity. Only these aggregates ever
// leave the server (GET /api/reports, the share card); never individual reports or exact positions.

export interface FeltCell { lat: number; lon: number; n: number; mmi: number }

export function feltCells(rows: { lat: unknown; lon: unknown; mmi: unknown }[]): FeltCell[] {
  const cells = new Map<string, { lat: number; lon: number; n: number; sum: number }>();
  for (const r of rows) {
    if (r.lat == null || r.lon == null) continue;
    const lat = Math.round(Number(r.lat) * 10) / 10, lon = Math.round(Number(r.lon) * 10) / 10, k = `${lat},${lon}`;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const c = cells.get(k) ?? { lat, lon, n: 0, sum: 0 };
    c.n++; c.sum += Number(r.mmi); cells.set(k, c);
  }
  return [...cells.values()].map(c => ({ lat: c.lat, lon: c.lon, n: c.n, mmi: Math.round((c.sum / c.n) * 10) / 10 }));
}
