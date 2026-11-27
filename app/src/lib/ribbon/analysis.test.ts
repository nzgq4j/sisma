import { describe, expect, it } from 'vitest';
import { alongRoute, byRegion, depthHistogram, isMw, magHistogram, mcMaxCurvature, momentNm, mwOf, MC_MIN_EVENTS } from './analysis';
import { GROUPS, type RibbonQuake } from './shared';
import type { RibbonVolcano } from './volcanoes';

const gi = (g: string) => GROUPS.indexOf(g as (typeof GROUPS)[number]);
const q = (x: number, mag: number | null, magType: string | null, group: string, depth = 10, join?: string): RibbonQuake =>
  ({ id: `${x}-${mag}`, x, mag, magType, depth, from: gi(group), to: gi(join ?? group) }) as RibbonQuake;
const v = (group: string, status: RibbonVolcano['status']) => ({ group: gi(group), status }) as RibbonVolcano;

describe('seismic moment', () => {
  it('converts moment magnitudes only', () => {
    expect(['Mww', 'mwc', 'mwb', 'mwr', 'mw', 'Mwp'].every(isMw)).toBe(true);
    expect(['mb', 'ml', 'md', 'ms_20', null].some(isMw)).toBe(false);
  });
  it('follows M0 = 10^(1.5 Mw + 9.1) N·m', () => {
    expect(momentNm(6)).toBeCloseTo(1.2589e18, -15);
    expect(mwOf(momentNm(7.3))).toBeCloseTo(7.3, 10);
    // Two M7 earthquakes release as much as one M7.2.
    expect(mwOf(2 * momentNm(7))).toBeCloseTo(7.2, 1);
    expect(mwOf(0)).toBeNull();
  });
});

describe('along the route', () => {
  it('counts per bin and normalises per 100 km per day', () => {
    const bins = alongRoute([q(50, 5, 'mww', 'japan'), q(120, 4, 'mb', 'japan'), q(990, 6, 'mww', 'japan')], 1000, 500, 10);
    expect(bins.map(b => b.count)).toEqual([2, 1]);
    expect(bins[0].perDay100).toBeCloseTo(2 / 5 / 10);
    expect(bins[0].moment).toBeCloseTo(momentNm(5)); // the mb event adds no moment
    expect(bins[1].moment).toBeCloseTo(momentNm(6));
  });
  it('puts earthquakes beyond the ends into the end bins, and makes a short last bin', () => {
    const bins = alongRoute([q(-200, 5, 'mb', 'japan'), q(1300, 5, 'mb', 'japan')], 1200, 500, 1);
    expect(bins.map(b => [b.x0, b.x1, b.count])).toEqual([[0, 500, 1], [500, 1000, 0], [1000, 1200, 1]]);
    expect(bins[2].perDay100).toBeCloseTo(1 / 2);
  });
});

describe('by region', () => {
  const regions = [{ group: 'japan' as const, x0: 0, x1: 2000 }, { group: 'tonga' as const, x0: 2500, x1: 3000 }];
  const gaps = [{ x0: 2000, x1: 2500 }];
  it('counts per region, puts joins apart, and normalises per 1,000 km per day', () => {
    const rows = byRegion([q(10, 5, 'mww', 'japan'), q(20, 4.2, 'mb', 'japan'), q(2600, 6, 'mww', 'tonga'), q(2200, 4.5, 'mb', 'japan', 10, 'tonga')],
      regions, gaps, [v('japan', 'catalogued'), v('japan', 'continuing'), v('tonga', 'unknown')], 2);
    const [jp, to, joins] = rows;
    expect(rows.map(r => r.group)).toEqual(['japan', 'tonga', 'joins']);
    expect([jp.count, to.count, joins.count]).toEqual([2, 1, 1]);
    expect(jp.perDay1000).toBeCloseTo(2 / 2 / 2);
    expect(to.perDay1000).toBeCloseTo(1 / 0.5 / 2);
    expect(joins.lengthKm).toBe(500);
    expect(jp.mwCount).toBe(1);
    expect(jp.mwTotal).toBeCloseTo(5);
    expect(jp.minMag).toBe(4.2);
    expect([jp.volcanoes, jp.reported, to.volcanoes, to.reported]).toEqual([2, 1, 1, 0]);
    expect(jp.volcPer1000).toBeCloseTo(1);
    expect(jp.mcEstimate).toBeNull(); // too few for an estimate
  });
});

describe('completeness estimate (maximum curvature)', () => {
  it('needs enough magnitudes', () => {
    expect(mcMaxCurvature(Array(MC_MIN_EVENTS - 1).fill(3))).toBeNull();
  });
  it('is the lower edge of the most populated 0.1 bin', () => {
    const mags = [...Array(10).fill(2.5), ...Array(30).fill(2.84), ...Array(20).fill(3.1), ...Array(5).fill(4.0)];
    expect(mcMaxCurvature(mags)).toBe(2.8);
  });
});

describe('distributions', () => {
  it('bins magnitudes by half units from the smallest to the largest', () => {
    expect(magHistogram([q(0, 4.6, 'mb', 'japan'), q(0, 5.4, 'mb', 'japan'), q(0, 6.0, 'mww', 'japan'), q(0, null, null, 'japan')]))
      .toEqual([{ m0: 4.5, count: 1 }, { m0: 5, count: 1 }, { m0: 5.5, count: 0 }, { m0: 6, count: 1 }]);
    expect(magHistogram([])).toEqual([]);
  });
  it('counts depth classes, with the classes covering every depth', () => {
    const h = depthHistogram([q(0, 5, 'mb', 'japan', -1), q(0, 5, 'mb', 'japan', 35), q(0, 5, 'mb', 'japan', 650)]);
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(3);
    expect(h[0].count).toBe(1);
    expect(h.at(-1)!.count).toBe(1);
  });
});
