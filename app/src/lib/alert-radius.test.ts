import { describe, expect, it } from 'vitest';
import { ALERT_RADII, snapRadius } from './alert-radius';

describe('snapRadius', () => {
  it('keeps values that are already options', () => {
    for (const u of ['km', 'mi'] as const) for (const r of ALERT_RADII[u]) expect(snapRadius(r, u)).toBe(r);
  });
  it('maps km choices to the matching mile choices and back', () => {
    expect([100, 250, 500, 1000].map(r => snapRadius(r, 'mi'))).toEqual(ALERT_RADII.mi.slice(0, 4));
    expect(ALERT_RADII.mi.slice(0, 4).map(r => snapRadius(r, 'km'))).toEqual([100, 250, 500, 1000]);
  });
  it('keeps anywhere as anywhere', () => {
    expect(snapRadius(0, 'mi')).toBe(0);
    expect(snapRadius(0, 'km')).toBe(0);
  });
});
