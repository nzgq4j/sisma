// POST /api/play/rtdn — Google Play Real-time Developer Notifications, pushed by a Pub/Sub push subscription with
// authentication (a Google-signed OIDC token, checked against PLAY_RTDN_AUDIENCE and PLAY_RTDN_SERVICE_ACCOUNT).
// Each subscription notification is re-read from the Developer API and written to the account (lib/play.ts); the
// notification's own content is only used for the purchase token. Answers 2xx when handled (or not ours), 5xx to have
// Pub/Sub retry after a temporary failure.
import { NextResponse, type NextRequest } from 'next/server';
import { adminClient } from '@/lib/auth';
import { PLAY, playConfigured, pubSubTokenProblem, syncPlayPurchase } from '@/lib/play';

interface Notification { packageName?: string; subscriptionNotification?: { purchaseToken?: string; subscriptionId?: string; notificationType?: number }; testNotification?: object }

export async function POST(req: NextRequest) {
  // Refusals are logged with their reason (no secrets), so a misconfigured push subscription shows up in the logs.
  const problem = await pubSubTokenProblem(req.headers.get('authorization'));
  if (problem) { console.warn('play rtdn refused:', problem); return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }
  const db = adminClient();
  if (!playConfigured() || !db) {
    console.error('play rtdn: billing not configured', { serviceAccount: playConfigured(), database: !!db });
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  }
  const body = (await req.json().catch(() => null)) as { message?: { data?: string } } | null;
  let n: Notification = {};
  try { n = JSON.parse(Buffer.from(body?.message?.data ?? '', 'base64').toString('utf8')) as Notification; } catch { return NextResponse.json({ ignored: 'bad_message' }); }
  if (n.testNotification) { console.info('play rtdn: test notification received'); return NextResponse.json({ test: true }); }
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
