// GET /api/admin/x/preview?id=<quake id> — the X post exactly as it would be published (text, alt text, length as X
// counts it) and the card image URL. Administrators only.
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { findQuake } from '@/lib/quakes/find';
import { draftXPost, X_MAX_WEIGHT } from '@/lib/x';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  const q = id ? await findQuake(id, 7) : null;
  if (!q) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const d = draftXPost(q);
  return NextResponse.json({ text: d.text, alt: d.alt, url: d.url, graphemes: d.length, max: X_MAX_WEIGHT, image: `/api/share-card?id=${encodeURIComponent(q.id)}&locale=en&units=km&tz=UTC` });
}
