// Billing state shared by the client (labels) and the server (checkout, Google Play): whether an account has a
// subscription that is still running, and whether it can still have the free trial.
import { effectivePlan, type ProfileBilling } from './entitlements';

export interface BillingProfile extends ProfileBilling {
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  play_purchase_token?: string | null;
}

const LIVE = ['trialing', 'active', 'past_due'];

/** A Stripe or Google Play subscription that is still running (a database-only trial does not count). */
export function hasLiveSubscription(p: BillingProfile | null): boolean {
  return !!p && effectivePlan(p) === 'plus' && !!p.subscription_status && LIVE.includes(p.subscription_status)
    && !!(p.stripe_subscription_id || p.play_purchase_token);
}

/** The free trial is for accounts that have never subscribed, through Stripe or Google Play. */
export function trialEligible(p: BillingProfile | null): boolean {
  return !p || !(p.stripe_customer_id || p.stripe_subscription_id || p.play_purchase_token);
}
