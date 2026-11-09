import type { Quake, SourceId } from './types';
import { distanceKm } from '../geo';

const PRIORITY: SourceId[] = ['usgs', 'emsc'];
function rank(q: Quake): number {
  if (q.source === 'jma' && q.region === 'Japan') return 0;
  if (q.source === 'geonet' && q.region === 'New Zealand') return 0;
  const i = PRIORITY.indexOf(q.source);
  return i < 0 ? 9 : i + 1;
}

/** True when `id` is the event's id or the id another agency gave the same event (Quake.otherIds): a link or list
 *  made a minute ago may still hold the EMSC id of an event that now carries the USGS id. */
export const hasId = (q: Pick<Quake, 'id' | 'otherIds'>, id: string) => q.id === id || (q.otherIds?.includes(id) ?? false);

/** Collapses the same event reported by several agencies (within 90 s and 100 km). */
export function mergeQuakes(lists: Quake[][]): Quake[] {
  const all = lists.flat().sort((a, b) => a.time - b.time);
  const out: Quake[] = [];
  for (const q of all) {
    const dup = out.find(o => Math.abs(o.time - q.time) < 90_000 && distanceKm(o.lat, o.lon, q.lat, q.lon) < 100);
    if (!dup) { out.push({ ...q, alsoIn: [], otherIds: [] }); continue; }
    const winner = rank(q) < rank(dup) ? q : dup, loser = winner === q ? dup : q;
    const merged: Quake = { ...winner, felt: winner.felt ?? loser.felt, cdi: winner.cdi ?? loser.cdi, tsunami: winner.tsunami || loser.tsunami,
      alsoIn: Array.from(new Set([...(dup.alsoIn ?? []), loser.source])),
      otherIds: Array.from(new Set([...(dup.otherIds ?? []), loser.id, ...(loser.otherIds ?? [])])).filter(i => i !== winner.id) };
    out[out.indexOf(dup)] = merged;
  }
  return out.sort((a, b) => b.time - a.time);
}
