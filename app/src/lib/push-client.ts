// Device registration for earthquake alerts (browser only). Android app: @capacitor/push-notifications (FCM), only in
// app builds at or above NEXT_PUBLIC_FCM_MIN_BUILD (older builds have no Firebase config and would crash on register).
// Browsers: Web Push through /sw.js with the VAPID public key. The token is kept in localStorage so this device can be
// tested, refreshed (language, units) and removed on sign-out; the server keeps the list per account.

export type PushState = 'checking' | 'on' | 'off' | 'blocked' | 'unsupported' | 'ios' | 'app_update' | 'error';
type Perm = 'granted' | 'denied' | 'prompt';

const TOKEN_KEY = 'sisma.pushToken';
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const FCM_MIN_BUILD = Number(process.env.NEXT_PUBLIC_FCM_MIN_BUILD ?? '0');

interface NativePush {
  checkPermissions(): Promise<{ receive: string }>;
  requestPermissions(): Promise<{ receive: string }>;
  register(): Promise<void>;
  createChannel(c: object): Promise<void>;
  addListener(ev: string, cb: (v: { value?: string; notification?: { data?: { url?: string } } }) => void): Promise<{ remove(): void }>;
}
interface Cap { isNativePlatform?: () => boolean; Plugins?: { PushNotifications?: NativePush; App?: { getInfo(): Promise<{ build: string }> } } }
const cap = (): Cap | null => {
  const c = typeof window !== 'undefined' ? (window as { Capacitor?: Cap }).Capacitor : undefined;
  return c?.isNativePlatform?.() ? c : null;
};

export const storedToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const storeToken = (t: string | null) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } };

async function nativeReady(): Promise<NativePush | 'app_update' | null> {
  const c = cap(); if (!c) return null;
  const push = c.Plugins?.PushNotifications;
  const build = Number((await c.Plugins?.App?.getInfo().catch(() => null))?.build ?? 0);
  if (!push || !FCM_MIN_BUILD || build < FCM_MIN_BUILD) return 'app_update';
  return push;
}

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
const webSupported = () => !!VAPID && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** What this device can do right now, without prompting. */
export async function pushState(): Promise<PushState> {
  const native = await nativeReady();
  if (native === 'app_update') return 'app_update';
  if (native) {
    const p = (await native.checkPermissions()).receive as Perm;
    return p === 'denied' ? 'blocked' : p === 'granted' && storedToken() ? 'on' : 'off';
  }
  if (!webSupported()) return isIos() && !standalone() ? 'ios' : 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  return Notification.permission === 'granted' && sub && storedToken() ? 'on' : 'off';
}

function b64ToBytes(b64: string) {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
}

async function nativeToken(push: NativePush): Promise<string> {
  await push.createChannel({ id: 'alerts', name: 'Earthquake alerts', importance: 5, visibility: 1, vibration: true }).catch(() => {});
  return new Promise((resolve, reject) => {
    const subs: Promise<{ remove(): void }>[] = [];
    const done = (f: () => void) => { subs.forEach(s => s.then(h => h.remove())); f(); };
    subs.push(push.addListener('registration', v => done(() => resolve(String(v.value)))));
    subs.push(push.addListener('registrationError', () => done(() => reject(new Error('registration')))));
    void push.register();
  });
}

async function save(accessToken: string, kind: 'fcm' | 'webpush', token: string, locale: string, units: string) {
  const r = await fetch('/api/push/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ kind, token, locale, units }),
  });
  if (!r.ok) throw new Error('register_' + r.status);
  storeToken(token);
}

/** Asks for permission (call from a tap) and registers this device for the signed-in user. */
export async function enablePush(accessToken: string, locale: string, units: string): Promise<PushState> {
  try {
    const native = await nativeReady();
    if (native === 'app_update') return 'app_update';
    if (native) {
      const p = (await native.requestPermissions()).receive as Perm;
      if (p !== 'granted') return 'blocked';
      await save(accessToken, 'fcm', await nativeToken(native), locale, units);
      return 'on';
    }
    if (!webSupported()) return isIos() && !standalone() ? 'ios' : 'unsupported';
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return perm === 'denied' ? 'blocked' : 'off';
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID) }));
    await save(accessToken, 'webpush', JSON.stringify(sub.toJSON()), locale, units);
    return 'on';
  } catch { return 'error'; }
}

/** Re-sends this device's token with the current language and units (no prompt). */
export async function refreshPush(accessToken: string, locale: string, units: string) {
  const token = storedToken(); if (!token) return;
  const kind = token.startsWith('{') ? 'webpush' : 'fcm';
  await save(accessToken, kind, token, locale, units).catch(() => {});
}

/** Removes this device from the account (before signing out). */
export async function disablePush(accessToken: string | null) {
  const token = storedToken(); if (!token) return;
  storeToken(null);
  if (accessToken) await fetch('/api/push/register', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ token }) }).catch(() => {});
}

export async function sendTestPush(accessToken: string): Promise<boolean> {
  const token = storedToken(); if (!token) return false;
  const r = await fetch('/api/push/test', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ token }) }).catch(() => null);
  return !!r?.ok;
}

/** Android app: open the event when a notification is tapped. */
export function listenForPushTaps(go: (url: string) => void): () => void {
  const push = cap()?.Plugins?.PushNotifications;
  if (!push || !FCM_MIN_BUILD) return () => {};
  const h = push.addListener('pushNotificationActionPerformed', v => { const url = v.notification?.data?.url; if (url?.startsWith('/')) go(url); });
  return () => { void h.then(x => x.remove()); };
}
