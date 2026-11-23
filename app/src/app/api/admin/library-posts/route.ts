// In Depth posts on Bluesky in 10 languages (lib/library-posts.ts). Administrators only.
// GET   /api/admin/library-posts                              — settings, progress this round, recent posts, articles and languages
// GET   /api/admin/library-posts?article=<id>&locale=<l>       — the post as it would be published (text, alt text, picture)
// PATCH /api/admin/library-posts { enabled }                  — twice-daily posting on/off (on: the first post in this half-day)
// POST  /api/admin/library-posts { article?, locale? }        — post now (random unused combination unless chosen)
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { blueskySource, graphemes } from '@/lib/bluesky';
import { LIBRARY } from '@/lib/library';
import {
  draftLibraryPostIn, firstSlot, isLibraryId, isLibraryPostLocale, libraryPostSettings, libraryPostTotal, LIBRARY_POST_LOCALES,
  postLibraryNow, usedCombos, type LibraryPostRow,
} from '@/lib/library-posts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const q = req.nextUrl.searchParams;
  if (q.has('article')) {
    const article = q.get('article'), locale = q.get('locale');
    if (!isLibraryId(article) || !isLibraryPostLocale(locale)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const d = draftLibraryPostIn(article, locale);
    return NextResponse.json({ text: d.text, alt: d.alt, image: d.image, url: d.url, graphemes: graphemes(d.text) });
  }
  const s = await libraryPostSettings(a.db);
  if (!s) return NextResponse.json({ error: 'not_set_up' }, { status: 501 });
  const [used, recent, source] = await Promise.all([
    usedCombos(a.db, s.cycle),
    a.db.from('library_posts').select('id, cycle, article_id, locale, status, error, post_url, manual, created_at').order('created_at', { ascending: false }).limit(30),
    blueskySource(a.db),
  ]);
  return NextResponse.json({
    configured: !!source,
    settings: { enabled: s.enabled, nextAt: s.next_at, cycle: s.cycle },
    progress: { posted: used.size, total: libraryPostTotal() },
    articles: LIBRARY.map(x => x.id), locales: LIBRARY_POST_LOCALES,
    used: [...used],
    recent: (recent.data ?? []) as LibraryPostRow[],
  });
}

export async function PATCH(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { enabled } = (await req.json().catch(() => ({}))) as { enabled?: unknown };
  if (typeof enabled !== 'boolean') return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const s = await libraryPostSettings(a.db);
  if (!s) return NextResponse.json({ error: 'not_set_up' }, { status: 501 });
  const now = Date.now();
  const keep = s.next_at && Date.parse(s.next_at) > now;
  const next_at = enabled ? (keep ? s.next_at : new Date(firstSlot(now)).toISOString()) : null;
  const { error } = await a.db.from('library_post_settings').update({ enabled, next_at, updated_at: new Date(now).toISOString(), updated_by: a.user.id }).eq('id', 1);
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  return NextResponse.json({ enabled, nextAt: next_at });
}

export async function POST(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!(await blueskySource(a.db))) return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  const body = (await req.json().catch(() => ({}))) as { article?: unknown; locale?: unknown };
  if ((body.article != null && !isLibraryId(body.article)) || (body.locale != null && !isLibraryPostLocale(body.locale))) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const r = await postLibraryNow(a.db, { article: isLibraryId(body.article) ? body.article : undefined, locale: isLibraryPostLocale(body.locale) ? body.locale : undefined }, { by: a.user.id, origin: req.nextUrl.origin });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.error === 'not_configured' ? 501 : 502 });
  return NextResponse.json({ url: r.url, image: r.image, article: r.article, locale: r.locale });
}
