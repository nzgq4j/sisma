import { describe, expect, it } from 'vitest';
import { formatDms } from './geo';

describe('formatDms', () => {
  it('formats latitude and longitude as degrees, minutes, seconds', () => {
    expect(formatDms(51.557, 16.04011)).toBe(`51°33'25.2"N 016°02'24.4"E`);
    expect(formatDms(-33.4489, -70.6693)).toBe(`33°26'56.0"S 070°40'09.5"W`);
  });
  it('carries rounded seconds into minutes and degrees', () => {
    expect(formatDms(10.9999999, 0)).toBe(`11°00'00.0"N 000°00'00.0"E`);
  });
});
