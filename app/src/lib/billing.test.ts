import { describe, expect, it } from 'vitest';
import { hasLiveSubscription, trialEligible } from './billing';

const base = { plan: 'plus' as const, subscription_status: 'active', trial_ends_at: null };
describe('billing', () => {
  it('trial only for accounts that never subscribed', () => {
    expect(trialEligible(null)).toBe(true);
    expect(trialEligible({ plan: 'free', subscription_status: null, trial_ends_at: null })).toBe(true);
    expect(trialEligible({ plan: 'free', subscription_status: 'canceled', trial_ends_at: null, stripe_customer_id: 'cus_1' })).toBe(false);
    expect(trialEligible({ plan: 'free', subscription_status: 'canceled', trial_ends_at: null, play_purchase_token: 'tok' })).toBe(false);
  });
  it('live subscription needs a store subscription and a live status', () => {
    expect(hasLiveSubscription({ ...base, stripe_subscription_id: 'sub_1' })).toBe(true);
    expect(hasLiveSubscription({ ...base, play_purchase_token: 'tok' })).toBe(true);
    expect(hasLiveSubscription({ ...base })).toBe(false); // plus set by hand, no store subscription
    expect(hasLiveSubscription({ ...base, subscription_status: 'canceled', stripe_subscription_id: 'sub_1' })).toBe(false);
  });
});
