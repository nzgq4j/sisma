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
