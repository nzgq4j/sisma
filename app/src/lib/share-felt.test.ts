import { describe, expect, it } from 'vitest';
import { shareMapSvg } from './share-map';
import { feltSources, NO_FELT, shareGrid, type ShareFelt } from './share-felt';
import { feltAltEn, feltMarks, isFeltMark } from './felt-layers';
import { FELT_NEUTRAL, MMI_COLORS } from './theme';
import type { Quake } from './quakes/types';

const q: Quake = { id: 'usgs:us1', source: 'usgs', mag: 6.1, title: 'Test', region: 'Peru', time: Date.now(), lat: -14.7, lon: -75.9, depthKm: 30, tsunami: false };
const colors = { sea: '#cde', land: '#eee', line: '#999', plate: '#c00', ink: '#111', surface: '#fff' };
const felt: ShareFelt = {
  reports: [{ lat: -14.5, lon: -75.8, n: 3, mmi: 5 }],
  heat: [{ lat: -14.6, lon: -76.0, n: 9, w: 0.8 }],
  dyfi: [{ lat: -14.7, lon: -75.9, cdi: 4, n: 2, ring: [[-75.95, -14.75], [-75.85, -14.75], [-75.85, -14.65], [-75.95, -14.65]] }, { lat: -14.2, lon: -75.5, cdi: 3, n: 1 }],
  emsc: [{ lat: -14.9, lon: -75.6, n: 4, mmi: 6.2 }, { lat: 40, lon: 10, n: 1, mmi: 3 }],
};
const svg = (f: ShareFelt | null) => shareMapSvg({ q, nearby: [], w: 968, h: 600, span: 7.5, units: 'km', colors, felt: f });

describe('share card felt cells', () => {
  it('merges the sources into one grid and names what it shows and where it comes from', () => {
    const g = shareGrid(felt);
    expect(g.find(c => c.lat === -14.7 && c.lon === -75.9)).toEqual({ lat: -14.7, lon: -75.9, n: 2, mmi: 4 });
    expect(g.find(c => c.lat === -14.6 && c.lon === -76)).toEqual({ lat: -14.6, lon: -76, n: 0, mmi: null }); // felt map only
    expect(feltMarks(g)).toEqual(['intensity', 'unknown']);
    expect(feltMarks(shareGrid({ ...NO_FELT, heat: felt.heat }))).toEqual(['unknown']);
    expect(feltMarks(shareGrid(NO_FELT))).toEqual([]);
    expect(feltSources(felt)).toEqual(['sisma', 'USGS', 'EMSC (CC BY 4.0)']);
    expect(feltSources({ ...NO_FELT, dyfi: felt.dyfi })).toEqual(['USGS']);
  });

  it('draws every cell in one style, intensity-coloured or neutral, under the event and without cells far off the map', () => {
    const s = svg(felt);
    const rects = s.match(/<g opacity="0.72">(.*?)<\/g>/)?.[1].match(/<rect /g) ?? [];
    expect(rects.length).toBe(shareGrid(felt).length - 1); // the EMSC cell in Italy is off the map
    expect(s).toContain(`fill="${MMI_COLORS[4]}"`);
    expect(s).toContain(`fill="${FELT_NEUTRAL}"`);
    expect(s).not.toContain('radialGradient');
    expect(s.indexOf('opacity="0.72"')).toBeLessThan(s.indexOf('stroke-opacity="0.35"'));
  });

  it('draws nothing extra without felt data', () => {
    expect(svg(NO_FELT)).toBe(svg(null));
  });

  it('describes the cells in the alt text', () => {
    expect(feltAltEn([])).toBe('');
    expect(feltAltEn(['intensity'])).toBe('Where people felt it is shown as small squares in intensity colours (MMI).');
    expect(feltAltEn(['intensity', 'unknown'])).toBe('Where people felt it is shown as small squares in intensity colours (MMI). Grey squares: felt, intensity unknown.');
    expect(feltAltEn(['unknown'])).toBe('Where people felt it is shown as grey squares (intensity unknown).');
    expect(['intensity', 'unknown', 'dyfi', ''].filter(isFeltMark)).toEqual(['intensity', 'unknown']);
  });
});
