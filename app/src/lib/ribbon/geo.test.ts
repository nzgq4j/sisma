import { describe, expect, it } from 'vitest';
import { ROUTE, ROUTE_KM, corridorRing, fromRoute, greatCircleKm, routeAt, routeLine } from './geo';
import { fromRibbon, LENGTH_KM } from './transform';

describe('ribbon geometry for the map', () => {
  it('uses the same route as the server', () => {
    expect(ROUTE_KM).toBe(LENGTH_KM);
    expect(ROUTE.length).toBe(167);
  });
  it('passes through every route vertex', () => {
    for (const v of ROUTE) expect(greatCircleKm(routeAt(v.x), v)).toBeLessThan(0.5);
  });
  it('agrees with the WGS84 transform to within 1% of the distance across (and 6 km along the route)', () => {
    let worst = 0;
    for (let x = 100; x < ROUTE_KM; x += 997) {
      expect(greatCircleKm(fromRoute(x, 0), fromRibbon(x, 0))).toBeLessThan(6);
      for (const y of [400, -700]) {
        const d = greatCircleKm(fromRoute(x, y), fromRibbon(x, y));
        worst = Math.max(worst, d / Math.abs(y));
      }
    }
    expect(worst).toBeLessThan(0.01);
  });
  it('builds a closed corridor ring and a route line between two distances', () => {
    const ring = corridorRing(20000, 21600, 400, 700, 16);
    expect(ring.length).toBe(2 * 17 + 1);
    expect(ring[0]).toEqual(ring.at(-1));
    const line = routeLine(20000, 21600);
    const s = routeAt(20000);
    expect(line[0]).toEqual([s.lon, s.lat]);
    expect(line.length).toBeGreaterThan(2);
  });
});
