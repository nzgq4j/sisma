// Notification text for an alert, in the device's language and units (pure; tested in message.test.ts).
import { KM_PER_MI, type Units } from '../units';
import type { Quake } from '../quakes/types';

export interface PushStrings { title_near: string; title_any: string; body: string }
export interface PushMessage { title: string; body: string; url: string; tag: string }

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

export function formatDistance(km: number, units: Units, locale: string): string {
  const v = units === 'mi' ? km / KM_PER_MI : km;
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: v < 10 ? 1 : 0 }).format(v < 10 ? v : Math.round(v / (v < 100 ? 1 : 5)) * (v < 100 ? 1 : 5));
  return `${n} ${units}`;
}

export function alertMessage(q: Quake, place: { name: string; distanceKm: number } | null, strings: PushStrings, locale: string, units: Units): PushMessage {
  const mag = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(q.mag);
  const title = place
    ? fill(strings.title_near, { mag, dist: formatDistance(place.distanceKm, units, locale), place: place.name })
    : fill(strings.title_any, { mag });
  const body = fill(strings.body, { region: q.region, depth: formatDistance(q.depthKm, units, locale) });
  return { title, body, url: `/app/map?focus=${encodeURIComponent(q.id)}`, tag: `quake-${q.id}` };
}
