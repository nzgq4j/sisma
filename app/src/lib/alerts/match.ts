// Matches new earthquakes to sisma+ alert settings (pure; used by POST /api/cron/alerts and tested in match.test.ts).
// A user gets one alert per event: the quake must be recent, at or above their minimum magnitude, and within their
// radius of any saved location (radius 0 = anywhere). The same event under a new id (another agency's solution won
// the merge) is recognised by time and distance, like lib/quakes/merge.ts.
import { distanceKm } from '../geo';
import type { Quake } from '../quakes/types';

export interface AlertDevice { id: string; kind: 'fcm' | 'webpush'; token: string; locale: string; units: 'km' | 'mi' }
export interface AlertRecipient {
  userId: string; minMagnitude: number; radiusKm: number;
  locations: { name: string; lat: number; lon: number }[];
  devices: AlertDevice[];
}
export interface Delivered { userId: string; quakeId: string; time: number; lat: number; lon: number }
export interface Alert { userId: string; quake: Quake; place: { name: string; distanceKm: number } | null; devices: AlertDevice[] }

/** Only events this recent are alerted (older ones are news, not alerts — and this avoids a burst on first run). */
export const ALERT_MAX_AGE_MS = 30 * 60_000;
const SAME_EVENT_MS = 90_000, SAME_EVENT_KM = 100;

export function matchAlerts(quakes: Quake[], recipients: AlertRecipient[], delivered: Delivered[], now: number): Alert[] {
  const recent = quakes.filter(q => q.time <= now + 60_000 && now - q.time <= ALERT_MAX_AGE_MS);
  const out: Alert[] = [];
  for (const r of recipients) {
    if (!r.devices.length || !r.locations.length) continue;
    const seen = delivered.filter(d => d.userId === r.userId);
    for (const q of recent) {
      if (q.mag < r.minMagnitude) continue;
      if (seen.some(d => d.quakeId === q.id || (Math.abs(d.time - q.time) < SAME_EVENT_MS && distanceKm(d.lat, d.lon, q.lat, q.lon) < SAME_EVENT_KM))) continue;
      const nearest = r.locations
        .map(l => ({ name: l.name, distanceKm: distanceKm(l.lat, l.lon, q.lat, q.lon) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)[0];
      if (r.radiusKm > 0 && nearest.distanceKm > r.radiusKm) continue;
      out.push({ userId: r.userId, quake: q, place: nearest, devices: r.devices });
      seen.push({ userId: r.userId, quakeId: q.id, time: q.time, lat: q.lat, lon: q.lon });
    }
  }
  return out;
}
