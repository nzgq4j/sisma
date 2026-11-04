import { describe, expect, it } from 'vitest';
import { niceScale, shareMapScale, shareMapSvg } from './share-map';
import type { Quake } from './quakes/types';

const q: Quake = { id: 'usgs:a', source: 'usgs', mag: 5.2, title: '10 km N of X', region: 'Japan', time: 0, lat: 36, lon: 140, depthKm: 10, tsunami: false };
const C = { sea: '#E3F4EE', land: '#FFFFFF', line: '#D3CCE8', plate: '#6C4BF4', ink: '#1B1530', surface: '#FFFFFF' };

describe('niceScale', () => {
  it('picks 1/2/5 steps near the target length', () => {
    expect(niceScale(1, 180)).toBe(200);
    expect(niceScale(2, 180)).toBe(100);
    expect(niceScale(3.5, 180)).toBe(50);
  });
});

describe('shareMapSvg', () => {
  it('draws nearby events inside the view and skips far ones', () => {
    const near = { ...q, id: 'usgs:b', lat: 36.5, lon: 140.5, mag: 4.1 };
    const far = { ...q, id: 'usgs:c', lat: -10, lon: 20 };
    const svg = shareMapSvg({ q, nearby: [q, near, far], w: 1000, h: 600, span: 7.5, units: 'km', colors: C });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.match(/<circle cx=/g)?.length).toBe(1);
    expect(svg).toContain(' km</text>');
  });
  it('labels the scale bar in miles when asked', () => {
    expect(shareMapSvg({ q, nearby: [], w: 1000, h: 600, span: 7.5, units: 'mi', colors: C })).toContain(' mi</text>');
  });
  it('can leave the scale text to the caller (the share card draws it with its own font)', () => {
    const svg = shareMapSvg({ q, nearby: [], w: 1000, h: 600, span: 7.5, units: 'km', colors: C, scaleText: false });
    expect(svg).not.toContain('<text');
    expect(shareMapScale({ q, w: 1000, h: 600, span: 7.5, units: 'km' }).label).toMatch(/^\d+ km$/);
  });
});
