// Country of an earthquake from its coordinates (world-atlas 110m outlines → ISO 3166 alpha-2 for the bundled flags in
// public/flags). Events at sea get the nearest country within NEAR_KM, flagged as "near". Region text from the feeds
// isn't reliable enough for this ("FLORES REGION, INDONESIA", "Off the coast of …").
import { geoContains, geoDistance } from 'd3-geo';
import type { Feature, Geometry, Position } from 'geojson';
import { COUNTRIES } from './world-data';
import CODES from './country-codes.json';

const NEAR_KM = 300;
const R_KM = 6371;
const codes = CODES as Record<string, string>;

interface Entry { code: string; feature: Feature<Geometry>; points: Position[] }
let index: Entry[] | null = null;
function build(): Entry[] {
  return (COUNTRIES.features as Feature<Geometry, { name: string }>[]).flatMap(f => {
    const code = (f.id != null ? codes[String(f.id)] : undefined) ?? codes[`name:${f.properties?.name}`];
    if (!code) return [];
    const points: Position[] = [];
    const g = f.geometry;
    const rings = g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : [];
    for (const ring of rings) for (const p of ring) points.push(p);
    return [{ code, feature: f, points }];
  });
}

export interface CountryHit { code: string; near: boolean }

/** ISO alpha-2 code (lowercase) of the country containing the point, else the nearest one within 300 km. */
/** `nearKm`: how far out at sea an event still counts as near a country (flags use 300 km; regions search further). */
export function countryAt(lat: number, lon: number, nearKm = NEAR_KM): CountryHit | null {
  index ??= build();
  const p: [number, number] = [lon, lat];
  for (const e of index) if (geoContains(e.feature, p)) return { code: e.code, near: false };
  let best: Entry | null = null, bestKm = Infinity;
  for (const e of index) for (const q of e.points) {
    const km = geoDistance(p, q as [number, number]) * R_KM;
    if (km < bestKm) { bestKm = km; best = e; }
  }
  return best && bestKm <= nearKm ? { code: best.code, near: true } : null;
}
