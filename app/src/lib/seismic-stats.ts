// Science → Data: worldwide statistics from the USGS catalog (GET /api/science/data, sisma+). Pure functions here,
// tested in seismic-stats.test.ts. Global counts use M4.5+, the USGS National Earthquake Information Center's target
// for global completeness; the long-term chart uses M7+, whose yearly numbers USGS describes as fairly constant since
// about 1900 (more seismometers record more small earthquakes, not more earthquakes).
import { WORLD_REGIONS, type WorldRegion } from './world-regions';
import { worldRegion } from './world-region-of';
import { onRingOfFire } from './ring-of-fire';

export interface Ev { time: number; mag: number; depthKm: number; lat: number; lon: number }

const HOUR = 3_600_000, DAY = 86_400_000;

/** Events per hour for the last 24 hours, and per UTC day for the last 7 and 30 days (oldest first). */
export function activity(evs: Ev[], now: number) {
  const bucket = (n: number, size: number, start: number) => {
    const out = new Array<number>(n).fill(0);
    for (const e of evs) { const i = Math.floor((e.time - start) / size); if (i >= 0 && i < n) out[i]++; }
    return out;
  };
  const hourStart = Math.floor(now / HOUR) * HOUR - 23 * HOUR;
  const dayStart = (n: number) => Math.floor(now / DAY) * DAY - (n - 1) * DAY;
  return {
    h24: { start: hourStart, step: HOUR, counts: bucket(24, HOUR, hourStart) },
    d7: { start: dayStart(7), step: DAY, counts: bucket(7, DAY, dayStart(7)) },
    d30: { start: dayStart(30), step: DAY, counts: bucket(30, DAY, dayStart(30)) },
  };
}

/** Magnitude bins of half a unit from 4.5, the last one open (7.0+). */
export const MAG_BINS = [4.5, 5, 5.5, 6, 6.5, 7] as const;
export function magnitudes(evs: Ev[]) {
  const counts = MAG_BINS.map(() => 0);
  for (const e of evs) {
    if (e.mag < MAG_BINS[0]) continue;
    let i = MAG_BINS.length - 1;
    while (i > 0 && e.mag < MAG_BINS[i]) i--;
    counts[i]++;
  }
  return counts;
}

/** USGS depth classes: shallow 0–70 km, intermediate 70–300 km, deep 300–700 km. */
export function depths(evs: Ev[]) {
  const out = { shallow: 0, intermediate: 0, deep: 0 };
  for (const e of evs) out[e.depthKm < 70 ? 'shallow' : e.depthKm < 300 ? 'intermediate' : 'deep']++;
  return out;
}

/** Events per world region (largest first, empty regions left out) and how many are on the Ring of Fire. */
export function regions(evs: Ev[]) {
  const m = new Map<WorldRegion, { count: number; ring: number }>();
  let ring = 0;
  for (const e of evs) {
    const r = worldRegion(e.lat, e.lon), on = onRingOfFire(e.lat, e.lon);
    const c = m.get(r) ?? { count: 0, ring: 0 };
    c.count++; if (on) { c.ring++; ring++; }
    m.set(r, c);
  }
  const list = WORLD_REGIONS.map(r => ({ region: r, count: m.get(r)?.count ?? 0, ring: m.get(r)?.ring ?? 0 }))
    .filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  return { list, ring, total: evs.length };
}

/** Radiated energy estimate in joules: log10 E = 1.5 M + 4.8 (each magnitude step ≈ 32 times more). An approximation. */
export const energyJ = (mag: number) => 10 ** (1.5 * mag + 4.8);

/** Cumulative estimated energy per UTC day over the last `days` days, and the largest event's share of the total. */
export function energy(evs: Ev[], now: number, days = 30) {
  const start = Math.floor(now / DAY) * DAY - (days - 1) * DAY;
  const daily = new Array<number>(days).fill(0);
  let top: Ev | null = null;
  for (const e of evs) {
    const i = Math.floor((e.time - start) / DAY);
    if (i < 0 || i >= days) continue;
    daily[i] += energyJ(e.mag);
    if (!top || e.mag > top.mag) top = e;
  }
  const cumulative: number[] = [];
  daily.reduce((s, v) => { cumulative.push(s + v); return s + v; }, 0);
  const total = cumulative.at(-1) ?? 0;
  return { start, step: DAY, cumulative, total, largest: top ? { mag: top.mag, time: top.time, share: total ? energyJ(top.mag) / total : 0 } : null };
}

/** M7+ earthquakes per calendar year (UTC), from `fromYear` to the current year (which is partial). */
export function perYear(times: number[], fromYear: number, now: number) {
  const last = new Date(now).getUTCFullYear();
  const counts = new Array<number>(last - fromYear + 1).fill(0);
  for (const t of times) { const y = new Date(t).getUTCFullYear(); if (y >= fromYear && y <= last) counts[y - fromYear]++; }
  const full = counts.slice(0, -1);
  return { fromYear, counts, average: full.length ? full.reduce((a, b) => a + b, 0) / full.length : 0 };
}

/** The USGS GeoJSON feed as events (M4.5+ only). */
export function fromGeoJson(j: unknown): Ev[] {
  const fs = (j as { features?: { properties?: { mag?: number | null; time?: number }; geometry?: { coordinates?: number[] } }[] })?.features ?? [];
  return fs.flatMap(f => {
    const mag = f.properties?.mag, time = f.properties?.time, c = f.geometry?.coordinates;
    return typeof mag === 'number' && mag >= 4.5 && typeof time === 'number' && Array.isArray(c) && c.length >= 2
      ? [{ mag, time, lon: c[0], lat: c[1], depthKm: Math.max(0, c[2] ?? 0) }] : [];
  });
}

/** Event times from a USGS fdsnws CSV answer (first column "time", ISO 8601). */
export function timesFromCsv(csv: string): number[] {
  return csv.split(/\r?\n/).slice(1).flatMap(line => { const t = Date.parse(line.split(',')[0]); return Number.isFinite(t) ? [t] : []; });
}
