// Google Play subscriptions (Android app). One subscription product per billing interval (PLAY.products), each with
// one base plan; the free trial is an offer on the base plan for new customers (Play decides eligibility).
// - The app buys with the plugin @capgo/native-purchases and tags the purchase with playAccountId(user.id) (sha-256 of
//   the user id: Google asks for an obfuscated id), then reports the purchase token to POST /api/play/verify.
// - Google sends Real-time Developer Notifications through Pub/Sub to POST /api/play/rtdn (renewals, cancellations…).
// Both read the subscription from the Google Play Developer API (purchases.subscriptionsv2.get), acknowledge new
// purchases (Google refunds purchases not acknowledged within 3 days) and write the state to profiles.
// Server env: GOOGLE_PLAY_SERVICE_ACCOUNT (service account JSON with access to the app in Play Console),
// PLAY_RTDN_AUDIENCE and PLAY_RTDN_SERVICE_ACCOUNT (the Pub/Sub push subscription's authentication). See
// docs/play-billing-setup.md.
import { createHash, createPublicKey, createSign, createVerify, type JsonWebKey } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Billing } from './entitlements';
import { PLAY, playBilling } from './play-config';

export { PLAY };

/** The account id attached to Play purchases: sha-256 (hex) of the user id, as profiles.play_account_id. */
export const playAccountId = (userId: string) => createHash('sha256').update(userId, 'utf8').digest('hex');

// --- Developer API types (subset of SubscriptionPurchaseV2) ---
export interface PlayLineItem {
  productId?: string; expiryTime?: string;
  autoRenewingPlan?: { autoRenewEnabled?: boolean };
  offerDetails?: { basePlanId?: string; offerId?: string; offerTags?: string[] };
  offerPhase?: { freeTrial?: object; introductoryPrice?: object; basePrice?: object; prorationPeriod?: object };
}
export interface PlaySubscription {
  subscriptionState?: string; acknowledgementState?: string; linkedPurchaseToken?: string; startTime?: string;
  lineItems?: PlayLineItem[]; testPurchase?: object;
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
}

export interface PlayProfilePatch {
  plan: 'plus' | 'free'; subscription_status: string; billing_interval: Billing; current_period_end: string | null;
  cancel_at_period_end: boolean; trial_ends_at: string | null;
}

/** What a Play subscription means for the profile (status names as Stripe's, which effective_plan() reads). */
export function playPatch(sub: PlaySubscription, now = Date.now()): PlayProfilePatch {
  const li = sub.lineItems?.[0] ?? {};
  const expiry = li.expiryTime ? Date.parse(li.expiryTime) : NaN;
  const running = Number.isFinite(expiry) && expiry > now;
  const trial = !!li.offerPhase?.freeTrial;
  let status: string;
  switch (sub.subscriptionState) {
    case 'SUBSCRIPTION_STATE_ACTIVE': status = trial ? 'trialing' : 'active'; break;
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD': status = 'past_due'; break;
    // Cancelled by the user: access continues until the end of the paid (or trial) period.
    case 'SUBSCRIPTION_STATE_CANCELED': status = running ? (trial ? 'trialing' : 'active') : 'canceled'; break;
    case 'SUBSCRIPTION_STATE_ON_HOLD': case 'SUBSCRIPTION_STATE_PAUSED': status = 'paused'; break;
    case 'SUBSCRIPTION_STATE_EXPIRED': status = 'canceled'; break;
    case 'SUBSCRIPTION_STATE_PENDING': status = 'incomplete'; break;
    case 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED': status = 'incomplete_expired'; break;
    default: status = 'unknown';
  }
  const live = ['trialing', 'active', 'past_due'].includes(status);
  return {
    plan: live ? 'plus' : 'free',
    subscription_status: status,
    billing_interval: playBilling(li.productId) ?? (li.offerDetails?.basePlanId === PLAY.basePlans.yearly ? 'yearly' : 'monthly'),
    current_period_end: li.expiryTime ?? null,
    cancel_at_period_end: sub.subscriptionState === 'SUBSCRIPTION_STATE_CANCELED' || li.autoRenewingPlan?.autoRenewEnabled === false,
    trial_ends_at: status === 'trialing' ? li.expiryTime ?? null : null,
  };
}

// --- Google OAuth (service account → access token for the Developer API) ---
interface ServiceAccount { client_email: string; private_key: string }
let cached: { value: string; expires: number } | null = null;
function serviceAccount(): ServiceAccount | null {
  try { const sa = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT ?? ''); return sa.client_email && sa.private_key ? sa : null; } catch { return null; }
}
export const playConfigured = () => !!serviceAccount();

async function accessToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.value;
  const sa = serviceAccount();
  if (!sa) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT is not set');
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  if (!r.ok) throw new Error(`Google token ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cached = { value: j.access_token, expires: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PLAY.packageName}/purchases`;

/** The subscription for a purchase token, or null if Google does not know the token. */
export async function getPlaySubscription(token: string): Promise<PlaySubscription | null> {
  const r = await fetch(`${API}/subscriptionsv2/tokens/${encodeURIComponent(token)}`, { headers: { authorization: `Bearer ${await accessToken()}` } });
  if (r.status === 404 || r.status === 410 || r.status === 400) return null;
  if (!r.ok) throw new Error(`Play subscriptionsv2.get ${r.status}`);
  return (await r.json()) as PlaySubscription;
}

async function acknowledge(productId: string, token: string) {
  const r = await fetch(`${API}/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}:acknowledge`, {
    method: 'POST', headers: { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json' }, body: '{}',
  });
  if (!r.ok) throw new Error(`Play acknowledge ${r.status}`);
}

export type SyncResult = { ok: true; userId: string; plan: 'plus' | 'free'; status: string }
  | { ok: false; error: 'not_found' | 'account_mismatch' | 'token_in_use' | 'no_account' | 'wrong_product' };

interface ProfileRow { id: string; play_purchase_token: string | null; stripe_subscription_id: string | null; subscription_status: string | null; billing_source: string | null }
const LIVE = ['trialing', 'active', 'past_due'];

/**
 * Reads a purchase token from Google Play and records it on the account. With `userId` (the app reporting its own
 * purchase) the purchase must carry that account's id and the token must not belong to another account; without it
 * (a notification from Google) the account is found from the token, the token it replaced, or the account id.
 */
export async function syncPlayPurchase(db: SupabaseClient, token: string, userId?: string): Promise<SyncResult> {
  const sub = await getPlaySubscription(token);
  if (!sub) return { ok: false, error: 'not_found' };
  const li = sub.lineItems?.[0];
  if (li?.productId && !playBilling(li.productId)) return { ok: false, error: 'wrong_product' };
  const acct = sub.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null;
  const cols = 'id, play_purchase_token, stripe_subscription_id, subscription_status, billing_source';

  let profile: ProfileRow | null = null;
  if (userId) {
    if (acct !== playAccountId(userId)) return { ok: false, error: 'account_mismatch' };
    const other = await db.from('profiles').select('id').eq('play_purchase_token', token).neq('id', userId).limit(1).maybeSingle();
    if (other.data) return { ok: false, error: 'token_in_use' };
    profile = (await db.from('profiles').select(cols).eq('id', userId).maybeSingle()).data as ProfileRow | null;
  } else {
    const tokens = [token, sub.linkedPurchaseToken].filter(Boolean) as string[];
    profile = (await db.from('profiles').select(cols).in('play_purchase_token', tokens).limit(1).maybeSingle()).data as ProfileRow | null;
    if (!profile && acct) profile = (await db.from('profiles').select(cols).eq('play_account_id', acct).limit(1).maybeSingle()).data as ProfileRow | null;
  }
  if (!profile) return { ok: false, error: 'no_account' };

  const patch = playPatch(sub);
  if (sub.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING' && LIVE.includes(patch.subscription_status) && li?.productId) {
    await acknowledge(li.productId, token);
  }
  // A Play subscription that has ended does not switch off a Stripe subscription that is still running.
  const stripeRunning = profile.billing_source === 'stripe' && !!profile.stripe_subscription_id && LIVE.includes(profile.subscription_status ?? '');
  if (patch.plan === 'free' && stripeRunning) {
    await db.from('profiles').update({ play_purchase_token: token }).eq('id', profile.id);
    return { ok: true, userId: profile.id, plan: 'plus', status: profile.subscription_status ?? 'active' };
  }
  const { error } = await db.from('profiles').update({ ...patch, play_purchase_token: token, billing_source: 'play' }).eq('id', profile.id);
  if (error) throw new Error('profile update failed');
  return { ok: true, userId: profile.id, plan: patch.plan, status: patch.subscription_status };
}

// --- Pub/Sub push authentication (Google-signed OIDC token in the Authorization header) ---
let certs: { keys: (JsonWebKey & { kid: string })[]; expires: number } | null = null;
async function googleCerts() {
  if (certs && certs.expires > Date.now()) return certs.keys;
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!r.ok) throw new Error(`Google certs ${r.status}`);
  const j = (await r.json()) as { keys: (JsonWebKey & { kid: string })[] };
  certs = { keys: j.keys, expires: Date.now() + 3600_000 };
  return j.keys;
}

/**
 * Why a push request's bearer token is not a valid Google OIDC token for our push subscription (audience and account),
 * or null when it is. The reasons name only non-secret values (the audience URL and service account email carried by
 * the token), so they can be logged when Pub/Sub deliveries are refused.
 */
export async function pubSubTokenProblem(authorization: string | null, now = Date.now()): Promise<string | null> {
  const aud = process.env.PLAY_RTDN_AUDIENCE?.trim(), email = process.env.PLAY_RTDN_SERVICE_ACCOUNT?.trim();
  if (!aud || !email) return 'PLAY_RTDN_AUDIENCE or PLAY_RTDN_SERVICE_ACCOUNT not set';
  const jwt = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const parts = jwt.split('.');
  if (parts.length !== 3) return 'no bearer token (is authentication enabled on the push subscription?)';
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as { alg?: string; kid?: string };
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as { iss?: string; aud?: string; email?: string; email_verified?: boolean; exp?: number; iat?: number };
    if (header.alg !== 'RS256' || !header.kid) return `unexpected token header ${header.alg}`;
    let jwk = (await googleCerts()).find(k => k.kid === header.kid);
    if (!jwk) { certs = null; jwk = (await googleCerts()).find(k => k.kid === header.kid); } // Google rotated its keys
    if (!jwk) return 'token signed with an unknown Google key';
    const valid = createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).verify(createPublicKey({ key: jwk, format: 'jwk' }), parts[2], 'base64url');
    if (!valid) return 'bad token signature';
    if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') return `unexpected issuer ${claims.iss}`;
    if (claims.aud !== aud) return `audience ${JSON.stringify(claims.aud)} does not match PLAY_RTDN_AUDIENCE`;
    if (claims.email !== email) return `service account ${JSON.stringify(claims.email)} does not match PLAY_RTDN_SERVICE_ACCOUNT`;
    if (claims.email_verified !== true) return 'service account email not verified';
    if (typeof claims.exp !== 'number' || claims.exp <= now / 1000 - 60) return 'token expired';
    return null;
  } catch (e) { return `token check failed: ${String((e as Error)?.message ?? e)}`; }
}

/** True when the bearer token is a valid Google OIDC token for our push subscription (audience and account). */
export async function verifyPubSubToken(authorization: string | null, now = Date.now()): Promise<boolean> {
  return (await pubSubTokenProblem(authorization, now)) === null;
}
