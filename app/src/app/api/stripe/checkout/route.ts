import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PRICES, TRIAL_DAYS, type Billing } from '@/lib/entitlements';
import { SITE } from '@/lib/site';

// POST /api/stripe/checkout { billing: 'monthly' | 'yearly', userId, email }
export async function POST(req: NextRequest) {
  const { billing, userId, email } = (await req.json()) as { billing: Billing; userId: string; email?: string };
  const secret = process.env.STRIPE_SECRET_KEY, price = process.env[PRICES[billing]?.stripePriceEnv ?? ''];
  if (!secret || !price) return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    subscription_data: { trial_period_days: TRIAL_DAYS, metadata: { userId } },
    client_reference_id: userId,
    customer_email: email,
    success_url: SITE.url + '/app/me?upgraded=1',
    cancel_url: SITE.url + '/app/me',
  });
  return NextResponse.json({ url: session.url });
}
