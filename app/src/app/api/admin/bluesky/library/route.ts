// In Depth articles on Bluesky (posted by hand). Administrators only.
// GET  /api/admin/bluesky/library?id=<article id> — the suggested post: text, alt text, link, card image path.
// POST /api/admin/bluesky/library { id, text, alt } — posts the text as edited, with the article's share card
//      (public/og/library-<id>.jpg, fetched from this deployment) and the alt text; links and #tags become facets.
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { libraryArticle } from '@/lib/library';
import { SITE } from '@/lib/site';
import { blueskySource, detectFacets, draftLibraryPost, libraryCard, postProblem, publishPost } from '@/lib/bluesky';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const a = libraryArticle(req.nextUrl.searchParams.get('id') ?? '');
  if (!a) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const d = draftLibraryPost(a);
  return NextResponse.json({ text: d.text, alt: d.alt, url: d.url, image: d.image });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!(await blueskySource(admin.db))) return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  const body = (await req.json().catch(() => ({}))) as { id?: unknown; text?: unknown; alt?: unknown };
  const a = typeof body.id === 'string' ? libraryArticle(body.id) : null;
  if (!a) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const alt = typeof body.alt === 'string' ? body.alt.trim() : '';
  const problem = postProblem(text, alt);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  // This deployment's copy of the card, else the live site's.
  const image = (await libraryCard(a, req.nextUrl.origin)) ?? (await libraryCard(a, SITE.url));
  try {
    const r = await publishPost(admin.db, { text, facets: detectFacets(text), alt }, image);
    return NextResponse.json({ url: r.url, image: r.image });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message ?? e).slice(0, 300) }, { status: 502 });
  }
}
