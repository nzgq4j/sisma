import { describe, expect, it } from 'vitest';
import { fold, searchRibbon } from './RibbonSearch';
import type { RibbonQuake } from '@/lib/ribbon/shared';
import type { RibbonVolcano } from '@/lib/ribbon/volcanoes';

const v = (n: number, name: string) => ({ n, name }) as RibbonVolcano;
const q = (id: string, mag: number | null, place: string | null, time = 0) => ({ id, mag, place, time }) as RibbonQuake;
const VOLCS = [v(1, 'Popocatépetl'), v(2, 'Fuji'), v(3, 'Mayon'), v(4, 'Fujiyama Test'), v(5, 'Ruapehu')];
const QUAKES = [q('us7000aaaa', 4.6, '50 km SE of Hachinohe, Japan', 3), q('us7000bbbb', 6.2, 'Tonga region', 2), q('ak0001', 2.8, 'Kodiak, Alaska', 1), q('xx', null, null)];

describe('ribbon search', () => {
  it('ignores accents and case', () => {
    expect(fold('Popocatépetl')).toBe('popocatepetl');
    expect(searchRibbon('popocatepetl', [], VOLCS).volcanoes.map(x => x.n)).toEqual([1]);
  });
  it('lists names starting with the text first', () => {
    expect(searchRibbon('fuji', [], VOLCS).volcanoes.map(x => x.n)).toEqual([2, 4]);
    expect(searchRibbon('pe', [], VOLCS).volcanoes.map(x => x.n)).toEqual([1, 5]);
  });
  it('finds earthquakes by place or exact USGS id, largest first', () => {
    expect(searchRibbon('japan', QUAKES, VOLCS).quakes.map(x => x.id)).toEqual(['us7000aaaa']);
    expect(searchRibbon('US7000BBBB', QUAKES, VOLCS).quakes.map(x => x.id)).toEqual(['us7000bbbb']);
    expect(searchRibbon('a', QUAKES, []).quakes.map(x => x.id)).toEqual(['us7000bbbb', 'us7000aaaa', 'ak0001']);
  });
  it('reads a number as "this magnitude and above" and skips volcanoes then', () => {
    for (const text of ['4.5', 'M4.5', 'm4,5+', ' 4.5 ']) expect(searchRibbon(text, QUAKES, VOLCS).quakes.map(x => x.id)).toEqual(['us7000bbbb', 'us7000aaaa']);
    expect(searchRibbon('6', QUAKES, VOLCS).volcanoes).toEqual([]);
  });
  it('finds nothing for an empty query', () => {
    expect(searchRibbon('  ', QUAKES, VOLCS)).toEqual({ volcanoes: [], quakes: [] });
  });
});
