import { describe, expect, it } from 'vitest';
import { geoOrthographic } from 'd3-geo';
import { orthoInvert } from './relief';

describe('orthoInvert', () => {
  it('matches d3 geoOrthographic().rotate().invert across rotations and points', () => {
    const R = 100;
    for (const rot of [[0, 0], [-174.8, 41.3], [120, -30], [-40, 60], [10, -85]] as const) {
      const p = geoOrthographic().rotate([rot[0], rot[1], 0]).scale(R).translate([0, 0]);
      for (const [u, v] of [[0, 0], [0.5, 0.2], [-0.7, 0.4], [0.1, -0.9], [-0.3, -0.3]]) {
        const want = p.invert!([u * R, -v * R])!;
        const got = orthoInvert(u, v, rot[0], rot[1]);
        expect(got[1]).toBeCloseTo(want[1], 6);
        const dl = ((got[0] - want[0] + 540) % 360) - 180;
        expect(Math.abs(dl)).toBeLessThan(1e-6);
      }
    }
  });
});
