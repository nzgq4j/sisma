// GET /api/admin/bluesky — settings, whether Bluesky is configured, recent events (last 24 h, M4.5+) and the post log.
// PATCH /api/admin/bluesky { enabled?, minMagnitude? } — change the settings. Administrators only (lib/admin.ts).
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { recentQuakes } from '@/lib/quakes/find';
import { alreadyPosted, autoCandidates, blueskySource, type PostRow } from '@/lib/bluesky';

export const dynamic = 'force-dynamic';
const MAGS = [4.5, 5, 5.5, 6, 6.5, 7, 7.5];

export async function GET(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const now = Date.now();
  const [settings, posts, quakes, source] = await Promise.all([
    a.db.from('bluesky_settings').select('enabled, min_magnitude, updated_at, account_handle, connected_at, last_error').eq('id', 1).maybeSingle(),
    a.db.from('bluesky_posts').select('quake_id, quake_time, lat, lon, mag, place, status, error, post_url, manual, created_at').order('created_at', { ascending: false }).limit(50),
    recentQuakes(1),
    blueskySource(a.db),
  ]);
  const rows = (posts.data ?? []) as (PostRow & { place: string | null })[];
  const min = Number(settings.data?.min_magnitude ?? 6);
  const next = new Set(autoCandidates(quakes, min, rows, now).map(q => q.id));
  const recent = quakes.filter(q => now - q.time <= 864e5 && q.mag >= 4.5).sort((x, y) => y.time - x.time).slice(0, 40)
    .map(q => ({ id: q.id, time: q.time, mag: q.mag, place: q.region || q.title, posted: alreadyPosted(q, rows.filter(r => r.status !== 'failed')), next: next.has(q.id) }));
  return NextResponse.json({
    configured: !!source,
    // Where posting credentials come from: the account signed in on this page, or the server env (fallback).
    connection: {
      source,
      handle: source === 'account' ? settings.data?.account_handle ?? null : null,
      connectedAt: source === 'account' ? settings.data?.connected_at ?? null : null,
      lastError: settings.data?.last_error ?? null,
      envAvailable: !!(process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD),
    },
    settings: { enabled: !!settings.data?.enabled, minMagnitude: min, updatedAt: settings.data?.updated_at ?? null },
    mags: MAGS, recent, posts: rows,
  });
}

export async function PATCH(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { enabled?: unknown; minMagnitude?: unknown };
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: a.user.id };
  if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
  if (body.minMagnitude !== undefined) {
    if (typeof body.minMagnitude !== 'number' || !MAGS.includes(body.minMagnitude)) return NextResponse.json({ error: 'bad_magnitude' }, { status: 400 });
    patch.min_magnitude = body.minMagnitude;
  }
  const { error } = await a.db.from('bluesky_settings').update(patch).eq('id', 1);
  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
