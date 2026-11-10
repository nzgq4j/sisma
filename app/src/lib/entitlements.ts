export type Plan = 'free' | 'plus';
/** sisma+ is sold as one plan: yearly. */
export type Billing = 'yearly';

/** Free trial for new subscribers (the Google Play offer and the Stripe checkout use the same length). */
export const TRIAL_DAYS = 3;

export const PRICES: Record<Billing, { usd: number; stripePriceEnv: string; playProductId: string }> = {
  yearly: { usd: 6.99, stripePriceEnv: 'STRIPE_PRICE_YEARLY', playProductId: 'sisma_yearly' },
};

export const ENTITLEMENTS = {
  free: { historyDays: 30, maxLocations: 1, pushAlerts: false, advancedFilters: false, maxAlertRules: 0 },
  plus: { historyDays: Infinity, maxLocations: 10, pushAlerts: true, advancedFilters: true, maxAlertRules: 5 },
} as const;

export type Entitlement = keyof (typeof ENTITLEMENTS)['free'];
export const limits = (plan: Plan) => ENTITLEMENTS[plan];
export const can = (plan: Plan, key: 'pushAlerts' | 'advancedFilters') => ENTITLEMENTS[plan][key];

export interface ProfileBilling { plan: Plan | null; subscription_status: string | null; trial_ends_at: string | null }
/** Mirrors public.effective_plan() in supabase/migrations. */
export function effectivePlan(p: ProfileBilling | null): Plan {
  if (!p || p.plan !== 'plus') return 'free';
  if (p.subscription_status && ['trialing', 'active', 'past_due'].includes(p.subscription_status)) return 'plus';
  if (p.trial_ends_at && new Date(p.trial_ends_at) > new Date()) return 'plus';
  return 'free';
}
