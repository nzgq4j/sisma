export type Plan = 'free' | 'plus';
export type Billing = 'monthly' | 'yearly';

export const TRIAL_DAYS = 7;

export const PRICES: Record<Billing, { usd: number; stripePriceEnv: string; playProductId: string }> = {
  monthly: { usd: 2.99, stripePriceEnv: 'STRIPE_PRICE_MONTHLY', playProductId: 'sisma_plus_monthly' },
  yearly: { usd: 19.99, stripePriceEnv: 'STRIPE_PRICE_YEARLY', playProductId: 'sisma_plus_yearly' },
};

export const ENTITLEMENTS = {
  free: { historyDays: 30, maxLocations: 1, pushAlerts: false, advancedFilters: false },
  plus: { historyDays: Infinity, maxLocations: 10, pushAlerts: true, advancedFilters: true },
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
