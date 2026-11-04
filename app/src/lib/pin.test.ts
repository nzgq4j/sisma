import { describe, expect, it } from 'vitest';
import { PIN_HEAD, dotRadius, markerHit, pinReach } from './pin';

describe('markers', () => {
  it('circles grow with magnitude and keep a minimum size', () => {
    expect(dotRadius(1)).toBe(2.4);
    expect(dotRadius(6)).toBeGreaterThan(dotRadius(5));
  });
  it('pins are aimed at the head, circles at the centre', () => {
    expect(markerHit('pins', 5, true)).toEqual({ dy: -PIN_HEAD, reach: pinReach(true) });
    expect(markerHit('circles', 5, false)).toEqual({ dy: 0, reach: dotRadius(5) + 3 });
  });
  it('small circles stay easy to tap (≈ 44 px across)', () => {
    expect(markerHit('circles', 2, true).reach).toBeGreaterThanOrEqual(22);
  });
});
