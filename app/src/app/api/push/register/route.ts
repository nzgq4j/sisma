// POST /api/push/register { kind: 'fcm' | 'webpush', token, locale, units } — saves this device for the signed-in user.
// DELETE /api/push/register { token } — removes it (signing out, turning notifications off).
// A token moves to whoever registers it last (a shared device belongs to the account signed in on it).
import { NextResponse, type NextRequest } from 'next/server';
import { adminClient, userForRequest } from '@/lib/auth';
import { asLocale } from '@/i18n/server';

function validToken(kind: unknown, token: unknown): token is string {
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) return false;
  if (kind === 'fcm') return /^[\w:.-]+$/.test(token);
  if (kind !== 'webpush') return false;
  try {
    const s = JSON.parse(token) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
    return typeof s.endpoint === 'string' && s.endpoint.startsWith('https://') && typeof s.keys?.p256dh === 'string' && typeof s.keys?.auth === 'string';
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const db = adminClient(), user = await userForRequest(req);
  if (!db || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { kind?: string; token?: string; locale?: string; units?: string };
  if (!validToken(b.kind, b.token)) return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  const row = { user_id: user.id, kind: b.kind, token: b.token, locale: asLocale(b.locale), units: b.units === 'mi' ? 'mi' : 'km', updated_at: new Date().toISOString() };
  const { error } = await db.from('push_tokens').upsert(row, { onConflict: 'token' });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  // Keep at most 10 devices per account (oldest first out).
  const { data } = await db.from('push_tokens').select('id').eq('user_id', user.id).order('updated_at', { ascending: false });
  if (data && data.length > 10) await db.from('push_tokens').delete().in('id', data.slice(10).map(d => d.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const db = adminClient(), user = await userForRequest(req);
  if (!db || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (typeof token !== 'string') return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  await db.from('push_tokens').delete().eq('user_id', user.id).eq('token', token);
  return NextResponse.json({ ok: true });
}
