import { describe, expect, it } from 'vitest';
import data from '../../public/data/cities.json';
import { CITIES_FROM, cityName, parseCities, placeLabels, type City } from './cities';

const c = (name: string, minZoom: number, x: number, y: number, ja = ''): City & { x: number; y: number } =>
  ({ lon: 0, lat: 0, minZoom, pop: 1, names: [name, '', '', '', '', '', ja, '', '', ''], x, y });
const at = (p: City) => ({ x: (p as City & { x: number }).x, y: (p as City & { y: number }).y });
const measure = (s: string) => s.length * 6;
const view = { w: 360, h: 640 };

describe('city labels', () => {
  it('shows nothing below a regional zoom', () => {
    expect(placeLabels([c('Tokyo', 1, 100, 100)], CITIES_FROM - 0.1, 'en', at, measure, view)).toEqual([]);
  });

  it('labels the most important first and skips overlaps and places not yet labelled at this zoom', () => {
    const list = [c('San Jose', 5, 100, 100), c('Santa Clara', 5.5, 110, 104), c('Salinas', 6, 100, 200), c('Gilroy', 6.8, 100, 300)];
    expect(placeLabels(list, 6, 'en', at, measure, view).map(l => l.text)).toEqual(['San Jose', 'Salinas']);
    expect(placeLabels(list, 6.4, 'en', at, measure, view).map(l => l.text)).toEqual(['San Jose', 'Salinas', 'Gilroy']);
  });

  it('keeps clear of event markers', () => {
    const list = [c('Santa Cruz', 5, 100, 100), c('Salinas', 5, 100, 200)];
    expect(placeLabels(list, 6, 'en', at, measure, view, 40, [[90, 70, 160, 110]]).map(l => l.text)).toEqual(['Salinas']);
    // Taken on the right only: the name goes on the left.
    const [left] = placeLabels([c('Santa Cruz', 5, 100, 100)], 6, 'en', at, measure, view, 40, [[104, 90, 200, 110]]);
    expect(left).toMatchObject({ text: 'Santa Cruz', w: -60 });
  });

  it('puts the name on the left near the right edge, skips places off screen, and uses the app language', () => {
    const [edge] = placeLabels([c('Monterey', 5, 350, 100)], 6, 'en', at, measure, view);
    expect(edge.w).toBeLessThan(0);
    expect(placeLabels([c('X', 5, -5, 100)], 6, 'en', at, measure, view)).toEqual([]);
    expect(cityName(c('Tokyo', 1, 0, 0, '東京'), 'ja')).toBe('東京');
    expect(cityName(c('Tokyo', 1, 0, 0), 'ja')).toBe('Tokyo');
  });

  it('reads the bundled data, most important first, with names in 10 languages', () => {
    const all = parseCities(data as never);
    expect(all.length).toBeGreaterThan(5000);
    expect(all.every((x, i) => i === 0 || all[i - 1].minZoom <= x.minZoom)).toBe(true);
    expect(all.every(x => x.names.length === 10 && x.names[0])).toBe(true);
    const sj = all.find(x => x.names[0] === 'San Jose' && x.lat > 37);
    expect(sj).toMatchObject({ lon: -121.89, lat: 37.33 });
    expect(cityName(sj!, 'ja')).toBe('サンノゼ');
  });
});
