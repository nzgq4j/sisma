import { describe, expect, it } from 'vitest';
import { countryAt } from './country';

describe('countryAt', () => {
  it('finds the country containing an inland event', () => {
    expect(countryAt(51.557, 16.04)).toEqual({ code: 'pl', near: false });   // Poland (EMSC M4.7 example)
    expect(countryAt(-23.65, -70.4)?.code).toBe('cl');                       // Antofagasta, Chile
    expect(countryAt(39.0, 35.0)).toEqual({ code: 'tr', near: false });       // central Turkey
  });
  it('uses the nearest country for events just offshore', () => {
    expect(countryAt(38.3, 142.8)).toEqual({ code: 'jp', near: true });      // off Tohoku
    expect(countryAt(-8.0, 122.5)?.code).toBe('id');                          // Flores Sea
  });
  it('returns null far out at sea', () => {
    expect(countryAt(0, -150)).toBeNull();                                    // central Pacific
  });
});
