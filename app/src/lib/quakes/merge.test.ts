import { describe, expect, it } from 'vitest';
import { mergeQuakes } from './merge';
import type { Quake } from './types';

const q = (o: Partial<Quake>): Quake => ({ id: 'x', source: 'usgs', mag: 5, title: '', region: 'Japan', time: 0, lat: 35, lon: 140, depthKm: 10, tsunami: false, ...o });

describe('mergeQuakes', () => {
  it('prefers JMA inside Japan and records the other source', () => {
    const out = mergeQuakes([[q({ id: 'usgs:1' })], [q({ id: 'jma:1', source: 'jma', time: 20_000, lat: 35.2 })]]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('jma');
    expect(out[0].alsoIn).toContain('usgs');
  });
  it('lists each other agency once and never the winning one (USGS reporting one event under two ids)', () => {
    const out = mergeQuakes([[q({ id: 'usgs:us1', region: 'Arabian Sea', lat: 9.75, lon: 57.84 }), q({ id: 'usgs:us2', time: 30_000, region: 'Arabian Sea', lat: 9.76, lon: 57.85 })],
      [q({ id: 'emsc:1', source: 'emsc', time: 10_000, region: 'Arabian Sea', lat: 9.7, lon: 57.8 })]]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('usgs');
    expect(out[0].alsoIn).toEqual(['emsc']);
    const jp = mergeQuakes([[q({ id: 'usgs:1' }), q({ id: 'emsc:1', source: 'emsc', time: 5_000 })], [q({ id: 'jma:1', source: 'jma', time: 20_000, lat: 35.2 })]]);
    expect(jp[0].source).toBe('jma');
    expect([...(jp[0].alsoIn ?? [])].sort()).toEqual(['emsc', 'usgs']);
  });
  it('keeps distinct events apart', () => {
    expect(mergeQuakes([[q({ id: 'a' }), q({ id: 'b', time: 600_000 })]])).toHaveLength(2);
  });
});

describe('merged ids', () => {
  const base = { mag: 4.6, magType: 'mb', title: 'x', region: 'Indonesia', lat: 2.55, lon: 128.67, depthKm: 200, tsunami: false, url: '' };
  it('keeps the id of the report that lost, so an earlier id still finds the event', async () => {
    const { hasId } = await import('./find');
    const emsc = { ...base, id: 'emsc:20261108_0001', source: 'emsc' as const, time: 1_000_000 };
    const usgs = { ...base, id: 'usgs:us7000twyd', source: 'usgs' as const, time: 1_030_000 };
    const [m] = mergeQuakes([[emsc], [usgs]]);
    expect(m.id).toBe('usgs:us7000twyd');
    expect(m.otherIds).toEqual(['emsc:20261108_0001']);
    expect(hasId(m, 'emsc:20261108_0001')).toBe(true);
    expect(hasId(m, 'usgs:us7000twyd')).toBe(true);
    expect(hasId(m, 'emsc:other')).toBe(false);
  });
});

describe('JMA reports of earthquakes abroad', () => {
  it('lose to USGS even when labelled Japan (preference follows the location)', () => {
    const usgs = q({ id: 'usgs:us6000u43g', region: 'China', lat: 32.35, lon: 93.72, depthKm: 10, time: 1_000_000, mag: 7.0 });
    const jma = q({ id: 'jma:20261022233944', source: 'jma', region: 'Japan', lat: 32.3, lon: 93.7, depthKm: 0, time: 1_020_000, mag: 7.0 });
    const [m] = mergeQuakes([[usgs], [jma]]);
    expect(m).toMatchObject({ id: 'usgs:us6000u43g', region: 'China', depthKm: 10 });
  });
});
