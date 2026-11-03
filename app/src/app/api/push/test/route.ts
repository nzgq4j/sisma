// POST /api/push/test { token } — sends a test notification to one of the signed-in user's own devices.
import { NextResponse, type NextRequest } from 'next/server';
import { adminClient, userForRequest } from '@/lib/auth';
import { sendPush } from '@/lib/alerts/send';
import type { AlertDevice } from '@/lib/alerts/match';
import { asLocale, serverMessages } from '@/i18n/server';

export async function POST(req: NextRequest) {
  const db = adminClient(), user = await userForRequest(req);
  if (!db || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  const { data } = await db.from('push_tokens').select('id, kind, token, locale, units').eq('user_id', user.id).eq('token', String(token ?? '')).maybeSingle();
  if (!data) return NextResponse.json({ error: 'not_registered' }, { status: 404 });
  const m = await serverMessages(asLocale(data.locale));
  const result = await sendPush(data as AlertDevice, { title: m.notif.test_title, body: m.notif.test_body, url: '/app/me', tag: 'sisma-test' });
  if (result === 'gone') await db.from('push_tokens').delete().eq('id', data.id);
  return NextResponse.json({ result }, { status: result === 'ok' ? 200 : result === 'unconfigured' ? 503 : 502 });
}
