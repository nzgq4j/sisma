import { describe, expect, it } from 'vitest';
import { blur, buildFeltMap, feltRadiusKm, MIN_PEOPLE } from './feltmap';
import { distanceKm } from './geo';

const seq = (vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]; };
const around = (lat: number, lon: number, n: number) => Array.from({ length: n }, (_, i) => ({ lat: lat + (i % 3) * 0.01, lon: lon + (i % 2) * 0.01 }));

describe('blur', () => {
  it('moves the position by at most 500 m and rounds to 4 decimals', () => {
    for (let i = 0; i < 200; i++) {
      const p = blur(35.68, 139.76);
      expect(distanceKm(35.68, 139.76, p.lat, p.lon)).toBeLessThanOrEqual(0.52);
      expect(Math.round(p.lat * 1e4) / 1e4).toBe(p.lat);
    }
  });
  it('can move the full distance and wraps longitude at the date line', () => {
    const p = blur(0, 179.999, seq([1, 0.25]));                    // r = 500 m, due east
    expect(distanceKm(0, 179.999, p.lat, p.lon)).toBeGreaterThan(0.48);
    expect(p.lon).toBeLessThan(-179);
  });
});

describe('feltRadiusKm', () => {
  it('grows with magnitude within limits', () => {
    expect(feltRadiusKm(2)).toBe(25);
    expect(feltRadiusKm(5)).toBeGreaterThan(100);
    expect(feltRadiusKm(9.5)).toBe(1500);
  });
});

describe('buildFeltMap', () => {
  const epi = { lat: 38.0, lon: 23.7, mag: 5 };                   // Athens area
  it('keeps cells with a surge of at least 3 people near the epicentre', () => {
    const map = buildFeltMap(epi, [...around(38.0, 23.7, 12), ...around(38.3, 23.9, 4)], []);
    expect(map.cells.length).toBe(2);
    expect(map.cells[0]).toMatchObject({ lat: 38, lon: 23.7, n: 12, w: 1 });
    expect(map.total).toBe(16);
  });
  it('drops cells below the anonymity minimum', () => {
    expect(buildFeltMap(epi, around(38.0, 23.7, MIN_PEOPLE - 1), []).cells).toEqual([]);
  });
  it('ignores usual activity: a busy cell without a surge is not shown', () => {
    // 4 in the window vs 80 in the hour before (= 4 per 180 s): no surge.
    expect(buildFeltMap(epi, around(38.0, 23.7, 4), around(38.0, 23.7, 80)).cells).toEqual([]);
  });
  it('ignores activity outside the felt radius', () => {
    expect(buildFeltMap(epi, around(48.85, 2.35, 20), []).cells).toEqual([]);       // Paris
  });
});
