// Play Store posts on Bluesky (lib/promo.ts). Administrators only.
// GET   /api/admin/promo                         — settings, progress this round, recent posts, posts and languages
// GET   /api/admin/promo?post=<id>&locale=<l>     — the post as it would be published (text, alt text, picture)
// PATCH /api/admin/promo { enabled }             — daily automatic posting on/off (on: the first post today, random time)
// POST  /api/admin/promo { post?, locale? }      — post now (random unused combination unless chosen); counts as today's
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { blueskySource } from '@/lib/bluesky';
import { draftPromo, firstSlot, isPromoId, isPromoLocale, postPromoNow, promoSettings, PROMO_IDS, PROMO_LOCALES, PROMO_TOTAL, usedCombos, type PromoRow } from '@/lib/promo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const q = req.nextUrl.searchParams;
  if (q.has('post')) {
    const post = q.get('post'), locale = q.get('locale');
    if (!isPromoId(post) || !isPromoLocale(locale)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const d = draftPromo(post, locale);
    const graphemes = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(d.text)].length;
    return NextResponse.json({ text: d.text, alt: d.alt, image: d.image, graphemes });
  }
  const s = await promoSettings(a.db);
  if (!s) return NextResponse.json({ error: 'not_set_up' }, { status: 501 });
  const [used, recent, source] = await Promise.all([
    usedCombos(a.db, s.cycle),
    a.db.from('promo_posts').select('id, cycle, post_id, locale, status, error, post_url, manual, created_at').order('created_at', { ascending: false }).limit(30),
    blueskySource(a.db),
  ]);
  return NextResponse.json({
    configured: !!source,
    settings: { enabled: s.enabled, nextAt: s.next_at, cycle: s.cycle },
    progress: { posted: used.size, total: PROMO_TOTAL },
    posts: PROMO_IDS, locales: PROMO_LOCALES,
    used: [...used],
    recent: (recent.data ?? []) as PromoRow[],
  });
}

export async function PATCH(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { enabled } = (await req.json().catch(() => ({}))) as { enabled?: unknown };
  if (typeof enabled !== 'boolean') return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const s = await promoSettings(a.db);
  if (!s) return NextResponse.json({ error: 'not_set_up' }, { status: 501 });
  const now = Date.now();
  const keep = s.next_at && Date.parse(s.next_at) > now;
  const next_at = enabled ? (keep ? s.next_at : new Date(firstSlot(now)).toISOString()) : null;
  const { error } = await a.db.from('promo_settings').update({ enabled, next_at, updated_at: new Date(now).toISOString(), updated_by: a.user.id }).eq('id', 1);
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  return NextResponse.json({ enabled, nextAt: next_at });
}

export async function POST(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!(await blueskySource(a.db))) return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  const body = (await req.json().catch(() => ({}))) as { post?: unknown; locale?: unknown };
  if ((body.post != null && !isPromoId(body.post)) || (body.locale != null && !isPromoLocale(body.locale))) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const r = await postPromoNow(a.db, { post: isPromoId(body.post) ? body.post : undefined, locale: isPromoLocale(body.locale) ? body.locale : undefined }, { by: a.user.id, origin: req.nextUrl.origin });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.error === 'not_configured' ? 501 : 502 });
  return NextResponse.json({ url: r.url, image: r.image, post: r.post, locale: r.locale });
}
