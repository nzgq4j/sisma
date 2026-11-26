import { describe, expect, it } from 'vitest';
import { hasRelativePlace, MAX_KM, nearestPlaceText, TownIndex, withNearestPlace } from './nearest-place';
import type { Quake } from './types';

const q = (o: Partial<Quake>): Quake => ({ id: 'emsc:1', source: 'emsc', mag: 3, title: 'POTOSI, BOLIVIA', region: 'Potosi, Bolivia', time: 0, lat: -20.9, lon: -66.9, depthKm: 160, tsunami: false, ...o });
const towns = new TownIndex([
  { name: 'Alpha', lat: 0, lon: 0, cc: 'AA' }, { name: 'Beta', lat: 1, lon: 0, cc: 'BB' },
  { name: 'Gamma', lat: 0, lon: 179.9, cc: 'CC' },
]);

describe('nearest place', () => {
  it('recognises titles that already give distance and direction', () => {
    expect(hasRelativePlace('17 km NW of Ocotillo')).toBe(true);
    expect(hasRelativePlace('5 km north-west of Seddon')).toBe(true);
    expect(hasRelativePlace('POTOSI, BOLIVIA')).toBe(false);
    expect(hasRelativePlace('Off the coast of Ibaraki')).toBe(false);
  });
  it('gives distance and the compass point of the event as seen from the nearest town', () => {
    expect(nearestPlaceText(0.2, 0, null, towns)).toBe('22 km N of Alpha');
    expect(nearestPlaceText(0.6, 0.3, null, towns)).toBe('56 km SE of Beta');
    expect(nearestPlaceText(-0.2, -0.2, null, towns)).toBe('31 km SW of Alpha');
    expect(nearestPlaceText(20, 20, null, towns)).toBeNull(); // nothing within MAX_KM
    expect(MAX_KM).toBe(300);
  });
  it('prefers a town in the event’s own country, else the nearest anywhere', () => {
    expect(nearestPlaceText(0.6, 0, 'aa', towns)).toBe('67 km N of Alpha'); // Beta is nearer but in another country
    expect(nearestPlaceText(0.6, 0, 'zz', towns)).toBe('44 km S of Beta'); // no town in that country: nearest
  });
  it('finds towns across the 180° meridian', () => {
    expect(nearestPlaceText(0, -179.9, null, towns)).toBe('22 km E of Gamma');
  });
  it('rewrites only titles without a distance, using the GeoNames towns and the event’s country', () => {
    const [emsc, usgs] = withNearestPlace([q({}), q({ id: 'usgs:1', source: 'usgs', title: '17 km NW of Ocotillo' })]);
    expect(emsc.title).toMatch(/^\d+ km (N|NNE|NE|ENE|E|ESE|SE|SSE|S|SSW|SW|WSW|W|WNW|NW|NNW) of \S/);
    expect(emsc.region).toBe('Potosi, Bolivia');
    expect(usgs.title).toBe('17 km NW of Ocotillo');
    // Albania near the North Macedonian border: an Albanian town, not Bitola.
    const [al] = withNearestPlace([q({ title: 'ALBANIA', region: 'Albania', lat: 41.0, lon: 20.4 })]);
    expect(al.title).not.toMatch(/Bitola/);
    const [far] = withNearestPlace([q({ title: 'SOUTH PACIFIC OCEAN', lat: -45, lon: -130 })]);
    expect(far.title).toBe('SOUTH PACIFIC OCEAN');
  });
});
