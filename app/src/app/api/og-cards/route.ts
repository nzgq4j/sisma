import { NextResponse } from 'next/server';
import { ARTICLE_IDS, CARDS, LIBRARY_IDS, articleCard, libraryCard } from '@/lib/seo';

// GET /api/og-cards — the card texts for scripts/og-cards.mjs. Only on a local server started with OG_CARDS=1.
export function GET() {
  if (process.env.OG_CARDS !== '1') return new NextResponse(null, { status: 404 });
  const cards = { ...CARDS, ...Object.fromEntries(ARTICLE_IDS.map(id => [`science-${id}`, articleCard(id)])),
    ...Object.fromEntries(LIBRARY_IDS.map(id => [`library-${id}`, libraryCard(id)])) };
  return NextResponse.json(cards);
}
