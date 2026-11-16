import { describe, expect, it } from 'vitest';
import { shouldOfferInstall } from './InstallPrompt';

const ios = { ios: true, standalone: false, native: false };
describe('shouldOfferInstall', () => {
  it('offers on iOS in the browser until dismissed', () => {
    expect(shouldOfferInstall(null, 1000, ios)).toBe(true);
    expect(shouldOfferInstall('done', 1000, ios)).toBe(false);
  });
  it('respects the snooze', () => {
    expect(shouldOfferInstall('snooze:2000', 1000, ios)).toBe(false);
    expect(shouldOfferInstall('snooze:2000', 3000, ios)).toBe(true);
  });
  it('never offers elsewhere', () => {
    expect(shouldOfferInstall(null, 0, { ...ios, ios: false })).toBe(false);
    expect(shouldOfferInstall(null, 0, { ...ios, standalone: true })).toBe(false);
    expect(shouldOfferInstall(null, 0, { ...ios, native: true })).toBe(false);
  });
});
