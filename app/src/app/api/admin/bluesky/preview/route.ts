// GET /api/admin/bluesky/preview?id=<quake id> — the post exactly as it would be published (text, alt text, link) and
// the card image URL. Administrators only.
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { findQuake } from '@/lib/quakes/find';
import { draftPost } from '@/lib/bluesky';
import { withTsunami } from '@/lib/tsunami/attach';
import { loadShareFelt, shareGrid } from '@/lib/share-felt';
import { feltAltEn, feltMarks } from '@/lib/felt-layers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  const found = id ? await findQuake(id, 7) : null;
  const q = found ? (await withTsunami([found]))[0] : null;
  if (!q) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const d = draftPost(q);
  // The felt layers the card will draw, so the alt text matches the published one (lib/bluesky.ts cardAlt).
  const layers = feltMarks(shareGrid(await loadShareFelt(q)));
  const alt = layers.length ? `${d.alt} ${feltAltEn(layers)}` : d.alt;
  const graphemes = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(d.text)].length;
  return NextResponse.json({ text: d.text, alt, url: d.url, graphemes, image: `/api/share-card?id=${encodeURIComponent(q.id)}&locale=en&units=km&tz=UTC` });
}
