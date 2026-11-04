// GET /api/admin/bluesky/preview?id=<quake id> — the post exactly as it would be published (text, alt text, link) and
// the card image URL. Administrators only.
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { findQuake } from '@/lib/quakes/find';
import { draftPost } from '@/lib/bluesky';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  const q = id ? await findQuake(id, 7) : null;
  if (!q) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const d = draftPost(q);
  const graphemes = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(d.text)].length;
  return NextResponse.json({ text: d.text, alt: d.alt, url: d.url, graphemes, image: `/api/share-card?id=${encodeURIComponent(q.id)}&locale=en&units=km&tz=UTC` });
}
