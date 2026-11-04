// POST /api/play/verify { purchaseToken } with Authorization: Bearer <Supabase access token>.
// Called by the Android app after a Google Play purchase or a restore: reads the purchase from Google, checks it was
// made for this account, acknowledges it and records it (lib/play.ts). The client is never trusted for the plan.
import { NextResponse, type NextRequest } from 'next/server';
import { adminClient, userForRequest } from '@/lib/auth';
import { playConfigured, syncPlayPurchase } from '@/lib/play';

export async function POST(req: NextRequest) {
  const db = adminClient(), user = await userForRequest(req);
  if (!playConfigured() || !db) return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { purchaseToken } = (await req.json().catch(() => ({}))) as { purchaseToken?: unknown };
  if (typeof purchaseToken !== 'string' || !purchaseToken || purchaseToken.length > 1000) return NextResponse.json({ error: 'bad_token' }, { status: 400 });
  try {
    const r = await syncPlayPurchase(db, purchaseToken, user.id);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.error === 'not_found' ? 404 : 409 });
    return NextResponse.json({ plan: r.plan, status: r.status });
  } catch (e) {
    console.error('play verify', e);
    return NextResponse.json({ error: 'play_unavailable' }, { status: 502 });
  }
}
