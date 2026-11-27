import { describe, expect, it } from 'vitest';
import { sceneZ } from './shared';

// In a right-handed frame, "left" when facing `forward` with `up` overhead is up × forward.
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

describe('3D scene orientation', () => {
  it('puts the left of the route (+y, the Pacific side) on the left of the direction of travel, not mirrored', () => {
    const left = cross([0, 1, 0], [1, 0, 0]); // up × forward, with the route along +X
    expect(Math.sign(sceneZ(100))).toBe(Math.sign(left[2]));
    expect(sceneZ(-700)).toBeGreaterThan(0); // behind the arc: the other side
  });
});
