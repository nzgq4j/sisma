// World regions for the region filter (Map, Globe, dashboard, Feed). An event takes the region of the country it is
// in or nearest to within 800 km (the 1:110m outlines leave out many island arcs, e.g. the Kurils and the Banda Sea
// islands); events further out at sea fall in an ocean region by position.
import { countryAt } from './country';

export const WORLD_REGIONS = [
  'north_america', 'central_america', 'south_america', 'europe', 'africa', 'middle_east', 'central_asia',
  'south_asia', 'east_asia', 'southeast_asia', 'pacific', 'atlantic', 'indian_ocean', 'polar',
] as const;
export type WorldRegion = (typeof WORLD_REGIONS)[number];

const GROUPS: Record<Exclude<WorldRegion, 'atlantic' | 'indian_ocean'>, string> = {
  north_america: 'us ca mx gl',
  central_america: 'gt bz sv hn ni cr pa cu jm ht do pr bs tt',
  south_america: 'co ve gy sr ec pe bo br py uy ar cl fk',
  europe: 'is ie gb pt es fr be nl lu de ch at it si hr ba rs me xk al mk gr bg ro md ua by pl cz sk hu lt lv ee fi se no dk',
  africa: 'ma eh dz tn ly eg sd ss er dj et so ke ug rw bi tz mw mz zm zw mg za ls sz na bw ao cd cg cf cm gq ga td ne ng bj tg gh ci lr sl gn gw sn gm ml mr bf',
  middle_east: 'tr cy sy lb il ps jo iq ir kw sa ye om ae qa am az ge',
  central_asia: 'kz kg tj tm uz',
  south_asia: 'af pk in np bt bd lk',
  east_asia: 'cn mn kp kr jp tw',
  southeast_asia: 'mm th la kh vn my bn id ph tl',
  pacific: 'au nz pg sb vu nc fj',
  polar: 'aq tf',
};
const BY_CODE = new Map<string, WorldRegion>();
for (const [r, codes] of Object.entries(GROUPS)) for (const c of codes.split(' ')) BY_CODE.set(c, r as WorldRegion);

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
