import { describe, expect, it } from 'vitest';
import { convertKmInText } from './units';

describe('convertKmInText', () => {
  it('converts USGS and GeoNet distances to miles', () => {
    expect(convertKmInText('81 km SSE of Palekastro', 'mi')).toBe('50 mi SSE of Palekastro');
    expect(convertKmInText('5 km south of Whakatane', 'mi')).toBe('3.1 mi south of Whakatane');
    expect(convertKmInText('193 km ENE of Nagqu', 'mi')).toBe('120 mi ENE of Nagqu');
  });
  it('leaves text unchanged in km or without a distance', () => {
    expect(convertKmInText('81 km SSE of Palekastro', 'km')).toBe('81 km SSE of Palekastro');
    expect(convertKmInText('CENTRAL CHILE', 'mi')).toBe('CENTRAL CHILE');
    expect(convertKmInText('Skm Islands', 'mi')).toBe('Skm Islands');
  });
});
