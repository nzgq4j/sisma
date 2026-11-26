import { describe, expect, it } from 'vitest';
import { withPlaceInfo } from './place-info';
import type { Quake } from './types';

const q = (id: string, lat: number, lon: number): Quake => ({ id, source: 'usgs', mag: 5, title: id, region: id, time: 0, lat, lon, depthKm: 10, tsunami: false });

describe('withPlaceInfo', () => {
  it('adds the flag country and the world region of each event', () => {
    const [tokyo, italy, midPacific] = withPlaceInfo([q('a', 35.68, 139.76), q('b', 42.35, 13.4), q('c', 0, -140)]);
    expect(tokyo.country).toEqual({ code: 'jp', near: false });
    expect(tokyo.worldRegion).toBe('east_asia');
    expect(italy.country?.code).toBe('it');
    expect(italy.worldRegion).toBe('europe');
    expect(midPacific.country).toBeNull();
    expect(midPacific.worldRegion).toBe('pacific');
  });
  it('marks an event just off the coast as near the country', () => {
    const [off] = withPlaceInfo([q('d', 38.0, 143.0)]);
    expect(off.country).toEqual({ code: 'jp', near: true });
  });
});
