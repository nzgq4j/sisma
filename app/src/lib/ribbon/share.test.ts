import { describe, expect, it } from 'vitest';
import en from '@/i18n/messages/en.json';
import { CARD_ROWS, cardRows, ribbonAlt, ribbonFacts, ribbonFileName, ribbonPost, rowOf } from './share';
import type { RibbonQuake } from './shared';
import type { RibbonVolcano } from './volcanoes';

const q = (id: string, mag: number | null, depth: number, x: number, place: string | null = `${id} place`): RibbonQuake => ({
  id, time: 1_700_000_000_000, updated: 1_700_000_000_000, lat: 0, lon: 0, depth, mag, magType: 'mb', place, status: 'reviewed', net: 'us', sig: null,
  felt: null, cdi: null, mmi: null, alert: null, tsunami: false, nst: null, gap: null, rms: null, dmin: null, hErr: null, dErr: null, magErr: null,
  url: '', x, y: 0, from: 0, to: 0,
});
const v = (n: number, status: RibbonVolcano['status']) => ({ n, status, x: 1000 }) as RibbonVolcano;
const k = en.ribbon;
const s = {
  post: k.share_post, alt_intro: k.alt_intro, alt_quakes: k.alt_quakes, alt_none: k.alt_none, alt_largest: k.alt_largest, alt_deepest: k.alt_deepest,
  alt_deep: k.alt_deep, alt_volc: k.alt_volc, alt_terrain: k.alt_terrain, alt_source: k.alt_source, all_mags: k.all_mags,
};
const f = { period: '30 days', int: (n: number) => n.toLocaleString('en'), mag: (m: number) => m.toFixed(1), depth: (km: number) => `${km} km`, place: (p: string) => p };

describe('ribbon share', () => {
  const quakes = [q('a', 4.6, 35, 100), q('b', 6.2, 120, 9000), q('c', 5.0, 610, 25000), q('d', null, 320, 30000)];
  const vols = [v(1, 'continuing'), v(2, 'catalogued'), v(3, 'new_unrest'), v(4, 'unknown')];

  it('states the facts from the data', () => {
    const facts = ribbonFacts(quakes, vols);
    expect(facts.n).toBe(4);
    expect(facts.largest?.id).toBe('b');
    expect(facts.deepest?.id).toBe('c');
    expect(facts.deep).toBe(2); // 610 and 320 km
    expect(facts.reported).toBe(2); // catalogued and unknown are not in the report
  });

  it('writes the post with the period, filter and largest event', () => {
    const post = ribbonPost(ribbonFacts(quakes, vols), 2.5, s, f);
    expect(post).toBe('Pacific Fire Ribbon · last 30 days\n4 earthquakes (M2.5+) along the Ring of Fire, from the southern Andes to New Zealand\nLargest: M6.2 · b place');
  });

  it('leaves out the largest line when there is no magnitude, and says "all magnitudes" for no filter', () => {
    const post = ribbonPost(ribbonFacts([q('x', null, 10, 5)], []), 0, s, f);
    expect(post).toContain('(all magnitudes)');
    expect(post).not.toContain('Largest');
  });

  it('describes the image in reading order, with no unfilled placeholders', () => {
    const alt = ribbonAlt(ribbonFacts(quakes, vols), 2.5, s, f);
    expect(alt).toMatch(/^The Pacific Ring of Fire unrolled/);
    expect(alt).toContain('4 earthquakes from the last 30 days (M2.5+)');
    expect(alt).toContain('The largest, ringed, is M6.2, b place, 120 km deep.');
    expect(alt).toContain('The deepest is 610 km deep, c place.');
    expect(alt).toContain('2 are deeper than 300 km.');
    expect(alt).toContain('2 volcanoes');
    expect(alt).toContain('×20');
    expect(alt).not.toMatch(/\{\w+\}/);
  });

  it('says so when no earthquakes are on the ribbon, and leaves out volcanoes and terrain when absent', () => {
    const alt = ribbonAlt(ribbonFacts([], []), 4.5, { ...s, alt_terrain: '' }, f);
    expect(alt).toContain('No earthquakes from the last 30 days (M4.5+) are on the ribbon.');
    expect(alt).not.toContain('volcanoes in this week');
    expect(alt).not.toContain('Terrain');
    expect(alt).not.toMatch(/\s{2,}/);
  });

  it('folds the route into rows that alternate direction and cover it without gaps', () => {
    const L = 39460;
    const rows = cardRows(L);
    expect(rows).toHaveLength(CARD_ROWS);
    expect(rows[0].x0).toBe(0);
    expect(rows[CARD_ROWS - 1].x1).toBeCloseTo(L);
    rows.forEach((r, i) => {
      if (i) expect(r.x0).toBeCloseTo(rows[i - 1].x1);
      expect(r.rev).toBe(i % 2 === 1);
      expect(r.px(r.x0)).toBeCloseTo(r.rev ? 1 : 0);
      expect(r.px(r.x1)).toBeCloseTo(r.rev ? 0 : 1);
    });
    // Each fold joins the end of one row to the start of the next on the same side.
    for (let i = 0; i < CARD_ROWS - 1; i++) expect(rows[i].px(rows[i].x1)).toBeCloseTo(rows[i + 1].px(rows[i + 1].x0));
    expect(rowOf(-300, L)).toBe(0);
    expect(rowOf(L + 300, L)).toBe(CARD_ROWS - 1);
    expect(rowOf(L / 2 + 1, L)).toBe(2);
  });

  it('names the file after the period and filter', () => {
    expect(ribbonFileName('month', 2.5)).toBe('sisma-fire-ribbon-month-m2.5.png');
    expect(ribbonFileName('day', 0)).toBe('sisma-fire-ribbon-day-all.png');
  });
});
