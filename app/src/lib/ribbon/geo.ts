// Pacific Fire Ribbon, linked map (step 6): the route and the ribbon's corridor drawn back onto the globe. Client-safe
// (no geodesic library): positions along the route are interpolated on a sphere between route.json's vertices, and
// offsets across the route use the spherical destination formula. Good to well under 1% for drawing; event positions
// on the ribbon still come from the server's WGS84 transform (lib/ribbon/transform.ts).
import route from './route.json';

const R = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180, deg = (r: number) => (r * 180) / Math.PI;

export interface Vertex { lat: number; lon: number; x: number }
const COL = route.columns as string[];
export const ROUTE: Vertex[] = (route.vertices as number[][]).map(v => ({ lat: v[COL.indexOf('lat')], lon: v[COL.indexOf('lon')], x: v[COL.indexOf('xKm')] }));
export const ROUTE_KM = route.lengthKm as number;

/** Initial bearing (degrees clockwise from north) from a to b on the sphere. */
export function bearing(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const φ1 = rad(a.lat), φ2 = rad(b.lat), Δλ = rad(b.lon - a.lon);
  return (deg(Math.atan2(Math.sin(Δλ) * Math.cos(φ2), Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ))) + 360) % 360;
}

/** The point `km` from p along `brg` (degrees), on the sphere; longitude in -180…180. */
export function destination(p: { lat: number; lon: number }, brg: number, km: number) {
  const δ = km / R, θ = rad(brg), φ1 = rad(p.lat), λ1 = rad(p.lon);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: deg(φ2), lon: ((deg(λ2) + 540) % 360) - 180 };
}

/** The route point at distance x (km; clamped to the route) and the direction of travel there. */
export function routeAt(x: number): { lat: number; lon: number; brg: number } {
  const c = Math.max(0, Math.min(ROUTE_KM, x));
  let i = ROUTE.findIndex((v, k) => k > 0 && v.x >= c);
  if (i < 1) i = c <= 0 ? 1 : ROUTE.length - 1;
  const a = ROUTE[i - 1], b = ROUTE[i];
  const brg0 = bearing(a, b), seg = Math.max(1e-9, b.x - a.x);
  // Along the great circle from a toward b, scaled so the route's stored distances are kept.
  const dist = ((c - a.x) / seg) * greatCircleKm(a, b);
  const p = destination(a, brg0, dist);
  return { ...p, brg: dist < 1e-6 ? brg0 : bearing(p, b) };
}

export function greatCircleKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const φ1 = rad(a.lat), φ2 = rad(b.lat), Δφ = φ2 - φ1, Δλ = rad(b.lon - a.lon);
  const h = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A point at route coordinates (x along, y to the left of travel), for drawing. */
export function fromRoute(x: number, y: number) {
  const p = routeAt(x);
  return y === 0 ? { lat: p.lat, lon: p.lon } : destination(p, p.brg + (y > 0 ? -90 : 90), Math.abs(y));
}

/**
 * The corridor between x0 and x1 as a closed ring of [lon, lat] (GeoJSON order): the left edge (y = left km) going
 * forward, the right edge (y = -right km) coming back.
 */
export function corridorRing(x0: number, x1: number, left: number, right: number, steps = 48): [number, number][] {
  const a = Math.max(0, Math.min(x0, x1)), b = Math.min(ROUTE_KM, Math.max(x0, x1));
  const xs = Array.from({ length: steps + 1 }, (_, i) => a + ((b - a) * i) / steps);
  const ll = (p: { lat: number; lon: number }): [number, number] => [p.lon, p.lat];
  const ring = [...xs.map(x => ll(fromRoute(x, left))), ...xs.reverse().map(x => ll(fromRoute(x, -right)))];
  ring.push(ring[0]);
  return ring;
}

/** The route between x0 and x1 as [lon, lat] points (its vertices plus the two ends). */
export function routeLine(x0 = 0, x1 = ROUTE_KM): [number, number][] {
  const a = Math.max(0, Math.min(x0, x1)), b = Math.min(ROUTE_KM, Math.max(x0, x1));
  const s = routeAt(a), e = routeAt(b);
  return [[s.lon, s.lat], ...ROUTE.filter(v => v.x > a && v.x < b).map(v => [v.lon, v.lat] as [number, number]), [e.lon, e.lat]];
}
