import { describe, expect, it } from 'vitest';
import { inQuietHours, localMinutes, matchRules, type AlertRule, type RuleRecipient } from './match';
import type { Quake } from '../quakes/types';

const NOW = Date.UTC(2026, 10, 3, 12, 0); // 12:00 UTC
const q = (o: Partial<Quake>): Quake => ({ id: 'usgs:a', source: 'usgs', mag: 5.5, title: '', region: 'Japan', time: NOW - 5 * 60_000, lat: 35.7, lon: 139.7, depthKm: 10, tsunami: false, ...o });
const dev = { id: 'd1', kind: 'fcm' as const, token: 't', locale: 'en', units: 'km' as const };
const rule = (o: Partial<AlertRule> = {}): AlertRule => ({ id: 'r1', name: 'Near home', minMagnitude: 5, nearPlaces: true, radiusKm: 500, countries: [], regions: [],
  quiet: false, quietFrom: 22 * 60, quietTo: 7 * 60, quietTz: 'UTC', quietMajor: true, ...o });
const rec = (rules: AlertRule[], o: Partial<RuleRecipient> = {}): RuleRecipient => ({ userId: 'u1', rules, locations: [{ name: 'Tokyo', lat: 35.68, lon: 139.69 }], devices: [dev], ...o });
const japan = () => ({ country: 'jp', region: 'east_asia' });

describe('quiet hours', () => {
  it('wraps past midnight and treats from = to as no quiet time', () => {
    expect(inQuietHours(23 * 60, 22 * 60, 7 * 60)).toBe(true);
    expect(inQuietHours(6 * 60, 22 * 60, 7 * 60)).toBe(true);
    expect(inQuietHours(12 * 60, 22 * 60, 7 * 60)).toBe(false);
    expect(inQuietHours(13 * 60, 12 * 60, 14 * 60)).toBe(true);
    expect(inQuietHours(5, 300, 300)).toBe(false);
  });
  it('reads the local time in the rule time zone (unknown zones fall back to UTC)', () => {
    expect(localMinutes(NOW, 'UTC')).toBe(12 * 60);
    expect(localMinutes(NOW, 'Asia/Tokyo')).toBe(21 * 60);
    expect(localMinutes(NOW, 'Not/AZone')).toBe(12 * 60);
  });
});

describe('matchRules', () => {
  it('first matching rule wins, one alert per event', () => {
    const a = matchRules([q({})], [rec([rule({ id: 'r1', name: 'Near home' }), rule({ id: 'r2', name: 'Japan', nearPlaces: false, countries: ['jp'] })])], [], NOW, japan);
    expect(a).toHaveLength(1);
    expect(a[0].ruleId).toBe('r1');
    expect(a[0].place?.name).toBe('Tokyo');
  });
  it('falls through to a later rule when an earlier one does not match', () => {
    const a = matchRules([q({ mag: 4.2 })], [rec([rule({ minMagnitude: 5 }), rule({ id: 'r2', minMagnitude: 4, nearPlaces: false, countries: ['jp'] })])], [], NOW, japan);
    expect(a.map(x => [x.ruleId, x.area])).toEqual([['r2', { kind: 'country', code: 'jp' }]]);
  });
  it('quiet hours hold back alerts, except strong quakes when allowed', () => {
    const tokyoNight = rule({ quiet: true, quietTz: 'Asia/Tokyo', quietFrom: 20 * 60, quietTo: 6 * 60 }); // 21:00 in Tokyo
    expect(matchRules([q({ mag: 5.5 })], [rec([tokyoNight])], [], NOW)).toHaveLength(0);
    expect(matchRules([q({ mag: 6.1 })], [rec([tokyoNight])], [], NOW)).toHaveLength(1);
    expect(matchRules([q({ mag: 6.1 })], [rec([{ ...tokyoNight, quietMajor: false }])], [], NOW)).toHaveLength(0);
  });
  it('a region-only rule needs no saved places; no rules or devices means nothing', () => {
    expect(matchRules([q({})], [rec([rule({ nearPlaces: false, regions: ['east_asia'] })], { locations: [] })], [], NOW, japan)).toHaveLength(1);
    expect(matchRules([q({})], [rec([])], [], NOW, japan)).toHaveLength(0);
    expect(matchRules([q({})], [rec([rule()], { devices: [] })], [], NOW, japan)).toHaveLength(0);
  });
  it('never repeats a delivered event', () => {
    const delivered = [{ userId: 'u1', quakeId: 'usgs:a', time: NOW - 5 * 60_000, lat: 35.7, lon: 139.7 }];
    expect(matchRules([q({})], [rec([rule()])], delivered, NOW)).toHaveLength(0);
  });
});
