// POST /api/play/rtdn — Google Play Real-time Developer Notifications, pushed by a Pub/Sub push subscription with
// authentication (a Google-signed OIDC token, checked against PLAY_RTDN_AUDIENCE and PLAY_RTDN_SERVICE_ACCOUNT).
// Each subscription notification is re-read from the Developer API and written to the account (lib/play.ts); the
// notification's own content is only used for the purchase token. Answers 2xx when handled (or not ours), 5xx to have
// Pub/Sub retry after a temporary failure.
import { NextResponse, type NextRequest } from 'next/server';
import { adminClient } from '@/lib/auth';
import { PLAY, playConfigured, syncPlayPurchase, verifyPubSubToken } from '@/lib/play';

interface Notification { packageName?: string; subscriptionNotification?: { purchaseToken?: string; subscriptionId?: string; notificationType?: number }; testNotification?: object }

export async function POST(req: NextRequest) {
  if (!(await verifyPubSubToken(req.headers.get('authorization')))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const db = adminClient();
  if (!playConfigured() || !db) return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  const body = (await req.json().catch(() => null)) as { message?: { data?: string } } | null;
  let n: Notification = {};
  try { n = JSON.parse(Buffer.from(body?.message?.data ?? '', 'base64').toString('utf8')) as Notification; } catch { return NextResponse.json({ ignored: 'bad_message' }); }
  if (n.testNotification) return NextResponse.json({ test: true });
  const token = n.subscriptionNotification?.purchaseToken;
  if (n.packageName !== PLAY.packageName || !token) return NextResponse.json({ ignored: true });
  try {
    const r = await syncPlayPurchase(db, token);
    // A purchase whose account is not known yet (the app has not reported it): the app's own report will record it.
    return NextResponse.json(r.ok ? { plan: r.plan, status: r.status } : { ignored: r.error });
  } catch (e) {
    console.error('play rtdn', e);
    return NextResponse.json({ error: 'retry' }, { status: 500 });
  }
}
