// Distance and direction from the nearest town for events whose source gives only a region name (EMSC sends
// "POTOSI, BOLIVIA", JMA some offshore areas), written as USGS does: "27 km SSE of Uyuni". The app converts the
// kilometres to miles where chosen (lib/units.ts). Server only: the towns are public/data/cities.json (Natural Earth
// populated places, the same list as the map's city names), which stays out of the app's own code.
// Used by GET /api/quakes and lib/quakes/find.ts (share card, Bluesky posts, alerts).
import data from '../../../public/data/cities.json';
import type { Quake } from './types';

/** A town further than this from the event isn't a useful reference: the source's region name stays. */
export const MAX_KM = 300;
const R_KM = 6371, RAD = Math.PI / 180;
const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

interface Town { lon: number; lat: number; name: string }
let towns: Town[] | null = null;
const allTowns = () => (towns ??= (data as { rows: (string | number)[][] }).rows.map(r => ({ lon: +r[0], lat: +r[1], name: String(r[4]) })));

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

/** "27 km SSE of Uyuni" for the nearest town within MAX_KM of the position, or null. */
export function nearestPlaceText(lat: number, lon: number, list: Town[] = allTowns()): string | null {
  let best: Town | null = null, bestKm = Infinity;
  const latWindow = MAX_KM / 111 + 0.1;
  for (const t of list) {
    if (Math.abs(t.lat - lat) > latWindow) continue;
    const km = haversineKm(lat, lon, t.lat, t.lon);
    if (km < bestKm) { bestKm = km; best = t; }
  }
  if (!best || bestKm > MAX_KM) return null;
  const km = Math.round(bestKm);
  return km < 1 ? `Near ${best.name}` : `${km} km ${compass(best.lat, best.lon, lat, lon)} of ${best.name}`;
}

const cache = new Map<string, string | null>();
/** Gives events without a distance and direction in their title one from the nearest town (cached per event). */
export function withNearestPlace<T extends Quake>(list: T[]): T[] {
  if (cache.size > 20_000) cache.clear();
  return list.map(q => {
    if (hasRelativePlace(q.title)) return q;
    const key = `${q.lat}:${q.lon}`;
    let text = cache.get(key);
    if (text === undefined) { text = nearestPlaceText(q.lat, q.lon); cache.set(key, text); }
    return text ? { ...q, title: text } : q;
  });
}
