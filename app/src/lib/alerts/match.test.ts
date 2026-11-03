import { describe, expect, it } from 'vitest';
import { matchAlerts, type AlertRecipient } from './match';
import type { Quake } from '../quakes/types';

const NOW = Date.UTC(2026, 10, 3, 12, 0);
const q = (o: Partial<Quake>): Quake => ({ id: 'usgs:a', source: 'usgs', mag: 5.5, title: '', region: 'Japan', time: NOW - 5 * 60_000, lat: 35.7, lon: 139.7, depthKm: 10, tsunami: false, ...o });
const dev = { id: 'd1', kind: 'fcm' as const, token: 't', locale: 'en', units: 'km' as const };
const r = (o: Partial<AlertRecipient> = {}): AlertRecipient => ({ userId: 'u1', minMagnitude: 5, radiusKm: 500, locations: [{ name: 'Tokyo', lat: 35.68, lon: 139.69 }], devices: [dev], ...o });

describe('matchAlerts', () => {
  it('alerts a recent quake above the threshold within the radius', () => {
    const a = matchAlerts([q({})], [r()], [], NOW);
    expect(a).toHaveLength(1);
    expect(a[0].place?.name).toBe('Tokyo');
    expect(a[0].place!.distanceKm).toBeLessThan(5);
  });
  it('skips small, far and old quakes', () => {
    expect(matchAlerts([q({ mag: 4.9 })], [r()], [], NOW)).toHaveLength(0);
    expect(matchAlerts([q({ lat: 0, lon: 0 })], [r()], [], NOW)).toHaveLength(0);
    expect(matchAlerts([q({ time: NOW - 31 * 60_000 })], [r()], [], NOW)).toHaveLength(0);
  });
  it('uses the nearest of several saved places, and radius 0 means anywhere', () => {
    const locs = [{ name: 'Home', lat: 0, lon: 0 }, { name: 'Office', lat: 36.0, lon: 140.0 }];
    expect(matchAlerts([q({})], [r({ locations: locs })], [], NOW)[0].place?.name).toBe('Office');
    expect(matchAlerts([q({ lat: -40, lon: 175 })], [r({ radiusKm: 0 })], [], NOW)).toHaveLength(1);
  });
  it('never sends the same event twice, also under a new id', () => {
    const delivered = [{ userId: 'u1', quakeId: 'emsc:x', time: NOW - 5 * 60_000 + 20_000, lat: 35.75, lon: 139.75 }];
    expect(matchAlerts([q({})], [r()], delivered, NOW)).toHaveLength(0);
    expect(matchAlerts([q({})], [r()], [{ ...delivered[0], quakeId: 'usgs:a', lat: 0, lon: 0 }], NOW)).toHaveLength(0);
    // Two separate events in one run both go out; another user's history does not matter.
    expect(matchAlerts([q({}), q({ id: 'usgs:b', time: NOW - 60_000, lat: 34.0, lon: 139.0 })], [r()], [{ ...delivered[0], userId: 'u2' }], NOW)).toHaveLength(2);
  });
  it('needs a device and a location', () => {
    expect(matchAlerts([q({})], [r({ devices: [] })], [], NOW)).toHaveLength(0);
    expect(matchAlerts([q({})], [r({ locations: [] })], [], NOW)).toHaveLength(0);
  });
  it('alerts for chosen countries and regions far from saved places', () => {
    const far = q({ id: 'usgs:cl', lat: -33.4, lon: -70.6 });               // Chile, far from Tokyo
    const areaOf = (x: Quake) => (x.id === 'usgs:cl' ? { country: 'cl', region: 'south_america' } : { country: 'jp', region: 'east_asia' });
    const byCountry = matchAlerts([far], [r({ countries: ['cl'] })], [], NOW, areaOf);
    expect(byCountry).toHaveLength(1);
    expect(byCountry[0].place).toBeNull();
    expect(byCountry[0].area).toEqual({ kind: 'country', code: 'cl' });
    expect(matchAlerts([far], [r({ regions: ['south_america'] })], [], NOW, areaOf)[0].area).toEqual({ kind: 'region', code: 'south_america' });
    expect(matchAlerts([far], [r({ countries: ['pe'], regions: ['europe'] })], [], NOW, areaOf)).toHaveLength(0);
    // Areas still respect the minimum magnitude, and work without any saved place.
    expect(matchAlerts([q({ ...far, mag: 4 })], [r({ countries: ['cl'] })], [], NOW, areaOf)).toHaveLength(0);
    expect(matchAlerts([far], [r({ locations: [], countries: ['cl'] })], [], NOW, areaOf)).toHaveLength(1);
    // Near a saved place wins: the message names the place.
    const near = matchAlerts([q({})], [r({ countries: ['jp'] })], [], NOW, areaOf)[0];
    expect(near.place?.name).toBe('Tokyo'); expect(near.area).toBeNull();
  });
});
