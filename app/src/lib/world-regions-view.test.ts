import { describe, expect, it } from 'vitest';
import { REGION_VIEW, WORLD_REGIONS, worldRegion } from './world-regions';

describe('REGION_VIEW', () => {
  it('has a view for every region but polar, centred inside that region', () => {
    for (const r of WORLD_REGIONS) {
      const v = REGION_VIEW[r];
      if (r === 'polar') { expect(v).toBeNull(); continue; }
      expect(v, r).not.toBeNull();
      expect(worldRegion(v!.lat, v!.lon), r).toBe(r);
      expect(v!.span).toBeGreaterThan(10);
      expect(v!.span).toBeLessThanOrEqual(120);
    }
  });
});
