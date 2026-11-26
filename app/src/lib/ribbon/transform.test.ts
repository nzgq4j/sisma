import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import geodesic from 'geographiclib-geodesic';
import { describe, expect, it } from 'vitest';
import route from './route.json';
import gvp from './gvp-arcs.json';
import { END_ALLOWANCE_KM, LENGTH_KM, fromRibbon, inCorridor, layout, toRibbon } from './transform';

const V = route.vertices as [number, number, number, number][];
const geod = geodesic.Geodesic.WGS84;

describe('reference route', () => {
  it('is rebuilt identically from the Smithsonian extract', () => {
    const out = join(mkdtempSync(join(tmpdir(), 'ribbon-')), 'route.json');
    execFileSync('node', [join(__dirname, '../../../scripts/build-ribbon-route.mjs'), out]);
    expect(readFileSync(out, 'utf8')).toBe(readFileSync(join(__dirname, 'route.json'), 'utf8'));
  });
  it('runs from the southern Andes to New Zealand through every listed region, in order', () => {
    const groups = layout().regions.map(r => r.group);
    expect(groups).toEqual(['southern_andes', 'central_andes', 'northern_andes', 'central_america', 'mexico', 'western_us', 'western_canada',
      'alaska', 'aleutians', 'kamchatka', 'kurils', 'japan', 'ryukyu', 'philippines', 'sangihe_halmahera', 'png', 'solomons', 'vanuatu',
      'fiji', 'tonga', 'kermadec', 'new_zealand']);
    expect(V[0][0]).toBeLessThan(-54); // Austral Andes
    expect(V.at(-1)![0]).toBeLessThan(-39); // Taupo
  });
  it('measures distance along the route on the WGS84 ellipsoid', () => {
    let x = 0;
    for (let i = 1; i < V.length; i++) x += geod.Inverse(V[i - 1][0], V[i - 1][1], V[i][0], V[i][1]).s12! / 1000;
    expect(Math.abs(x - LENGTH_KM)).toBeLessThan(0.1);
    expect(LENGTH_KM).toBeGreaterThan(39000);
  });
  it('only uses subregions from the extract, and follows their volcanoes', () => {
    const ids = new Set(gvp.arcs.filter(a => a.route).map(a => a.id));
    expect(V.every(v => ids.has(v[3]))).toBe(true);
    const d = gvp.volcanoes.filter(v => ids.has(v[0])).map(v => Math.abs(toRibbon(v[2], v[3])!.y));
    // Most volcanoes are on the route; the rest are behind the arc or outlying islands the median steps leave out
    // (e.g. Colo, 399 km, in the Gulf of Tomini).
    expect(d.filter(x => x <= 100).length / d.length).toBeGreaterThan(0.95);
    expect(Math.max(...d)).toBeLessThan(400);
  });
});

describe('toRibbon / fromRibbon', () => {
  it('puts a route point on the route', () => {
    for (const v of [V[0], V[40], V[100], V.at(-1)!]) {
      const r = toRibbon(v[0], v[1])!;
      expect(Math.abs(r.x - v[2])).toBeLessThan(0.5);
      expect(Math.abs(r.y)).toBeLessThan(0.5);
    }
  });
  it('gives positive offsets on the Pacific side and negative ones behind the arc', () => {
    expect(toRibbon(-33, -72.5)!.y).toBeGreaterThan(0); // off central Chile
    expect(toRibbon(38.3, 142.4)!.y).toBeGreaterThan(0); // off Tohoku
    expect(toRibbon(-20, -63.5)!.y).toBeLessThan(-400); // deep earthquakes under Bolivia
    expect(toRibbon(-20, -63.5)!.from).toBe('central_andes');
  });
  it('is continuous across the 180° meridian', () => {
    const a = toRibbon(51.8, 179.9)!, b = toRibbon(51.8, -179.9)!; // Aleutians
    expect(a.from).toBe('aleutians');
    expect(Math.abs(a.x - b.x)).toBeLessThan(20);
    const c = toRibbon(-17.5, 179.9)!, d = toRibbon(-17.5, -179.9)!; // Fiji
    expect(Math.abs(c.x - d.x)).toBeLessThan(25);
    expect(Math.abs(c.y - d.y)).toBeLessThan(25);
  });
  it('places points just beyond the ends and nothing further', () => {
    const drake = toRibbon(-58, -66)!;
    expect(drake.x).toBeLessThan(0);
    expect(drake.x).toBeGreaterThan(-END_ALLOWANCE_KM);
    expect(toRibbon(-66, -60)).toBeNull(); // Antarctic Peninsula
    expect(toRibbon(-42.4, 173.7)!.x).toBeGreaterThan(LENGTH_KM); // Kaikoura
    expect(toRibbon(-43.5, 172.6)).toBeNull(); // Christchurch
  });
  it('keeps the corridor to the circum-Pacific belt', () => {
    expect(inCorridor(toRibbon(19.4, -155.3)!)).toBe(false); // Hawaii
    expect(inCorridor(toRibbon(0, -30)!)).toBe(false); // Mid-Atlantic
    expect(inCorridor(toRibbon(38.3, 142.4)!)).toBe(true); // Tohoku
  });
  it('is reversible away from the bends', () => {
    for (const [x, y] of [[1500, 120], [8800, -300], [19200, 60], [23000, 250], [35900, -40], [39000, 10]]) {
      const p = fromRibbon(x, y);
      const r = toRibbon(p.lat, p.lon)!;
      expect(Math.abs(r.x - x)).toBeLessThan(1);
      expect(Math.abs(r.y - y)).toBeLessThan(1);
    }
  });
});
