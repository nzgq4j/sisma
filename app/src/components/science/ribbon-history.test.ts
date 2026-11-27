import { describe, expect, it } from 'vitest';
import { minFor, presetRange, trailPeriod, visibleQuakes } from './RibbonHistory';
import { GROUPS, type RibbonQuake } from '@/lib/ribbon/shared';

const DAY = 86_400_000;
const q = (id: string, time: number, depth: number, group: string): RibbonQuake => {
  const g = GROUPS.indexOf(group as (typeof GROUPS)[number]);
  return { id, time, depth, from: g, to: g } as RibbonQuake;
};

describe('history playback', () => {
  const T = Date.parse('2026-06-01T00:00:00Z');
  const all = [q('a', T, 10, 'japan'), q('b', T + 2 * DAY, 120, 'japan'), q('c', T + 9 * DAY, 400, 'tonga'), q('d', T + 20 * DAY, 30, 'tonga')];

  it('shows only earthquakes up to the play head', () => {
    expect(visibleQuakes(all, { head: T + 5 * DAY, trail: 'all', depth: 'all', region: null }).map(x => x.id)).toEqual(['a', 'b']);
  });
  it('keeps only the trail behind the play head', () => {
    expect(visibleQuakes(all, { head: T + 10 * DAY, trail: 'week', depth: 'all', region: null }).map(x => x.id)).toEqual(['c']);
    expect(visibleQuakes(all, { head: T + 10 * DAY, trail: 'month', depth: 'all', region: null }).map(x => x.id)).toEqual(['a', 'b', 'c']);
  });
  it('filters by depth band and region', () => {
    const end = T + 30 * DAY;
    expect(visibleQuakes(all, { head: end, trail: 'all', depth: 'deep', region: null }).map(x => x.id)).toEqual(['c']);
    expect(visibleQuakes(all, { head: end, trail: 'all', depth: 'shallow', region: null }).map(x => x.id)).toEqual(['a', 'd']);
    expect(visibleQuakes(all, { head: end, trail: 'all', depth: 'all', region: 'tonga' }).map(x => x.id)).toEqual(['c', 'd']);
  });
  it('fades over the trail (the whole range over 30 days)', () => {
    expect(trailPeriod('day')).toBe('day');
    expect(trailPeriod('all')).toBe('month');
  });
  it('raises the magnitude filter when a range is too long for it', () => {
    expect(minFor(31, 0)).toBe(0);
    expect(minFor(90, 0)).toBe(2.5);
    expect(minFor(366, 2.5)).toBe(2.5);
    expect(minFor(400, 2.5)).toBe(4.5);
    expect(minFor(90, 4.5)).toBe(4.5);
  });
  it('builds the 90-day and one-year presets ending today (UTC)', () => {
    const now = Date.parse('2026-11-27T12:00:00Z');
    expect(presetRange('90d', now)).toEqual({ start: '2026-08-30', end: '2026-11-27' });
    expect(presetRange('year', now)).toEqual({ start: '2025-11-27', end: '2026-11-27' });
  });
});

import { rangeFor, spanDays, withMagnitude } from './RibbonHistory';

describe('history range choices', () => {
  const now = Date.parse('2026-11-27T12:00:00Z');
  it('counts days inclusively', () => {
    expect(spanDays('2026-11-01', '2026-11-30')).toBe(30);
    expect(spanDays('', '2026-11-30')).toBe(0);
  });
  it('applies presets, raising the magnitude when needed, and keeps custom dates', () => {
    expect(rangeFor('year', { start: '2026-11-01', end: '2026-11-20', min: 0 }, now)).toEqual({ start: '2025-11-27', end: '2026-11-27', min: 2.5 });
    expect(rangeFor('90d', { start: '2026-11-01', end: '2026-11-20', min: 4.5 }, now)).toEqual({ start: '2026-08-30', end: '2026-11-27', min: 4.5 });
    const c = { start: '2026-01-01', end: '2026-01-10', min: 0 as const };
    expect(rangeFor('custom', c, now)).toBe(c);
  });
  it('shortens the range to the longest allowed for a lower magnitude, keeping the end', () => {
    expect(withMagnitude({ start: '2026-08-30', end: '2026-11-27', min: 2.5 }, 0)).toEqual({ range: { start: '2026-10-28', end: '2026-11-27', min: 0 }, shortened: true });
    expect(spanDays('2026-10-28', '2026-11-27')).toBe(31);
    expect(withMagnitude({ start: '2026-08-30', end: '2026-11-27', min: 2.5 }, 4.5)).toEqual({ range: { start: '2026-08-30', end: '2026-11-27', min: 4.5 }, shortened: false });
  });
});
