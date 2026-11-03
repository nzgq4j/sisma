// Matches new earthquakes to sisma+ alert settings (pure; used by POST /api/cron/alerts and tested in match.test.ts).
// A user gets one alert per event: the quake must be recent, at or above their minimum magnitude, and either within
// their radius of any saved location (radius 0 = anywhere) or in one of the countries / world regions they chose.
// The same event under a new id (another agency's solution won the merge) is recognised by time and distance, like
// lib/quakes/merge.ts.
import { distanceKm } from '../geo';
import type { Quake } from '../quakes/types';

export interface AlertDevice { id: string; kind: 'fcm' | 'webpush'; token: string; locale: string; units: 'km' | 'mi' }
export interface AlertRecipient {
  userId: string; minMagnitude: number; radiusKm: number;
  locations: { name: string; lat: number; lon: number }[];
  /** ISO alpha-2 codes (lowercase) and world regions (lib/world-regions.ts) to alert for wherever the user is. */
  countries?: string[]; regions?: string[];
  devices: AlertDevice[];
}
/** Country (in or within 300 km) and world region of an event, worked out by the caller (lib/country, lib/world-regions). */
export interface QuakeArea { country: string | null; region: string }
export type AlertArea = { kind: 'country' | 'region'; code: string };
export interface Delivered { userId: string; quakeId: string; time: number; lat: number; lon: number }
export interface Alert {
  userId: string; quake: Quake; devices: AlertDevice[];
  /** Nearest saved place within the radius (or anywhere); null when the alert is for a chosen country/region only. */
  place: { name: string; distanceKm: number } | null;
  /** The chosen country or region the event is in, when that is why it was sent. */
  area: AlertArea | null;
}

/** Only events this recent are alerted (older ones are news, not alerts — and this avoids a burst on first run). */
export const ALERT_MAX_AGE_MS = 30 * 60_000;
const SAME_EVENT_MS = 90_000, SAME_EVENT_KM = 100;

export function matchAlerts(quakes: Quake[], recipients: AlertRecipient[], delivered: Delivered[], now: number,
  areaOf: (q: Quake) => QuakeArea = () => ({ country: null, region: '' })): Alert[] {
  const recent = quakes.filter(q => q.time <= now + 60_000 && now - q.time <= ALERT_MAX_AGE_MS);
  const out: Alert[] = [];
  const areas = new Map<string, QuakeArea>();
  const area = (q: Quake) => { let a = areas.get(q.id); if (!a) { a = areaOf(q); areas.set(q.id, a); } return a; };
  for (const r of recipients) {
    const countries = r.countries ?? [], regions = r.regions ?? [];
    if (!r.devices.length || (!r.locations.length && !countries.length && !regions.length)) continue;
    const seen = delivered.filter(d => d.userId === r.userId);
    for (const q of recent) {
      if (q.mag < r.minMagnitude) continue;
      if (seen.some(d => d.quakeId === q.id || (Math.abs(d.time - q.time) < SAME_EVENT_MS && distanceKm(d.lat, d.lon, q.lat, q.lon) < SAME_EVENT_KM))) continue;
      const nearest = r.locations
        .map(l => ({ name: l.name, distanceKm: distanceKm(l.lat, l.lon, q.lat, q.lon) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)[0];
      const byPlace = !!nearest && (r.radiusKm === 0 || nearest.distanceKm <= r.radiusKm);
      let byArea: AlertArea | null = null;
      if (!byPlace && (countries.length || regions.length)) {
        const a = area(q);
        if (a.country && countries.includes(a.country)) byArea = { kind: 'country', code: a.country };
        else if (regions.includes(a.region)) byArea = { kind: 'region', code: a.region };
      }
      if (!byPlace && !byArea) continue;
      out.push({ userId: r.userId, quake: q, place: byPlace ? nearest : null, area: byArea, devices: r.devices });
      seen.push({ userId: r.userId, quakeId: q.id, time: q.time, lat: q.lat, lon: q.lon });
    }
  }
  return out;
}
