// All felt sources merged into one grid of ~10 km cells (0.1°), drawn in one style with one intensity legend
// (region view: components/dash/WorldMap.tsx; share card: lib/share-map.ts). A cell's colour is the mean intensity
// (MMI) of the reports in it, weighted by their number: sisma reports, USGS "Did You Feel It?" responses and EMSC
// reports. Areas from the automatic felt map carry no intensity; where no report covers them they become cells with
// mmi null ("felt, intensity unknown"), drawn in FELT_NEUTRAL. No server code: used in the browser too.
import { FELT_NEUTRAL, MMI_COLORS } from './theme';

export interface FeltGridCell { lat: number; lon: number; mmi: number | null; n: number }
type Pt = { lat: number; lon: number };

export const FELT_CELL_DEG = 0.1;
const snap = (v: number) => Math.round(v / FELT_CELL_DEG) * FELT_CELL_DEG;

export function feltGrid(src: {
  reports?: (Pt & { n: number; mmi: number })[];
  dyfi?: (Pt & { n: number; cdi: number })[];
  emsc?: (Pt & { n: number; mmi: number })[];
  heat?: Pt[];
}): FeltGridCell[] {
  const cells = new Map<string, { lat: number; lon: number; n: number; sum: number }>();
  const at = (p: Pt) => {
    const lat = Math.round(snap(p.lat) * 10) / 10, lon = Math.round(snap(p.lon) * 10) / 10, k = `${lat},${lon}`;
    let c = cells.get(k);
    if (!c) { c = { lat, lon, n: 0, sum: 0 }; cells.set(k, c); }
    return c;
  };
  const add = (p: Pt, n: number, mmi: number) => {
    if (!Number.isFinite(mmi) || !(n > 0)) return;
    const c = at(p); c.n += n; c.sum += n * Math.min(10, Math.max(1, mmi));
  };
  for (const r of src.reports ?? []) add(r, r.n, r.mmi);
  for (const r of src.dyfi ?? []) add(r, r.n, r.cdi);
  for (const r of src.emsc ?? []) add(r, r.n, r.mmi);
  for (const h of src.heat ?? []) at(h);
  return [...cells.values()].map(c => ({ lat: c.lat, lon: c.lon, n: c.n, mmi: c.n > 0 ? Math.round((c.sum / c.n) * 10) / 10 : null }));
}

/** A cell's fill: its intensity colour, or the neutral colour when its intensity is unknown. */
export const feltColor = (mmi: number | null) => (mmi == null ? FELT_NEUTRAL : MMI_COLORS[Math.min(10, Math.max(1, Math.round(mmi))) - 1]);
