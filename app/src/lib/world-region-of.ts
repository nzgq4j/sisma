// World region of a position (lib/world-regions.ts): the region of the country it is in or nearest to within 800 km,
// else an ocean region by position. Kept apart from world-regions.ts because it needs the country outlines, which the
// phone feed doesn't load: the server works the region out for each event (GET /api/quakes).
import { countryAt } from './country';
import { BY_CODE, type WorldRegion } from './world-regions';

const REGION_NEAR_KM = 800;

/** Open-ocean region by position (events more than 300 km from any country). */
function oceanRegion(lat: number, lon: number): WorldRegion {
  if (lat < -60 || lat > 66) return 'polar';
  if (lon >= 20 && lon < 120 && lat < 25) return 'indian_ocean';
  if (lon >= -70 && lon < 20) return 'atlantic';
  if (lon >= -100 && lon < -70 && lat > 10) return 'atlantic'; // Caribbean side of the Americas
  return 'pacific';
}

export function worldRegion(lat: number, lon: number): WorldRegion {
  // Alaska's Aleutian arc (west of the outlines' mainland) counts as North America; Hawaii as the Pacific.
  if (lat > 50 && lat < 60 && (lon < -160 || lon > 170)) return 'north_america';
  if (lat > 15 && lat < 25 && lon > -162 && lon < -152) return 'pacific';
  const c = countryAt(lat, lon, REGION_NEAR_KM);
  if (c) {
    if (c.code === 'ru') return lon < 60 ? 'europe' : 'east_asia'; // Russia: European part / Siberia and the Far East
    const r = BY_CODE.get(c.code);
    if (r) return r;
  }
  return oceanRegion(lat, lon);
}
