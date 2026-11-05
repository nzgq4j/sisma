import { describe, expect, it, vi, afterEach } from 'vitest';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { playAccountId, playPatch, verifyPubSubToken, type PlaySubscription } from './play';

const NOW = Date.parse('2026-11-05T12:00:00Z');
const later = '2026-12-05T12:00:00Z', earlier = '2026-11-01T12:00:00Z';
const sub = (state: string, o: Partial<PlaySubscription['lineItems'] extends (infer L)[] | undefined ? L : never> = {}): PlaySubscription => ({
  subscriptionState: state,
  lineItems: [{ productId: 'sisma_plus_monthly', expiryTime: later, autoRenewingPlan: { autoRenewEnabled: true }, offerDetails: { basePlanId: 'monthly' }, ...o }],
});

describe('playPatch', () => {
  it('active paid subscription', () => {
    expect(playPatch(sub('SUBSCRIPTION_STATE_ACTIVE'), NOW)).toEqual({ plan: 'plus', subscription_status: 'active', billing_interval: 'monthly', current_period_end: later, cancel_at_period_end: false, trial_ends_at: null });
  });
  it('free trial phase reads as trialing, ending at expiry', () => {
    const p = playPatch(sub('SUBSCRIPTION_STATE_ACTIVE', { productId: 'sisma_yearly', offerPhase: { freeTrial: {} }, offerDetails: { basePlanId: 'yearly', offerId: 'trial' } }), NOW);
    expect(p).toMatchObject({ plan: 'plus', subscription_status: 'trialing', billing_interval: 'yearly', trial_ends_at: later });
  });
  it('grace period keeps access as past_due', () => {
    expect(playPatch(sub('SUBSCRIPTION_STATE_IN_GRACE_PERIOD'), NOW)).toMatchObject({ plan: 'plus', subscription_status: 'past_due' });
  });
  it('cancelled keeps access until expiry, then ends', () => {
    expect(playPatch(sub('SUBSCRIPTION_STATE_CANCELED', { autoRenewingPlan: { autoRenewEnabled: false } }), NOW)).toMatchObject({ plan: 'plus', subscription_status: 'active', cancel_at_period_end: true });
    expect(playPatch(sub('SUBSCRIPTION_STATE_CANCELED', { expiryTime: earlier }), NOW)).toMatchObject({ plan: 'free', subscription_status: 'canceled' });
  });
  it('on hold, paused, expired, pending have no access', () => {
    for (const [s, st] of [['SUBSCRIPTION_STATE_ON_HOLD', 'paused'], ['SUBSCRIPTION_STATE_PAUSED', 'paused'], ['SUBSCRIPTION_STATE_EXPIRED', 'canceled'], ['SUBSCRIPTION_STATE_PENDING', 'incomplete']]) {
      expect(playPatch(sub(s), NOW)).toMatchObject({ plan: 'free', subscription_status: st });
    }
  });
});

describe('playAccountId', () => {
  it('is the sha-256 hex of the user id (as profiles.play_account_id)', () => {
    // sha256("abc") — the standard test vector
    expect(playAccountId('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('verifyPubSubToken', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
  const tok = (claims: object, kid = 'k1') => {
    const b = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const u = `${b({ alg: 'RS256', kid, typ: 'JWT' })}.${b(claims)}`;
    return `Bearer ${u}.${createSign('RSA-SHA256').update(u).sign(privateKey).toString('base64url')}`;
  };
  const good = { iss: 'https://accounts.google.com', aud: 'https://sisma.io/api/play/rtdn', email: 'pubsub@x.iam.gserviceaccount.com', email_verified: true, exp: NOW / 1000 + 600 };
  vi.stubEnv('PLAY_RTDN_AUDIENCE', good.aud);
  vi.stubEnv('PLAY_RTDN_SERVICE_ACCOUNT', good.email);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] }))));
  afterEach(() => undefined);

  it('accepts a valid token', async () => { expect(await verifyPubSubToken(tok(good), NOW)).toBe(true); });
  it('rejects wrong audience, account, expiry, issuer, key or signature', async () => {
    expect(await verifyPubSubToken(tok({ ...good, aud: 'https://evil.example' }), NOW)).toBe(false);
    expect(await verifyPubSubToken(tok({ ...good, email: 'other@x.iam.gserviceaccount.com' }), NOW)).toBe(false);
    expect(await verifyPubSubToken(tok({ ...good, exp: NOW / 1000 - 3600 }), NOW)).toBe(false);
    expect(await verifyPubSubToken(tok({ ...good, iss: 'https://evil.example' }), NOW)).toBe(false);
    expect(await verifyPubSubToken(tok(good, 'unknown'), NOW)).toBe(false);
    const t = tok(good); expect(await verifyPubSubToken(t.slice(0, -4) + 'AAAA', NOW)).toBe(false);
    expect(await verifyPubSubToken(null, NOW)).toBe(false);
  });
});
