import { describe, expect, it } from 'vitest';
import { parseNominatim } from './places';

describe('parseNominatim', () => {
  it('uses the place name with region and country as the detail line', () => {
    const hits = parseNominatim([
      { lat: '59.9133301', lon: '10.7389701', name: 'Oslo', address: { city: 'Oslo', state: 'Oslo', country: 'Norway' } },
      { lat: '35.6812', lon: '139.7671', name: '東京都', address: { state: '東京都', country: '日本' } },
      { lat: '-41.2887', lon: '174.7772', address: { city: 'Wellington', state: 'Wellington Region', country: 'New Zealand' } },
    ]);
    expect(hits).toEqual([
      { name: 'Oslo', detail: 'Norway', lat: 59.9133, lon: 10.739 },
      { name: '東京都', detail: '日本', lat: 35.6812, lon: 139.7671 },
      { name: 'Wellington', detail: 'Wellington Region, New Zealand', lat: -41.2887, lon: 174.7772 },
    ]);
  });
  it('drops invalid coordinates, empty names and duplicates', () => {
    expect(parseNominatim([
      { lat: 'x', lon: '1', name: 'Bad' },
      { lat: '95', lon: '1', name: 'Out of range' },
      { lat: '1', lon: '1', name: '' },
      { lat: '10', lon: '10', name: 'Dup', address: { country: 'A' } },
      { lat: '10.1', lon: '10.1', name: 'Dup', address: { country: 'A' } },
    ])).toEqual([{ name: 'Dup', detail: 'A', lat: 10, lon: 10 }]);
    expect(parseNominatim({ error: 'nope' })).toEqual([]);
  });
});
