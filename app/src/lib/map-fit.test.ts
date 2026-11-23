import { describe, expect, it } from 'vitest';
import { fitArea } from './map-fit';
import { REGION_SPAN } from './world-regions';

describe('fitArea', () => {
  it('is null for no events', () => expect(fitArea([])).toBeNull());
  it('one event: centred on it at the region-view span', () => {
    const f = fitArea([{ lat: 35, lon: 139 }])!;
    expect(f.lat).toBeCloseTo(35, 6);
    expect(f.lon).toBe(139);
    expect(f.span).toBe(REGION_SPAN);
  });
  it('Japan: centred on the islands, wide enough for all of them', () => {
    const f = fitArea([{ lat: 24.5, lon: 124 }, { lat: 45.5, lon: 146 }, { lat: 35, lon: 139 }])!;
    expect(Math.abs(f.lat - 35)).toBeLessThan(1.5);
    expect(f.lon).toBeCloseTo(135, 0);
    expect(f.span).toBeGreaterThan(21 / Math.cos((35 * Math.PI) / 180));
    expect(f.span).toBeLessThan(40);
  });
  it('across the antimeridian (Fiji): the short way round', () => {
    const f = fitArea([{ lat: -17, lon: 178 }, { lat: -18, lon: -179 }, { lat: -16, lon: 179.5 }])!;
    expect(Math.abs(f.lon)).toBeGreaterThan(178);
    expect(f.span).toBeLessThan(10);
  });
  it('never wider than most of the world', () => {
    expect(fitArea([{ lat: -60, lon: -170 }, { lat: 70, lon: 0 }, { lat: 0, lon: 170 }])!.span).toBeLessThanOrEqual(160);
  });
});
