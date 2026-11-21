// Tsunami part of the per-minute job: store new official messages (poll.ts) and push those that say there may be a
// hazard (warning, threat, watch, advisory; not information statements or JMA forecasts) to everyone with notifications
// on and a saved place within PUSH_KM of the earthquake, free or sisma+ (public.tsunami_recipients). One push per person,
// incident and level (tsunami_deliveries); quiet hours do not apply. Messages issued more than PUSH_MAX_AGE ago are only
// stored, so a first run or a late feed never sends old news.
import type { SupabaseClient } from '@supabase/supabase-js';
import { asLocale, serverMessages, type Messages } from '@/i18n/server';
import { sendPush } from '@/lib/alerts/send';
import type { AlertDevice } from '@/lib/alerts/match';
import { formatDistance, placeName, type PushMessage } from '@/lib/alerts/message';
import type { Quake } from '@/lib/quakes/types';
import { pollTsunami } from './poll';
import { incidents, matches } from './alerts';
import { TSUNAMI_HAZARD, type TsunamiMessage } from './types';

export const PUSH_KM = 1000;
export const PUSH_MAX_AGE = 2 * 3600_000;

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

/** Notification text in the device's language (pure; tested). */
export function tsunamiMessage(m: TsunamiMessage, quakeId: string | null, place: { name: string; km: number }, t: Messages, locale: string, units: 'km' | 'mi'): PushMessage {
  const level = t.tsu[`lv_${m.level}` as keyof Messages["tsu"]] as string;
  const mag = m.mag == null ? '' : new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(m.mag);
  return {
    title: fill(t.notif.tsunami_title, { level, center: m.center }),
    body: fill(mag ? t.notif.tsunami_body : t.notif.tsunami_body_nomag, { mag, region: m.place, dist: formatDistance(place.km, units, locale), place: placeName(place.name, t.notif) }),
    url: quakeId ? `/app/map?focus=${encodeURIComponent(quakeId)}` : m.url,
    tag: `tsunami-${m.incident}`,
  };
}

/** Whether a new message should be pushed. */
export const pushable = (m: TsunamiMessage, now: number) =>
  TSUNAMI_HAZARD.has(m.level) && !m.cancelled && now - m.issued <= PUSH_MAX_AGE && m.lat != null && m.lon != null;

interface RecipientRow { user_id: string; place: string; km: number; devices: AlertDevice[] | null }

export async function runTsunami(db: SupabaseClient, quakes: Quake[], now = Date.now()) {
  const { added, errors } = await pollTsunami(db, now);
  let sent = 0;
  const gone = new Set<string>();
  for (const m of added.filter(x => pushable(x, now))) {
    const inc = incidents([m], now)[0];
    const quake = quakes.find(q => matches(q, inc)) ?? null;
    const { data, error } = await db.rpc('tsunami_recipients', { p_lat: m.lat, p_lon: m.lon, p_km: PUSH_KM });
    if (error) { errors.push('recipients'); continue; }
    for (const r of (data ?? []) as RecipientRow[]) {
      const { error: claim } = await db.from('tsunami_deliveries').insert({ user_id: r.user_id, incident: m.incident, level: m.level });
      if (claim) continue; // already told about this incident at this level
      await Promise.all((r.devices ?? []).map(async d => {
        const locale = asLocale(d.locale);
        const t = await serverMessages(locale);
        const res = await sendPush(d, tsunamiMessage(m, quake?.id ?? null, { name: r.place, km: r.km }, t, locale, d.units));
        if (res === 'ok') sent++;
        if (res === 'gone') gone.add(d.id);
      }));
    }
  }
  if (gone.size) await db.from('push_tokens').delete().in('id', [...gone]);
  return { added: added.length, sent, removed: gone.size, errors };
}
