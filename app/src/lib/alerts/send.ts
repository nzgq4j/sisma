// Server-only push senders. Android: Firebase Cloud Messaging HTTP v1, authorised with the service account in
// FCM_SERVICE_ACCOUNT (JSON). Browsers: Web Push with VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT). A channel whose settings are missing is skipped ('unconfigured').
import { createSign } from 'node:crypto';
import webpush from 'web-push';
import type { AlertDevice } from './match';
import type { PushMessage } from './message';

export type SendResult = 'ok' | 'gone' | 'error' | 'unconfigured';

interface ServiceAccount { project_id: string; client_email: string; private_key: string }
function serviceAccount(): ServiceAccount | null {
  try { const sa = JSON.parse(process.env.FCM_SERVICE_ACCOUNT ?? ''); return sa.project_id && sa.client_email && sa.private_key ? sa : null; } catch { return null; }
}

let fcmToken: { value: string; expires: number } | null = null;
async function fcmAccessToken(sa: ServiceAccount): Promise<string> {
  if (fcmToken && fcmToken.expires > Date.now() + 60_000) return fcmToken.value;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  if (!r.ok) throw new Error('fcm_auth_' + r.status);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  fcmToken = { value: j.access_token, expires: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function sendFcm(token: string, msg: PushMessage): Promise<SendResult> {
  const sa = serviceAccount();
  if (!sa) return 'unconfigured';
  try {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await fcmAccessToken(sa)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: {
        token, notification: { title: msg.title, body: msg.body }, data: { url: msg.url },
        android: { priority: 'high', notification: { channel_id: 'alerts', tag: msg.tag } },
      } }),
    });
    if (r.ok) return 'ok';
    const text = await r.text();
    return r.status === 404 || /UNREGISTERED|INVALID_ARGUMENT.*registration/i.test(text) ? 'gone' : 'error';
  } catch { return 'error'; }
}

let vapidReady: boolean | null = null;
function vapid(): boolean {
  if (vapidReady !== null) return vapidReady;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (vapidReady = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:support@sisma.io', pub, priv);
  return (vapidReady = true);
}

async function sendWebPush(token: string, msg: PushMessage): Promise<SendResult> {
  if (!vapid()) return 'unconfigured';
  try {
    await webpush.sendNotification(JSON.parse(token), JSON.stringify(msg), { TTL: 3600, urgency: 'high' });
    return 'ok';
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? 'gone' : 'error';
  }
}

export function sendPush(device: AlertDevice, msg: PushMessage): Promise<SendResult> {
  return device.kind === 'fcm' ? sendFcm(device.token, msg) : sendWebPush(device.token, msg);
}

/** Which channels the server can send on (shown in Me so a device isn't registered for nothing). */
export const pushChannels = () => ({ fcm: !!serviceAccount(), webpush: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) });
