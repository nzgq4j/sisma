import { describe, expect, it } from 'vitest';
import { shareMapSvg } from './share-map';
import { feltLayers, NO_FELT, type ShareFelt } from './share-felt';
import { feltAltEn, isFeltLayer } from './felt-layers';
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

describe('share card felt layers', () => {
  it('lists the layers that have data, in legend order', () => {
    expect(feltLayers(felt)).toEqual(['reports', 'auto', 'dyfi', 'emsc']);
    expect(feltLayers({ ...NO_FELT, emsc: felt.emsc })).toEqual(['emsc']);
    expect(feltLayers(NO_FELT)).toEqual([]);
  });

  it('draws each layer in its style and leaves out cells far off the map', () => {
    const s = svg(felt);
    expect(s).toContain('<radialGradient id="fr5"'); // sisma report: soft area, MMI V
    expect(s).toMatch(/<radialGradient id="fh\d"/); // automatic felt map glow
    expect(s.match(/<g opacity="0.6"><path d="M/)).not.toBeNull(); // DYFI box outline
    expect(s).toContain('<rect x='); // DYFI box without outline drawn as a square
    expect((s.match(/fill-opacity="0.85" stroke="#fff"/g) ?? []).length).toBe(1); // one EMSC dot on the map, Italy left out
    // Felt layers come before (under) the event marker.
    expect(s.indexOf('fr5')).toBeLessThan(s.indexOf('stroke-opacity="0.35"'));
  });

  it('draws nothing extra without felt data', () => {
    expect(svg(null)).not.toContain('radialGradient');
    expect(svg(NO_FELT)).toBe(svg(null));
  });

  it('describes the drawn layers in the alt text', () => {
    expect(feltAltEn([])).toBe('');
    expect(feltAltEn(['dyfi', 'emsc'])).toBe('Where people felt it is shown in intensity colours: squares for USGS “Did You Feel It?”, dots for EMSC reports.');
    expect(['reports', 'auto', 'dyfi', 'emsc', 'x', ''].filter(isFeltLayer)).toEqual(['reports', 'auto', 'dyfi', 'emsc']);
  });
});
