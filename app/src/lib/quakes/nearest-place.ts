// Distance and direction from a nearby town for events whose source gives only a region name (EMSC sends
// "POTOSI, BOLIVIA", JMA some offshore areas), written as USGS does: "27 km SSE of Uyuni". The app converts the
// kilometres to miles where chosen (lib/units.ts).
//
// Towns: GeoNames places with more than 1,000 people (towns.json, built by scripts/build-towns.mjs; CC BY 4.0, credited
// in the app), the same list USGS names its places from. The town is the nearest one in the event's own country (the
// country it is in, or the nearest one for an event just offshore: lib/country.ts), so an event in Albania is described
// from an Albanian town; if that country has none within MAX_KM, the nearest town in any country.
// Server only: used by GET /api/quakes and lib/quakes/find.ts (share card, Bluesky posts, alerts); never by app pages.
import data from './towns.json';
import { countryAt } from '../country';
import type { Quake } from './types';

/** A town further than this from the event isn't a useful reference: the source's region name stays. */
export const MAX_KM = 300;
const R_KM = 6371, RAD = Math.PI / 180;
const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export interface Town { lon: number; lat: number; cc: string; name: string }

/** Towns bucketed by 1° cell, so a search only looks at the cells within MAX_KM. */
export class TownIndex {
  private cells = new Map<number, Town[]>();
  constructor(towns: Town[]) {
    for (const t of towns) {
      const k = TownIndex.key(Math.floor(t.lat), Math.floor(t.lon));
      const c = this.cells.get(k);
      if (c) c.push(t); else this.cells.set(k, [t]);
    }
  }
  private static key(lat: number, lon: number) { return (lat + 90) * 400 + (((lon % 360) + 540) % 360); }
  /** Towns in the cells around a position, out to about MAX_KM. */
  *near(lat: number, lon: number): Generator<Town> {
    const dLat = Math.ceil(MAX_KM / 111) + 1;
    const cos = Math.max(0.05, Math.cos(Math.min(89, Math.abs(lat)) * RAD));
    const dLon = Math.min(180, Math.ceil(MAX_KM / (111 * cos)) + 1);
    const la0 = Math.floor(lat), lo0 = Math.floor(lon);
    for (let a = la0 - dLat; a <= la0 + dLat; a++) {
      if (a < -90 || a > 89) continue;
      for (let o = lo0 - dLon; o <= lo0 + dLon; o++) {
        const c = this.cells.get(TownIndex.key(a, o));
        if (c) yield* c;
      }
    }
  }
}

let index: TownIndex | null = null;
const allTowns = () => (index ??= new TownIndex((data as unknown as { rows: [number, number, string, string][] }).rows.map(r => ({ lon: r[0], lat: r[1], cc: r[2], name: r[3] }))));

/** True when the title already says how far and which way from a place ("17 km NW of Ocotillo", "5 km north-west of Seddon"). */
export const hasRelativePlace = (title: string) => /\b\d+(\.\d+)?\s*(km|mi)\b.*\bof\b/i.test(title);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
/** Compass point (16) of the event as seen from the town. */
function compass(fromLat: number, fromLon: number, toLat: number, toLon: number) {
  const φ1 = fromLat * RAD, φ2 = toLat * RAD, Δλ = (toLon - fromLon) * RAD;
  const θ = Math.atan2(Math.sin(Δλ) * Math.cos(φ2), Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ));
  return POINTS[Math.round(((θ / RAD + 360) % 360) / 22.5) % 16];
}

/**
 * "27 km SSE of Uyuni": the nearest town within MAX_KM in country `cc` (ISO alpha-2, any case) when given and it has
 * one, else the nearest town within MAX_KM; null when there is none.
 */
export function nearestPlaceText(lat: number, lon: number, cc: string | null = null, towns: TownIndex = allTowns()): string | null {
  const want = cc?.toUpperCase() ?? null;
  let best: Town | null = null, bestKm = Infinity, home: Town | null = null, homeKm = Infinity;
  for (const t of towns.near(lat, lon)) {
    const km = haversineKm(lat, lon, t.lat, t.lon);
    if (km > MAX_KM) continue;
    if (km < bestKm) { bestKm = km; best = t; }
    if (want && t.cc === want && km < homeKm) { homeKm = km; home = t; }
  }
  const pick = home ?? best, km = home ? homeKm : bestKm;
  if (!pick) return null;
  const r = Math.round(km);
  return r < 1 ? `Near ${pick.name}` : `${r} km ${compass(pick.lat, pick.lon, lat, lon)} of ${pick.name}`;
}

const cache = new Map<string, string | null>();
/** Gives events without a distance and direction in their title one from a nearby town (cached per position). */
export function withNearestPlace<T extends Quake>(list: T[]): T[] {
  if (cache.size > 20_000) cache.clear();
  return list.map(q => {
    if (hasRelativePlace(q.title)) return q;
    const key = `${q.lat}:${q.lon}`;
    let text = cache.get(key);
    if (text === undefined) { text = nearestPlaceText(q.lat, q.lon, countryAt(q.lat, q.lon)?.code ?? null); cache.set(key, text); }
    return text ? { ...q, title: text } : q;
  });
}
