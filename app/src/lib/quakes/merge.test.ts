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
