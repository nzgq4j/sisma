// POST /api/cron/alerts { ticket } — called every minute by pg_cron (migration 20261103000200_alerts.sql).
// The single-use ticket is checked against the database, so only the scheduled job can trigger a run.
// Matches recent quakes to sisma+ alert settings (lib/alerts/match.ts) and pushes each new match to the user's devices.
import { NextResponse, type NextRequest } from 'next/server';
import { adminClient } from '@/lib/auth';
import { recentQuakes } from '@/lib/quakes/find';
import { matchAlerts, type AlertRecipient, type Delivered } from '@/lib/alerts/match';
import { alertMessage } from '@/lib/alerts/message';
import { sendPush } from '@/lib/alerts/send';
import { asLocale, serverMessages } from '@/i18n/server';
import { countryAt } from '@/lib/country';
import { worldRegion, type WorldRegion } from '@/lib/world-regions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface RecipientRow { user_id: string; min_magnitude: number; radius_km: number; locations: AlertRecipient['locations'] | null; devices: AlertRecipient['devices'] | null; countries: string[] | null; regions: string[] | null }

export async function POST(req: NextRequest) {
  const db = adminClient();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const { ticket } = (await req.json().catch(() => ({}))) as { ticket?: string };
  if (!ticket || !/^[0-9a-f-]{36}$/i.test(ticket)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { data: ok } = await db.rpc('consume_cron_ticket', { ticket });
  if (ok !== true) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: rows, error } = await db.rpc('alert_recipients');
  if (error) return NextResponse.json({ error: 'recipients' }, { status: 500 });
  const recipients: AlertRecipient[] = ((rows ?? []) as RecipientRow[]).map(r => ({
    userId: r.user_id, minMagnitude: Number(r.min_magnitude), radiusKm: r.radius_km, locations: r.locations ?? [], devices: r.devices ?? [],
    countries: r.countries ?? [], regions: r.regions ?? [],
  }));
  if (!recipients.length) return NextResponse.json({ recipients: 0, sent: 0 });

  const now = Date.now();
  const [quakes, past] = await Promise.all([
    recentQuakes(1),
    db.from('alert_deliveries').select('user_id, quake_id, quake_time, lat, lon')
      .in('user_id', recipients.map(r => r.userId)).gte('sent_at', new Date(now - 2 * 3600_000).toISOString()),
  ]);
  const delivered: Delivered[] = (past.data ?? []).map(d => ({ userId: d.user_id, quakeId: d.quake_id, time: Date.parse(d.quake_time), lat: d.lat, lon: d.lon }));
  // Country (in or within 300 km, as for flags) and world region, only worked out for events someone could match.
  const alerts = matchAlerts(quakes, recipients, delivered, now, q => ({ country: countryAt(q.lat, q.lon)?.code ?? null, region: worldRegion(q.lat, q.lon) }));

  let sent = 0;
  const gone = new Set<string>();
  for (const a of alerts) {
    // Claim the (user, quake) pair first: if another run already did, its primary key makes this insert fail.
    const { error: claim } = await db.from('alert_deliveries').insert({
      user_id: a.userId, quake_id: a.quake.id, quake_time: new Date(a.quake.time).toISOString(), lat: a.quake.lat, lon: a.quake.lon, mag: a.quake.mag,
    });
    if (claim) continue;
    await Promise.all(a.devices.map(async d => {
      const locale = asLocale(d.locale);
      const m = await serverMessages(locale);
      const areaName = !a.area ? null : a.area.kind === 'region' ? m.wr[a.area.code as WorldRegion]
        : (() => { try { return new Intl.DisplayNames([locale], { type: 'region' }).of(a.area.code.toUpperCase()) ?? a.area.code.toUpperCase(); } catch { return a.area.code.toUpperCase(); } })();
      const result = await sendPush(d, alertMessage(a.quake, a.place, m.notif, locale, d.units, areaName));
      if (result === 'ok') sent++;
      if (result === 'gone') gone.add(d.id);
    }));
  }
  if (gone.size) await db.from('push_tokens').delete().in('id', [...gone]);
  return NextResponse.json({ recipients: recipients.length, alerts: alerts.length, sent, removed: gone.size });
}
