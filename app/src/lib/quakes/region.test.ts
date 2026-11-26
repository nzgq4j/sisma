import { describe, expect, it } from 'vitest';
import { placeDetail, splitPlace } from './region';

describe('placeDetail', () => {
  it('hides a line that only repeats the place name', () => {
    expect(placeDetail({ title: 'FLORES REGION, INDONESIA', region: 'Flores Region, Indonesia' })).toBeNull();
    expect(placeDetail({ title: 'ALBANIA', region: 'Albania' })).toBeNull();
  });
  it('keeps a line that adds something', () => {
    expect(placeDetail({ title: '50 km SSE of Palekastro', region: 'Greece' })).toBe('50 km SSE of Palekastro');
    expect(placeDetail(splitPlace('12 km SW of Ridgecrest, CA'))).toBe('12 km SW of Ridgecrest');
  });
});
