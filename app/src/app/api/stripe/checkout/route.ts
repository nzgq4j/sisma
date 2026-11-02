import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PRICES, TRIAL_DAYS, type Billing } from '@/lib/entitlements';
import { userForRequest } from '@/lib/auth';
import { SITE } from '@/lib/site';

// POST /api/stripe/checkout { billing: 'monthly' | 'yearly' } with Authorization: Bearer <Supabase access token>.
// The user id and email come from the verified session, never from the request body.
export async function POST(req: NextRequest) {
  const { billing } = (await req.json().catch(() => ({}))) as { billing?: Billing };
  const secret = process.env.STRIPE_SECRET_KEY, price = billing && process.env[PRICES[billing]?.stripePriceEnv ?? ''];
  if (!secret || !price) return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  const user = await userForRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    subscription_data: { trial_period_days: TRIAL_DAYS, metadata: { userId: user.id } },
    client_reference_id: user.id,
    customer_email: user.email,
    success_url: SITE.url + '/app/me?upgraded=1',
    cancel_url: SITE.url + '/app/me',
  });
  return NextResponse.json({ url: session.url });
}
