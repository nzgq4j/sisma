// GET /api/share-card?id=<quake id>&locale=en&units=km&tz=Europe/Rome → 1080×1350 PNG share card (lib/share-card.tsx).
// The event is looked up on the server by id (last 30 days), so a card can only show real data from the feeds.
import type { NextRequest } from 'next/server';
import { hasId, recentQuakes } from '@/lib/quakes/find';
import { shareCardResponse, validTz } from '@/lib/share-card';
import { asLocale } from '@/i18n/server';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('id');
  if (!id) return Response.json({ error: 'missing_id' }, { status: 400 });
  const all = await recentQuakes(30);
  const q = all.find(x => hasId(x, id));
  if (!q) return Response.json({ error: 'not_found' }, { status: 404 });
  return shareCardResponse({
    q, all, locale: asLocale(sp.get('locale')), units: sp.get('units') === 'mi' ? 'mi' : 'km', tz: validTz(sp.get('tz')),
    origin: req.nextUrl.origin,
  });
}
