import { describe, expect, it } from 'vitest';
import { hasRelativePlace, MAX_KM, nearestPlaceText, withNearestPlace } from './nearest-place';
import type { Quake } from './types';

const q = (o: Partial<Quake>): Quake => ({ id: 'emsc:1', source: 'emsc', mag: 3, title: 'POTOSI, BOLIVIA', region: 'Potosi, Bolivia', time: 0, lat: -20.9, lon: -66.9, depthKm: 160, tsunami: false, ...o });
const towns = [{ name: 'Alpha', lat: 0, lon: 0 }, { name: 'Beta', lat: 1, lon: 0 }];

describe('nearest place', () => {
  it('recognises titles that already give distance and direction', () => {
    expect(hasRelativePlace('17 km NW of Ocotillo')).toBe(true);
    expect(hasRelativePlace('5 km north-west of Seddon')).toBe(true);
    expect(hasRelativePlace('POTOSI, BOLIVIA')).toBe(false);
    expect(hasRelativePlace('Off the coast of Ibaraki')).toBe(false);
  });
  it('gives distance and the compass point of the event as seen from the nearest town', () => {
    expect(nearestPlaceText(0.2, 0, towns)).toBe('22 km N of Alpha');
    expect(nearestPlaceText(0.6, 0.3, towns)).toBe('56 km SE of Beta');
    expect(nearestPlaceText(-0.2, -0.2, towns)).toBe('31 km SW of Alpha');
    expect(nearestPlaceText(20, 20, towns)).toBeNull(); // nothing within MAX_KM
    expect(MAX_KM).toBe(300);
  });
  it('rewrites only titles without a distance, using the real town list', () => {
    const [emsc, usgs] = withNearestPlace([q({}), q({ id: 'usgs:1', source: 'usgs', title: '17 km NW of Ocotillo' })]);
    expect(emsc.title).toMatch(/^\d+ km (N|NNE|NE|ENE|E|ESE|SE|SSE|S|SSW|SW|WSW|W|WNW|NW|NNW) of \S/);
    expect(emsc.region).toBe('Potosi, Bolivia');
    expect(usgs.title).toBe('17 km NW of Ocotillo');
    const [far] = withNearestPlace([q({ title: 'SOUTH PACIFIC OCEAN', lat: -45, lon: -130 })]);
    expect(far.title).toBe('SOUTH PACIFIC OCEAN');
  });
});
