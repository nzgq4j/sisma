import { describe, expect, it } from 'vitest';
import { parseCsv, ribbonQuakes, uncertainties, type FeedJson } from './feed';
import { COLUMNS, GROUPS, depthBand, fromRow, markerOpacity, markerRadius, toRow } from './shared';

const f = (id: string, lat: number, lon: number, depth: number, p: Record<string, unknown> = {}) =>
  ({ id, geometry: { coordinates: [lon, lat, depth] as [number, number, number] }, properties: { type: 'earthquake', time: 1000, updated: 1000, mag: 4.2, ...p } });

describe('USGS feeds', () => {
  it('reads CSV with quoted places', () => {
    expect(parseCsv('a,b\r\n1,"2 km N of X, Chile"\n3,"say ""hi"""\n')).toEqual([['a', 'b'], ['1', '2 km N of X, Chile'], ['3', 'say "hi"']]);
    const u = uncertainties('time,id,place,horizontalError,depthError,magError\n2026,us1,"1 km E of A, B",3.4,1.9,\n');
    expect(u.get('us1')).toEqual({ hErr: 3.4, dErr: 1.9, magErr: null });
  });
  it('keeps earthquakes on the ribbon, once each, with their source values unchanged', () => {
    const feed: FeedJson = {
      metadata: { generated: 5000 },
      features: [
        f('us1', -20.54, -177.76, 494, { updated: 1000, mag: 4.1 }), // Fiji–Tonga, deep
        f('us1', -20.54, -177.76, 494, { updated: 2000, mag: 4.3 }), // revised: keep this one
        f('us2', 38.3, 142.4, 30), // off Tohoku
        f('hv3', 19.4, -155.3, 2), // Hawaii: not on the ribbon
        f('us4', -33.0, -71.6, 50, { type: 'quarry blast' }), // not an earthquake
        f('us5', -66, -60, 10), // Antarctic Peninsula: beyond the route's end
      ],
    };
    const { quakes, counts, generated } = ribbonQuakes(feed, 'id,horizontalError,depthError,magError\nus2,6.1,1.8,0.05\n');
    expect(generated).toBe(5000);
    expect(counts).toEqual({ feed: 6, earthquakes: 4, ribbon: 2 });
    const tonga = quakes.find(q => q.id === 'us1')!;
    expect([tonga.lat, tonga.lon, tonga.depth, tonga.mag]).toEqual([-20.54, -177.76, 494, 4.3]);
    expect(GROUPS[tonga.from]).toMatch(/fiji|tonga/);
    const japan = quakes.find(q => q.id === 'us2')!;
    expect(GROUPS[japan.from]).toBe('japan');
    expect([japan.hErr, japan.dErr, japan.magErr]).toEqual([6.1, 1.8, 0.05]);
    expect(japan.url).toBe('https://earthquake.usgs.gov/earthquakes/eventpage/us2');
    expect(fromRow(toRow(japan))).toEqual(japan);
    expect(toRow(japan)).toHaveLength(COLUMNS.length);
  });
});

describe('markers', () => {
  it('uses the brief’s depth classes', () => {
    expect([0, 9.9, 10, 34, 35, 69, 70, 149, 150, 299, 300, 499, 500, 700].map(depthBand)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
  });
  it('sizes by magnitude within bounds and fades with age', () => {
    expect(markerRadius(1)).toBe(1.5);
    expect(markerRadius(5)).toBeGreaterThan(markerRadius(4));
    expect(markerRadius(9.5)).toBe(11);
    expect(markerOpacity(3_600_000, 'week')).toBe(1);
    expect(markerOpacity(7 * 86_400_000, 'week')).toBeCloseTo(0.35);
  });
});
