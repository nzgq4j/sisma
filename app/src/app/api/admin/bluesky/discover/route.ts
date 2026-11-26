// Discover: geoscience posts by others on Bluesky (lib/bluesky-discover.ts). Administrators only (lib/admin.ts).
// GET   /api/admin/bluesky/discover            — the saved terms and the matching posts, newest first.
// GET   /api/admin/bluesky/discover?terms=1    — the saved terms only (no search).
// PATCH /api/admin/bluesky/discover { terms }  — saves the terms.
// POST  /api/admin/bluesky/discover { action, uri?, cid?, did?, record? } — like, repost or follow (or undo one), by hand.
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { blueskySource } from '@/lib/bluesky';
import { ACTIONS, DEFAULT_TERMS, discover, engage, normalizeTerms, type DiscoverAction } from '@/lib/bluesky-discover';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { data } = await a.db.from('bluesky_settings').select('discover_terms').eq('id', 1).maybeSingle();
  const terms = normalizeTerms(data?.discover_terms) ?? DEFAULT_TERMS;
  if (req.nextUrl.searchParams.get('terms') === '1') return NextResponse.json({ terms });
  if (!(await blueskySource(a.db))) return NextResponse.json({ error: 'not_configured', terms }, { status: 501 });
  if (!terms.length) return NextResponse.json({ terms, handle: null, posts: [], failed: [] });
  try {
    return NextResponse.json({ terms, ...(await discover(a.db, terms)) });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message ?? e).slice(0, 300), terms }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { terms?: unknown };
  const terms = normalizeTerms(body.terms);
  if (!terms) return NextResponse.json({ error: 'bad_terms' }, { status: 400 });
  const { error } = await a.db.from('bluesky_settings').update({ discover_terms: terms, updated_at: new Date().toISOString(), updated_by: a.user.id }).eq('id', 1);
  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  return NextResponse.json({ terms });
}

export async function POST(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!(await blueskySource(a.db))) return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  const b = (await req.json().catch(() => ({}))) as { action?: unknown; uri?: unknown; cid?: unknown; did?: unknown; record?: unknown };
  if (!ACTIONS.includes(b.action as DiscoverAction)) return NextResponse.json({ error: 'bad_action' }, { status: 400 });
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  try {
    const record = await engage(a.db, b.action as DiscoverAction, { uri: str(b.uri), cid: str(b.cid), did: str(b.did), record: str(b.record) });
    return NextResponse.json({ ok: true, record });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    return NextResponse.json({ error: msg.slice(0, 300) }, { status: ['bad_post', 'bad_account', 'bad_record', 'self'].includes(msg) ? 400 : 502 });
  }
}
