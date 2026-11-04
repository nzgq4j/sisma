// POST /api/admin/bluesky/post { id } — post one event now (also retries a failed post). Administrators only.
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { findQuake } from '@/lib/quakes/find';
import { blueskyConfigured, postQuake } from '@/lib/bluesky';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!blueskyConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: unknown };
  const q = typeof id === 'string' ? await findQuake(id, 7) : null;
  if (!q) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const r = await postQuake(a.db, q, { manual: true, by: a.user.id });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.error === 'already_posted' ? 409 : 502 });
  return NextResponse.json({ url: r.url, image: r.image });
}
