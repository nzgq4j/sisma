// Country of an earthquake from its coordinates (world-atlas 110m outlines → ISO 3166 alpha-2 for the bundled flags in
// public/flags). Events at sea get the nearest country within NEAR_KM, flagged as "near". Region text from the feeds
// isn't reliable enough for this ("FLORES REGION, INDONESIA", "Off the coast of …").
import { geoBounds, geoContains } from 'd3-geo';
import type { Feature, Geometry, Position } from 'geojson';
import { COUNTRIES } from './world-data';
import CODES from './country-codes.json';

const NEAR_KM = 300;
const R_KM = 6371;
const codes = CODES as Record<string, string>;

// Fast enough to run for every quake in the browser: a bounding-box check picks the few countries worth the exact
// spherical point-in-polygon test, and the nearest-country search compares unit vectors (largest dot product =
// smallest great-circle distance) instead of calling trigonometry for every outline point.
interface Entry { code: string; feature: Feature<Geometry>; box: [[number, number], [number, number]]; xyz: Float64Array }
let index: Entry[] | null = null;
const RAD = Math.PI / 180;
function build(): Entry[] {
  return (COUNTRIES.features as Feature<Geometry, { name: string }>[]).flatMap(f => {
    const code = (f.id != null ? codes[String(f.id)] : undefined) ?? codes[`name:${f.properties?.name}`];
    if (!code) return [];
    const points: Position[] = [];
    const g = f.geometry;
    const rings = g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : [];
    for (const ring of rings) for (const p of ring) points.push(p);
    const xyz = new Float64Array(points.length * 3);
    points.forEach(([lon, lat], i) => {
      const cl = Math.cos(lat * RAD);
      xyz[i * 3] = cl * Math.cos(lon * RAD); xyz[i * 3 + 1] = cl * Math.sin(lon * RAD); xyz[i * 3 + 2] = Math.sin(lat * RAD);
    });
    return [{ code, feature: f, box: geoBounds(f) as [[number, number], [number, number]], xyz }];
  });
}

/** Whether the point can be inside the box from geoBounds (which may cross the antimeridian: west > east). */
function inBox([[w, s], [e, n]]: [[number, number], [number, number]], lon: number, lat: number) {
  if (lat < s || lat > n) return false;
  return w <= e ? lon >= w && lon <= e : lon >= w || lon <= e;
}

export interface CountryHit { code: string; near: boolean }

/** ISO alpha-2 code (lowercase) of the country containing the point, else the nearest one within 300 km. */
/** `nearKm`: how far out at sea an event still counts as near a country (flags use 300 km; regions search further). */
export function countryAt(lat: number, lon: number, nearKm = NEAR_KM): CountryHit | null {
  index ??= build();
  const p: [number, number] = [lon, lat];
  for (const e of index) if (inBox(e.box, lon, lat) && geoContains(e.feature, p)) return { code: e.code, near: false };
  const cl = Math.cos(lat * RAD), x = cl * Math.cos(lon * RAD), y = cl * Math.sin(lon * RAD), z = Math.sin(lat * RAD);
  let best: Entry | null = null, bestDot = -2;
  for (const e of index) {
    const v = e.xyz;
    for (let i = 0; i < v.length; i += 3) {
      const d = x * v[i] + y * v[i + 1] + z * v[i + 2];
      if (d > bestDot) { bestDot = d; best = e; }
    }
  }
  const km = Math.acos(Math.min(1, Math.max(-1, bestDot))) * R_KM;
  return best && km <= nearKm ? { code: best.code, near: true } : null;
}
