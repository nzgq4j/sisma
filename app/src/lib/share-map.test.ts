import { describe, expect, it } from 'vitest';
import { niceScale, shareCityLabels, shareMapScale, shareMapSvg, CARD_CITY } from './share-map';
import { parseCities, type Box } from './cities';
import data from '../../public/data/cities.json';
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

describe('shareCityLabels', () => {
  const cities = parseCities(data as never);
  const W = 968, H = 600, overlap = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const box = (l: { x: number; y: number; w: number }): Box => {
    const w = Math.abs(l.w);
    return l.w >= 0 ? [l.x - 8, l.y - 16, l.x + 14 + w, l.y + 16] : [l.x - 14 - w, l.y - 16, l.x + 8, l.y + 16];
  };

  it('names the region around the event, in the card language', () => {
    const tokyo = { ...q, lat: 35.68, lon: 139.77 };
    const en = shareCityLabels({ q: tokyo, nearby: [], w: W, h: H, span: 7.5, cities, locale: 'en' });
    expect(en.map(l => l.text)).toContain('Nagoya');
    expect(en.length).toBeLessThanOrEqual(CARD_CITY.max);
    const ja = shareCityLabels({ q: tokyo, nearby: [], w: W, h: H, span: 7.5, cities, locale: 'ja' });
    expect(ja.map(l => l.text)).toContain('名古屋市');
  });

  it('keeps names clear of each other, the events and the card\'s own boxes', () => {
    const nearby = Array.from({ length: 20 }, (_, i) => ({ ...q, id: `n${i}`, lat: 36 + Math.sin(i) * 1.5, lon: 140 + Math.cos(i * 1.7) * 2, mag: 3 + (i % 4) }));
    const legend: Box = [W - 400, H - 90, W, H];
    const labels = shareCityLabels({ q, nearby: [q, ...nearby], w: W, h: H, span: 7.5, cities, locale: 'en', blocked: [legend] });
    expect(labels.length).toBeGreaterThan(3);
    const boxes = labels.map(box);
    boxes.forEach((b, i) => {
      expect(overlap(b, legend)).toBe(false);
      boxes.slice(i + 1).forEach(o => expect(overlap(b, o)).toBe(false));
    });
    // The event in focus (centre of the card) with its ring and halo.
    expect(boxes.some(b => overlap(b, [W / 2 - 40, H / 2 - 40, W / 2 + 40, H / 2 + 40]))).toBe(false);
  });

  it('draws no names over open ocean', () => {
    const ocean = { ...q, lat: -30, lon: -120 };
    expect(shareCityLabels({ q: ocean, nearby: [], w: W, h: H, span: 7.5, cities, locale: 'en' })).toEqual([]);
  });
});
