// Country (for the flag) and world region (for the region filter) of each event, worked out on the server for
// GET /api/quakes so phones don't run the point-in-polygon and nearest-coast searches for every event.
// Remembered per event and position, so each new request only computes the new events.
import { countryAt } from '../country';
import { worldRegion } from '../world-region-of';
import type { Quake } from './types';

const cache = new Map<string, Pick<Quake, 'country' | 'worldRegion'>>();
const MAX = 20_000;

export function withPlaceInfo<T extends Quake>(list: T[]): T[] {
  if (cache.size > MAX) cache.clear();
  return list.map(q => {
    const key = `${q.id}:${q.lat}:${q.lon}`;
    let info = cache.get(key);
    if (!info) { info = { country: countryAt(q.lat, q.lon), worldRegion: worldRegion(q.lat, q.lon) }; cache.set(key, info); }
    return { ...q, ...info };
  });
}
