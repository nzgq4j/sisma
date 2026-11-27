// Pacific Fire Ribbon, analysis (step 7; brief §13): statistics of the earthquakes the ribbon shows. Pure functions,
// tested in analysis.test.ts. Everything here is computed from the loaded catalogue rows; nothing is modelled or
// predicted. Values are "observed" (counts, rates, sums, smallest magnitude) unless marked as an estimate.
import { DEPTH_BANDS, GROUPS, type GroupId, type RibbonQuake } from './shared';
import type { RibbonVolcano } from './volcanoes';

/** Moment magnitude types (USGS: Mww, Mwc, Mwb, Mwr, Mw, Mwp …). Only these are converted to seismic moment. */
export const isMw = (magType: string | null) => !!magType && /^mw/i.test(magType);
/** Seismic moment in N·m from moment magnitude: M0 = 10^(1.5 Mw + 9.1) (Hanks & Kanamori 1979, IASPEI 2013 form). */
export const momentNm = (mw: number) => 10 ** (1.5 * mw + 9.1);
/** The moment magnitude a total moment would be as one earthquake. */
export const mwOf = (m0: number) => (m0 > 0 ? (Math.log10(m0) - 9.1) / 1.5 : null);

export interface RouteBin { x0: number; x1: number; count: number; perDay100: number; moment: number }

/**
 * Earthquakes along the route in bins of `binKm`: the count, the rate per 100 km of route per day (normalised by the
 * bin length and the `days` covered), and the seismic moment of those with a moment magnitude. Earthquakes beyond the
 * route's ends go to the end bins.
 */
export function alongRoute(quakes: RibbonQuake[], lengthKm: number, binKm: number, days: number): RouteBin[] {
  const n = Math.max(1, Math.ceil(lengthKm / binKm));
  const bins: RouteBin[] = Array.from({ length: n }, (_, i) => ({ x0: i * binKm, x1: Math.min(lengthKm, (i + 1) * binKm), count: 0, perDay100: 0, moment: 0 }));
  for (const q of quakes) {
    const b = bins[Math.max(0, Math.min(n - 1, Math.floor(q.x / binKm)))];
    b.count++;
    if (q.mag !== null && isMw(q.magType)) b.moment += momentNm(q.mag);
  }
  for (const b of bins) b.perDay100 = days > 0 ? b.count / ((b.x1 - b.x0) / 100) / days : 0;
  return bins;
}

export interface RegionRow {
  group: GroupId | 'joins'; lengthKm: number;
  count: number; perDay1000: number;
  /** Moment of the earthquakes with a moment magnitude, how many those are, and the total as one earthquake's Mw. */
  moment: number; mwCount: number; mwTotal: number | null;
  /** Catalogue volcanoes (Holocene) per 1,000 km of route, and those in this week's report. */
  volcanoes: number; volcPer1000: number; reported: number;
  /** Smallest magnitude recorded (observed) and the magnitude of completeness by maximum curvature (an estimate). */
  minMag: number | null; mcEstimate: number | null;
}

/** Fewest earthquakes for a completeness estimate (fewer give an unstable maximum). */
export const MC_MIN_EVENTS = 50;
/**
 * Magnitude of completeness by maximum curvature (Wiemer & Wyss 2000): the lower edge of the most populated 0.1-unit
 * magnitude bin. A quick estimate that tends to come out low; null with fewer than MC_MIN_EVENTS magnitudes.
 */
export function mcMaxCurvature(mags: number[]): number | null {
  if (mags.length < MC_MIN_EVENTS) return null;
  const counts = new Map<number, number>();
  for (const m of mags) { const k = Math.round(Math.floor(m * 10 + 1e-9)); counts.set(k, (counts.get(k) ?? 0) + 1); }
  let best = -Infinity, bestN = -1;
  for (const [k, c] of counts) if (c > bestN || (c === bestN && k < best)) { best = k; bestN = c; }
  return best / 10;
}

/**
 * One row per region (in route order), plus the joins between arcs. An earthquake belongs to a region when the route
 * position it was placed at lies in that region's stretch (from = to); one placed on a join (from ≠ to) is counted
 * in "joins". Rates are per 1,000 km of the region's stretch per day.
 */
export function byRegion(quakes: RibbonQuake[], regions: { group: GroupId; x0: number; x1: number }[], gaps: { x0: number; x1: number }[],
  volcanoes: RibbonVolcano[], days: number): RegionRow[] {
  const rows: RegionRow[] = [
    ...regions.map(r => ({ group: r.group as GroupId | 'joins', lengthKm: r.x1 - r.x0 })),
    { group: 'joins' as const, lengthKm: gaps.reduce((s, g) => s + (g.x1 - g.x0), 0) },
  ].map(r => ({ ...r, count: 0, perDay1000: 0, moment: 0, mwCount: 0, mwTotal: null, volcanoes: 0, volcPer1000: 0, reported: 0, minMag: null, mcEstimate: null }));
  const at = new Map(rows.map((r, i) => [r.group, i]));
  const mags: number[][] = rows.map(() => []);
  for (const q of quakes) {
    const i = q.from === q.to ? at.get(GROUPS[q.from]) : at.get('joins');
    if (i === undefined) continue;
    const r = rows[i];
    r.count++;
    if (q.mag !== null) {
      mags[i].push(q.mag);
      r.minMag = r.minMag === null ? q.mag : Math.min(r.minMag, q.mag);
      if (isMw(q.magType)) { r.moment += momentNm(q.mag); r.mwCount++; }
    }
  }
  for (const v of volcanoes) {
    const i = at.get(GROUPS[v.group]);
    if (i === undefined) continue;
    rows[i].volcanoes++;
    if (v.status !== 'catalogued' && v.status !== 'unknown') rows[i].reported++;
  }
  rows.forEach((r, i) => {
    r.perDay1000 = days > 0 && r.lengthKm > 0 ? r.count / (r.lengthKm / 1000) / days : 0;
    r.volcPer1000 = r.lengthKm > 0 ? r.volcanoes / (r.lengthKm / 1000) : 0;
    r.mwTotal = mwOf(r.moment);
    r.mcEstimate = mcMaxCurvature(mags[i]);
  });
  return rows;
}

/** Counts per magnitude bin of `step` (lower edges), from the smallest to the largest magnitude present. */
export function magHistogram(quakes: RibbonQuake[], step = 0.5): { m0: number; count: number }[] {
  const mags = quakes.map(q => q.mag).filter((m): m is number => m !== null);
  if (!mags.length) return [];
  const lo = Math.floor(Math.min(...mags) / step), hi = Math.floor(Math.max(...mags) / step);
  const out = Array.from({ length: hi - lo + 1 }, (_, i) => ({ m0: Math.round((lo + i) * step * 10) / 10, count: 0 }));
  for (const m of mags) out[Math.floor(m / step) - lo].count++;
  return out;
}

/** Counts per depth class (the ribbon's colour classes). */
export const depthHistogram = (quakes: RibbonQuake[]) => {
  const out = DEPTH_BANDS.map((b, i) => ({ band: i, color: b.color, min: i ? DEPTH_BANDS[i - 1].max : 0, max: b.max, count: 0 }));
  for (const q of quakes) out[DEPTH_BANDS.findIndex(b => q.depth < b.max)].count++;
  return out;
};
