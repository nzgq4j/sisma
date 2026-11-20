// Turns stored tsunami messages into what the app shows for an earthquake (lib/tsunami/types.ts TsunamiAlert):
// the latest message of each incident decides its level and status, and incidents are matched to earthquakes —
// JMA by its event id (the same id as sisma's jma: quakes), NOAA by origin time and position.
import { distanceKm } from '@/lib/geo';
import { levelRank, type TsunamiAlert, type TsunamiMessage } from './types';

/** A NOAA incident matches an earthquake within this time and distance (preliminary solutions differ between agencies). */
export const MATCH_SECONDS = 120;
export const MATCH_KM = 300;

export interface Incident extends TsunamiAlert { origin: number | null; lat: number | null; lon: number | null; mag: number | null; place: string }

/** The latest message of each incident, with the earthquake details from any of its messages. */
export function incidents(messages: TsunamiMessage[], now: number): Incident[] {
  const by = new Map<string, TsunamiMessage[]>();
  for (const m of messages) by.set(m.incident, [...(by.get(m.incident) ?? []), m]);
  return [...by.entries()].map(([incident, list]) => {
    const sorted = [...list].sort((a, b) => b.issued - a.issued || a.id.localeCompare(b.id));
    const last = sorted[0], quake = sorted.find(m => m.origin != null && m.lat != null && m.lon != null) ?? last;
    const status: TsunamiAlert['status'] = last.cancelled ? 'cancelled'
      : last.level === 'none' || (last.expires != null && last.expires < now) ? 'ended' : 'active';
    return {
      incident, level: last.level, center: last.center, status, title: last.title, issued: last.issued, url: last.url, areas: last.areas,
      origin: quake.origin, lat: quake.lat, lon: quake.lon, mag: quake.mag ?? last.mag, place: quake.place || last.place,
    };
  });
}

interface QuakeLike { id: string; otherIds?: string[]; time: number; lat: number; lon: number }

/** Whether an incident is about this earthquake. */
export function matches(q: QuakeLike, i: Incident): boolean {
  if (i.center === 'JMA' && [q.id, ...(q.otherIds ?? [])].includes(i.incident)) return true;
  if (i.origin == null || i.lat == null || i.lon == null) return false;
  return Math.abs(q.time - i.origin) <= MATCH_SECONDS * 1000 && distanceKm(q.lat, q.lon, i.lat, i.lon) <= MATCH_KM;
}

/** The alert to show for an earthquake: among its incidents, an active one first, then the most serious, then the latest. */
export function alertFor(q: QuakeLike, list: Incident[]): TsunamiAlert | undefined {
  const mine = list.filter(i => matches(q, i));
  if (!mine.length) return undefined;
  mine.sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active') || levelRank(a.level) - levelRank(b.level) || b.issued - a.issued);
  const { incident, level, center, status, title, issued, url, areas } = mine[0];
  return { incident, level, center, status, title, issued, url, areas };
}
