import { SOURCES } from './sources';
import { mergeQuakes } from './merge';
import type { Quake } from './types';

/** Merged feed of the last `days` days from every source (source responses are cached for 60 s). */
export async function recentQuakes(days = 7): Promise<Quake[]> {
  const results = await Promise.allSettled([
    SOURCES.usgs({ days, minMag: 2.5 }), SOURCES.emsc({ days, minMag: 2.5 }),
    SOURCES.geonet({ days, minMag: 0 }), SOURCES.jma({ days, minMag: 0 }),
  ]);
  return mergeQuakes(results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : [])));
}

/** Finds a quake by id in the merged feed of the last `days` days. */
export async function findQuake(id: string, days = 7): Promise<Quake | null> {
  return (await recentQuakes(days)).find(q => q.id === id) ?? null;
}
