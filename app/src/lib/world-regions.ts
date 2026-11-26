// World regions for the region filter (Map, Globe, dashboard, Feed). An event takes the region of the country it is
// in or nearest to within 800 km (the 1:110m outlines leave out many island arcs, e.g. the Kurils and the Banda Sea
// islands); events further out at sea fall in an ocean region by position. The lookup itself is in
// lib/world-region-of.ts (it needs the country outlines); /api/quakes sends each event's region with it.

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
/** World region of each country (ISO alpha-2, lowercase). */
export const BY_CODE = new Map<string, WorldRegion>();
for (const [r, codes] of Object.entries(GROUPS)) for (const c of codes.split(' ')) BY_CODE.set(c, r as WorldRegion);

/** Degrees of longitude across the shorter side of the map when it zooms to one event (region view, dashboard; ~800 km at the equator). */
export const REGION_SPAN = 7.5;

/** Where the maps go when a region filter is chosen: centre and degrees of longitude across the shorter side of the
 *  view (MapFocus.span). Polar has no useful Mercator view, so the map stays as it is for it. */
export const REGION_VIEW: Record<WorldRegion, { lat: number; lon: number; span: number } | null> = {
  north_america: { lat: 48, lon: -112, span: 75 },
  central_america: { lat: 15, lon: -80, span: 32 },
  south_america: { lat: -22, lon: -62, span: 55 },
  europe: { lat: 50, lon: 15, span: 45 },
  africa: { lat: 2, lon: 18, span: 70 },
  middle_east: { lat: 30, lon: 45, span: 35 },
  central_asia: { lat: 43, lon: 68, span: 35 },
  south_asia: { lat: 25, lon: 78, span: 35 },
  east_asia: { lat: 38, lon: 125, span: 50 },
  southeast_asia: { lat: 5, lon: 115, span: 45 },
  pacific: { lat: -10, lon: 175, span: 100 },
  atlantic: { lat: 15, lon: -35, span: 80 },
  indian_ocean: { lat: -15, lon: 75, span: 75 },
  polar: null,
};
