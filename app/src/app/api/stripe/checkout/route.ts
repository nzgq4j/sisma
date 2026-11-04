import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PRICES, TRIAL_DAYS, type Billing } from '@/lib/entitlements';
import { adminClient, userForRequest } from '@/lib/auth';
import { hasLiveSubscription, trialEligible, type BillingProfile } from '@/lib/billing';
import { SITE } from '@/lib/site';

// POST /api/stripe/checkout { billing: 'monthly' | 'yearly' } with Authorization: Bearer <Supabase access token>.
// The user id and email come from the verified session, never from the request body. The account's billing state is
// read with the service role: an account that already has a live subscription (Stripe or Google Play) is refused,
// the free trial is only offered to accounts that have never subscribed, and a returning subscriber's existing Stripe
// customer is reused (so payment methods and invoices stay in one place).
export async function POST(req: NextRequest) {
  const { billing } = (await req.json().catch(() => ({}))) as { billing?: Billing };
  const secret = process.env.STRIPE_SECRET_KEY, price = billing && process.env[PRICES[billing]?.stripePriceEnv ?? ''];
  if (!secret || !price) return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  const user = await userForRequest(req), db = adminClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!db) return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });

  const { data, error } = await db.from('profiles')
    .select('plan, subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, play_purchase_token').eq('id', user.id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'profile' }, { status: 500 });
  const profile = data as BillingProfile;
  if (hasLiveSubscription(profile)) return NextResponse.json({ error: 'already_subscribed' }, { status: 409 });

  const stripe = new Stripe(secret);
  let trial = trialEligible(profile);
  // A known customer may still have a live subscription the webhook has not recorded yet: check Stripe itself.
  if (profile.stripe_customer_id) {
    const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'all', limit: 10 });
    if (subs.data.some(s => ['trialing', 'active', 'past_due'].includes(s.status))) {
      return NextResponse.json({ error: 'already_subscribed' }, { status: 409 });
    }
    if (subs.data.length) trial = false;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    subscription_data: { ...(trial ? { trial_period_days: TRIAL_DAYS } : {}), metadata: { userId: user.id } },
    client_reference_id: user.id,
    ...(profile.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: user.email }),
    success_url: SITE.url + '/app/me?upgraded=1',
    cancel_url: SITE.url + '/app/me',
  });
  return NextResponse.json({ url: session.url, trial });
}
