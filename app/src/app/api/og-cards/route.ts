import { NextResponse } from 'next/server';
import { ARTICLE_IDS, CARDS, articleCard } from '@/lib/seo';

// GET /api/og-cards — the card texts for scripts/og-cards.mjs. Only on a local server started with OG_CARDS=1.
export function GET() {
  if (process.env.OG_CARDS !== '1') return new NextResponse(null, { status: 404 });
  const cards = { ...CARDS, ...Object.fromEntries(ARTICLE_IDS.map(id => [`science-${id}`, articleCard(id)])) };
  return NextResponse.json(cards);
}
