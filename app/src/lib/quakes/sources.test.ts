import { describe, expect, it } from 'vitest';
import { parseJmaCod } from './sources';

describe('parseJmaCod', () => {
  it('reads decimal degrees and depth in km', () => {
    expect(parseJmaCod('+35.7+140.7-10000/')).toEqual({ lat: 35.7, lon: 140.7, depthKm: 10 });
  });
  it('converts degrees + minutes', () => {
    const p = parseJmaCod('+3543.3+14042.9-10000/')!;
    expect(p.lat).toBeCloseTo(35 + 43.3 / 60, 6);
    expect(p.lon).toBeCloseTo(140 + 42.9 / 60, 6);
  });
  it('rejects unparseable values', () => {
    expect(parseJmaCod('')).toBeNull();
  });
});

describe('jma', () => {
  // Real entries from JMA's list (October 2026): three large earthquakes abroad, which JMA lists with rough coordinates
  // and no depth, and one in Japan.
  const entry = (eid: string, cod: string, anm: string, mag = '7.0') => ({ eid, cod, en_anm: anm, mag, at: '2026-10-22T23:39:00+09:00' });
  it('keeps only earthquakes in Japan’s area; those abroad are left to USGS and EMSC', async () => {
    const { vi } = await import('vitest');
    const { jma, inJapanArea } = await import('./sources');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([
      entry('20261022233944', '+32.3+93.7/', 'Western China'),
      entry('20261024113820', '-13.8+165.7/', 'South Pacific Ocean', '7.2'),
      entry('20261016123810', '+50.0+158.1-160000/', 'Adjacent Kamchatka Peninsula', '6.9'),
      entry('20261025111028', '+28.0+139.9-470000/', 'Off the west Coast of Ogasawara Islands'),
    ]))));
    try {
      const out = await jma({ days: 30, minMag: 0 });
      expect(out.map(x => x.id)).toEqual(['jma:20261025111028']);
      expect(out[0]).toMatchObject({ region: 'Japan', depthKm: 470 });
    } finally { vi.unstubAllGlobals(); }
    expect(inJapanArea(43.4, 145.8)).toBe(true); // eastern Hokkaido
    expect(inJapanArea(24.4, 123.0)).toBe(true); // Yonaguni
    expect(inJapanArea(32.3, 93.7)).toBe(false); // Western China
  });
});
