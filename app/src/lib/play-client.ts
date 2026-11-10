// Google Play Billing in the Android app (Capacitor plugin @capgo/native-purchases, installed in mobile/).
// The web build never loads the plugin: it is reached through window.Capacitor.Plugins, which only exists in the app.
// Purchases are tagged with the account id the server expects (sha-256 of the user id, lib/play.ts) and then
// reported to POST /api/play/verify, which checks them with Google and records the plan.
import type { Billing } from './entitlements';
import { PLAY, playBilling } from './play-config';

interface PlayTransaction { purchaseToken?: string; productIdentifier?: string }
interface PlayProduct { identifier: string; planIdentifier?: string; priceString: string; offerId?: string | null }
interface NativePurchases {
  isBillingSupported(): Promise<{ isBillingSupported: boolean }>;
  purchaseProduct(o: { productIdentifier: string; planIdentifier: string; productType: 'subs'; appAccountToken: string }): Promise<PlayTransaction>;
  getPurchases(o: { productType: 'subs'; appAccountToken?: string }): Promise<{ purchases: PlayTransaction[] }>;
  getProducts(o: { productIdentifiers: string[]; productType: 'subs' }): Promise<{ products: PlayProduct[] }>;
}
interface Cap { isNativePlatform?: () => boolean; Plugins?: { NativePurchases?: NativePurchases } }

const cap = (): Cap | null => {
  const c = typeof window !== 'undefined' ? (window as { Capacitor?: Cap }).Capacitor : undefined;
  return c?.isNativePlatform?.() ? c : null;
};
/** Running inside the Android app (whatever its version). */
export const inApp = () => !!cap();
const plugin = () => cap()?.Plugins?.NativePurchases ?? null;

/** The app has the billing plugin and Google Play billing works on this device. */
export async function playBillingReady(): Promise<boolean> {
  const p = plugin();
  if (!p) return false;
  try { return (await p.isBillingSupported()).isBillingSupported; } catch { return false; }
}

async function accountId(userId: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Local prices of the base plans (as Google Play shows them), when available. */
export async function playPrices(): Promise<Partial<Record<Billing, string>>> {
  const p = plugin();
  if (!p) return {};
  try {
    const { products } = await p.getProducts({ productIdentifiers: [PLAY.products.yearly], productType: 'subs' });
    const out: Partial<Record<Billing, string>> = {};
    for (const b of ['yearly'] as Billing[]) {
      // Android subscriptions: planIdentifier is the product id; the base offer (the regular price) has no offerId.
      const mine = products.filter(x => x.planIdentifier === PLAY.products[b]);
      const base = mine.find(x => !x.offerId) ?? mine[0];
      if (base?.priceString) out[b] = base.priceString;
    }
    return out;
  } catch { return {}; }
}

export type PlayResult = 'ok' | 'cancelled' | 'none' | 'error' | 'mismatch' | 'unavailable';

async function report(token: string, accessToken: string): Promise<PlayResult> {
  const r = await fetch('/api/play/verify', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ purchaseToken: token }) }).catch(() => null);
  if (!r) return 'error';
  if (r.ok) return 'ok';
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return j.error === 'account_mismatch' || j.error === 'token_in_use' ? 'mismatch' : 'error';
}

/** Buys the plan with Google Play and reports it. */
export async function buyWithPlay(billing: Billing, userId: string, accessToken: string): Promise<PlayResult> {
  const p = plugin();
  if (!p) return 'error';
  let t: PlayTransaction;
  try {
    t = await p.purchaseProduct({ productIdentifier: PLAY.products[billing], planIdentifier: PLAY.basePlans[billing], productType: 'subs', appAccountToken: await accountId(userId) });
  } catch (e) {
    // The plugin rejects with Google's response code: USER_CANCELED when the sheet is closed, ITEM_ALREADY_OWNED when
    // this Google account already has the subscription (then report the one it has).
    const code = (e as { code?: string })?.code;
    if (code === 'USER_CANCELED') return 'cancelled';
    if (code === 'ITEM_ALREADY_OWNED') return restorePlay(userId, accessToken);
    // The subscription can't be bought in this build: products not set up in Play Console yet, or the app was not
    // installed from Google Play (the plugin rejects with "Product not found" before Google's sheet opens).
    const msg = String((e as Error)?.message ?? e);
    if (code === 'ITEM_UNAVAILABLE' || code === 'BILLING_UNAVAILABLE' || code === 'DEVELOPER_ERROR' || /product not found/i.test(msg)) return 'unavailable';
    return 'error';
  }
  return t.purchaseToken ? report(t.purchaseToken, accessToken) : 'error';
}

/** Restore: reports this account's Google Play subscriptions on this device (after a reinstall, or a new phone). */
export async function restorePlay(userId: string, accessToken: string): Promise<PlayResult> {
  const p = plugin();
  if (!p) return 'error';
  let purchases: PlayTransaction[];
  try { purchases = (await p.getPurchases({ productType: 'subs', appAccountToken: await accountId(userId) })).purchases; } catch { return 'error'; }
  const ours = purchases.filter(x => x.purchaseToken && (!x.productIdentifier || playBilling(x.productIdentifier)));
  if (!ours.length) return 'none';
  let result: PlayResult = 'error';
  for (const x of ours) { result = await report(x.purchaseToken!, accessToken); if (result === 'ok') break; }
  return result;
}
