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
