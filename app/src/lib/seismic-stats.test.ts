import { describe, expect, it } from 'vitest';
import { activity, depths, energy, energyJ, fromGeoJson, magnitudes, perYear, regions, timesFromCsv, type Ev } from './seismic-stats';

const now = Date.UTC(2026, 10, 19, 12, 30);
const ev = (hoursAgo: number, mag: number, depthKm = 10, lat = 35.7, lon = 139.7): Ev => ({ time: now - hoursAgo * 3_600_000, mag, depthKm, lat, lon });

describe('seismic stats', () => {
  it('counts events per hour and per UTC day', () => {
    const a = activity([ev(0, 5), ev(0.2, 4.6), ev(5, 4.8), ev(30, 6), ev(24 * 10, 5), ev(24 * 40, 5)], now);
    expect(a.h24.counts).toHaveLength(24);
    expect(a.h24.counts[23]).toBe(2);
    expect(a.h24.counts.reduce((s, v) => s + v)).toBe(3);
    expect(a.d7.counts.reduce((s, v) => s + v)).toBe(4);
    expect(a.d30.counts.reduce((s, v) => s + v)).toBe(5); // the 40-day-old event is out
  });

  it('bins magnitudes by half units with an open top bin', () => {
    expect(magnitudes([ev(1, 4.5), ev(1, 4.99), ev(1, 5), ev(1, 6.4), ev(1, 7), ev(1, 8.2), ev(1, 4.2)])).toEqual([2, 1, 0, 1, 0, 2]);
  });

  it('uses the USGS depth classes', () => {
    expect(depths([ev(1, 5, 0), ev(1, 5, 69.9), ev(1, 5, 70), ev(1, 5, 299), ev(1, 5, 300), ev(1, 5, 650)])).toEqual({ shallow: 2, intermediate: 2, deep: 2 });
  });

  it('groups by world region and counts the Ring of Fire', () => {
    const r = regions([ev(1, 5, 10, 35.7, 139.7), ev(1, 5, 10, 36, 140), ev(1, 5, 10, 38, 23)]);
    expect(r.list[0]).toEqual({ region: 'east_asia', count: 2, ring: 2 });
    expect(r.list.find(x => x.region === 'europe')).toEqual({ region: 'europe', count: 1, ring: 0 });
    expect(r.total).toBe(3);
    expect(r.ring).toBe(2);
  });

  it('estimates energy: about 32 times per magnitude step, cumulative, with the largest share', () => {
    expect(energyJ(7) / energyJ(6)).toBeCloseTo(31.62, 1);
    const e = energy([ev(1, 7), ev(30, 5), ev(24 * 3, 5)], now);
    expect(e.cumulative).toHaveLength(30);
    expect(e.cumulative.at(-1)).toBeCloseTo(energyJ(7) + 2 * energyJ(5));
    expect(e.largest?.mag).toBe(7);
    expect(e.largest!.share).toBeGreaterThan(0.99);
  });

  it('counts per year, averaging only complete years', () => {
    const t = (y: number) => Date.UTC(y, 5, 1);
    const p = perYear([t(1900), t(1900), t(1901), t(2026), t(1899)], 1900, now);
    expect(p.counts[0]).toBe(2);
    expect(p.counts.at(-1)).toBe(1);
    expect(p.counts).toHaveLength(2026 - 1900 + 1);
    expect(p.average).toBeCloseTo(3 / 126);
  });

  it('reads the USGS feed and CSV answers', () => {
    expect(fromGeoJson({ features: [
      { properties: { mag: 5.1, time: 1 }, geometry: { coordinates: [10, 20, 33] } },
      { properties: { mag: 3.0, time: 2 }, geometry: { coordinates: [10, 20, 5] } },
      { properties: { mag: null, time: 3 }, geometry: { coordinates: [10, 20, 5] } },
    ] })).toEqual([{ mag: 5.1, time: 1, lon: 10, lat: 20, depthKm: 33 }]);
    expect(timesFromCsv('time,latitude\n1906-04-18T13:12:21.000Z,37.7\nbad,1\n')).toEqual([Date.UTC(1906, 3, 18, 13, 12, 21)]);
  });
});
