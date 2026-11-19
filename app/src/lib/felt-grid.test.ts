import { describe, expect, it } from 'vitest';
import { feltColor, feltGrid } from './felt-grid';
import { FELT_NEUTRAL, MMI_COLORS } from './theme';

describe('felt grid', () => {
  it('merges sources into 0.1° cells with a report-weighted mean intensity', () => {
    const g = feltGrid({
      reports: [{ lat: 19.41, lon: -99.13, n: 1, mmi: 6 }],
      dyfi: [{ lat: 19.39, lon: -99.12, n: 3, cdi: 4 }],
      emsc: [{ lat: 20.0, lon: -99.0, n: 2, mmi: 3 }],
    });
    expect(g).toEqual([{ lat: 19.4, lon: -99.1, n: 4, mmi: 4.5 }, { lat: 20, lon: -99, n: 2, mmi: 3 }]);
  });

  it('adds automatic felt map areas without an intensity, unless a report already covers them', () => {
    const g = feltGrid({ reports: [{ lat: 10, lon: 10, n: 2, mmi: 5 }], heat: [{ lat: 10.02, lon: 9.98 }, { lat: 11, lon: 10 }] });
    expect(g).toEqual([{ lat: 10, lon: 10, n: 2, mmi: 5 }, { lat: 11, lon: 10, n: 0, mmi: null }]);
  });

  it('ignores reports without a count or intensity, and clamps intensity to I–X', () => {
    expect(feltGrid({ emsc: [{ lat: 0, lon: 0, n: 0, mmi: 5 }], reports: [{ lat: 1, lon: 1, n: 1, mmi: NaN }] })).toEqual([]);
    expect(feltGrid({ emsc: [{ lat: 0, lon: 0, n: 1, mmi: 12 }] })[0].mmi).toBe(10);
  });

  it('colours by intensity, neutral when unknown', () => {
    expect(feltColor(4.6)).toBe(MMI_COLORS[4]);
    expect(feltColor(null)).toBe(FELT_NEUTRAL);
  });
});
