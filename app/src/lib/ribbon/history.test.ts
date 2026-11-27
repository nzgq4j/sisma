import { describe, expect, it } from 'vitest';
import { DEPTH_FILTERS, MAX_SPAN_DAYS, defaultSpeed, fdsnUrls, historyPieces, inDepth, isoDay, pieceIsSettled, utcDay, SPEEDS_MS } from './history';

const NOW = Date.parse('2026-11-27T12:00:00Z');
const DAY = 86_400_000;

describe('history ranges', () => {
  it('reads whole UTC days and rejects non-dates', () => {
    expect(utcDay('2026-02-28')).toBe(Date.parse('2026-02-28T00:00:00Z'));
    expect(utcDay('2026-02-30')).toBeNull();
    expect(utcDay('2026-2-3')).toBeNull();
    expect(utcDay(null)).toBeNull();
    expect(isoDay(Date.parse('2026-11-01T23:59:00Z'))).toBe('2026-11-01');
  });

  it('rejects bad, reversed, future, too early and too long ranges', () => {
    expect(historyPieces('x', '2026-01-01', 2.5, NOW)).toEqual({ ok: false, error: 'bad_date' });
    expect(historyPieces('2026-02-01', '2026-01-01', 2.5, NOW)).toEqual({ ok: false, error: 'order' });
    expect(historyPieces('2026-12-01', '2026-12-02', 2.5, NOW)).toEqual({ ok: false, error: 'future' });
    expect(historyPieces('1969-12-31', '1970-01-05', 4.5, NOW)).toEqual({ ok: false, error: 'too_early' });
    expect(historyPieces('2026-01-01', '2026-02-01', 0, NOW)).toEqual({ ok: false, error: 'too_long' }); // 32 days
    expect(historyPieces('2026-01-01', '2026-01-31', 0, NOW).ok).toBe(true); // 31 days
    expect(MAX_SPAN_DAYS[2.5]).toBe(366);
    expect(historyPieces('2025-11-27', '2026-11-27', 2.5, NOW).ok).toBe(true); // 366 days
    expect(historyPieces('2025-11-26', '2026-11-27', 2.5, NOW)).toEqual({ ok: false, error: 'too_long' });
  });

  it('splits a range into calendar months that cover it exactly, ending now when the range reaches today', () => {
    const r = historyPieces('2026-08-29', '2026-11-27', 2.5, NOW);
    if (!r.ok) throw new Error('expected ok');
    expect(r.days).toBe(91);
    expect(r.pieces.map(([a, b]) => [isoDay(a), new Date(b).toISOString()])).toEqual([
      ['2026-08-29', '2026-09-01T00:00:00.000Z'],
      ['2026-09-01', '2026-10-01T00:00:00.000Z'],
      ['2026-10-01', '2026-11-01T00:00:00.000Z'],
      ['2026-11-01', '2026-11-27T12:00:00.000Z'],
    ]);
    for (let i = 1; i < r.pieces.length; i++) expect(r.pieces[i][0]).toBe(r.pieces[i - 1][1]);
    expect(r.to).toBe(NOW);
  });

  it('ends a range reaching today at now rounded up to 10 minutes (so the newest piece can be cached)', () => {
    const r = historyPieces('2026-11-20', '2026-11-27', 2.5, Date.parse('2026-11-27T07:03:29.695Z'));
    if (!r.ok) throw new Error('expected ok');
    expect(new Date(r.to).toISOString()).toBe('2026-11-27T07:10:00.000Z');
  });

  it('uses calendar quarters for M4.5+, and ends at the end of the last day for a past range', () => {
    const r = historyPieces('2024-02-10', '2025-01-15', 4.5, NOW);
    if (!r.ok) throw new Error('expected ok');
    expect(r.pieces.map(([a]) => isoDay(a))).toEqual(['2024-02-10', '2024-04-01', '2024-07-01', '2024-10-01', '2025-01-01']);
    expect(r.pieces.at(-1)![1]).toBe(Date.parse('2025-01-16T00:00:00Z'));
  });

  it('searches earthquakes only, oldest first, with the magnitude filter', () => {
    const u = fdsnUrls(Date.parse('2026-01-01T00:00:00Z'), Date.parse('2026-02-01T00:00:00Z'), 4.5);
    expect(u.geojson).toContain('format=geojson');
    expect(u.csv).toContain('format=csv');
    expect(u.geojson).toContain('starttime=2026-01-01T00%3A00%3A00');
    expect(u.geojson).toContain('endtime=2026-02-01T00%3A00%3A00');
    expect(u.geojson).toContain('eventtype=earthquake');
    expect(u.geojson).toContain('orderby=time-asc');
    expect(u.geojson).toContain('minmagnitude=4.5');
    expect(fdsnUrls(0, DAY, 0).geojson).not.toContain('minmagnitude');
    // Times with milliseconds are written in whole seconds (rounded up), never with a time zone suffix.
    const odd = fdsnUrls(Date.parse('2026-11-01T00:00:00Z'), Date.parse('2026-11-27T07:00:29.695Z'), 2.5).geojson;
    expect(odd).toContain('endtime=2026-11-27T07%3A00%3A30&');
    expect(odd).not.toMatch(/Z&|\.\d{3}/);
  });

  it('treats pieces older than two days as settled', () => {
    expect(pieceIsSettled(NOW - 3 * DAY, NOW)).toBe(true);
    expect(pieceIsSettled(NOW - DAY, NOW)).toBe(false);
  });

  it('picks a speed that plays the range in about 30 seconds', () => {
    expect(defaultSpeed(30 * DAY)).toBe(DAY);
    expect(defaultSpeed(366 * DAY)).toBe(7 * DAY);
    expect(defaultSpeed(3 * 366 * DAY)).toBe(30 * DAY);
    expect(SPEEDS_MS).toContain(defaultSpeed(2 * DAY));
  });

  it('filters depths into bands with no gaps or overlaps', () => {
    expect(inDepth(69.9, 'shallow')).toBe(true);
    expect(inDepth(70, 'shallow')).toBe(false);
    expect(inDepth(70, 'intermediate')).toBe(true);
    expect(inDepth(300, 'deep')).toBe(true);
    expect(inDepth(-1, 'all')).toBe(true);
    expect(Object.keys(DEPTH_FILTERS)).toEqual(['all', 'shallow', 'intermediate', 'deep']);
  });
});
