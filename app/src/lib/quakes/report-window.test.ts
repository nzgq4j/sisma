import { describe, expect, it } from 'vitest';
import { canReport, REPORT_WINDOW_MS } from './report-window';

describe('canReport', () => {
  const now = Date.UTC(2026, 10, 2, 18, 0);
  it('accepts quakes up to 6 hours old', () => {
    expect(canReport(now - 60_000, now)).toBe(true);
    expect(canReport(now - REPORT_WINDOW_MS, now)).toBe(true);
  });
  it('rejects older quakes and future timestamps', () => {
    expect(canReport(now - REPORT_WINDOW_MS - 1, now)).toBe(false);
    expect(canReport(now + 60_000, now)).toBe(false);
  });
});
