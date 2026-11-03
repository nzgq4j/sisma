import { describe, expect, it } from 'vitest';
import { reviewStatus } from './status';

describe('reviewStatus', () => {
  it('maps USGS status', () => {
    expect(reviewStatus('usgs', 'reviewed')).toBe('reviewed');
    expect(reviewStatus('usgs', 'automatic')).toBe('automatic');
    expect(reviewStatus('usgs', 'deleted')).toBeNull();
  });
  it('maps GeoNet quality', () => {
    expect(reviewStatus('geonet', 'best')).toBe('reviewed');
    expect(reviewStatus('geonet', 'preliminary')).toBe('preliminary');
    expect(reviewStatus('geonet', 'automatic')).toBe('automatic');
    expect(reviewStatus('geonet', 'deleted')).toBeNull();
  });
  it('leaves unknown or missing values undefined', () => {
    expect(reviewStatus('usgs', undefined)).toBeUndefined();
    expect(reviewStatus('usgs', 'something')).toBeUndefined();
    expect(reviewStatus('emsc', 'reviewed')).toBeUndefined();
  });
});
