import { describe, expect, it } from 'vitest';
import { northAt } from './north';
import { layout } from './transform';

const at = (g: string) => { const r = layout().regions.find(x => x.group === g)!; return northAt((r.x0 + r.x1) / 2); };

describe('northAt', () => {
  it('is a unit vector', () => {
    for (const x of [0, 5000, 20000, 39000]) { const [a, b] = northAt(x); expect(Math.hypot(a, b)).toBeCloseTo(1, 6); }
  });
  it('points along the route where it runs north (the Andes)', () => {
    const [along] = at('central_andes');
    expect(along).toBeGreaterThan(0.9);
  });
  it('points to the right of the route (away from the Pacific) along the Aleutians, which run west', () => {
    const [along, left] = at('aleutians');
    expect(left).toBeLessThan(-0.9);
    expect(Math.abs(along)).toBeLessThan(0.45);
  });
  it('points back along the route where it runs south (Tonga)', () => {
    const [along] = at('tonga');
    expect(along).toBeLessThan(-0.9);
  });
});
