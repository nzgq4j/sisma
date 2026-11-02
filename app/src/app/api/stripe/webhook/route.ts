import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdminConfig } from '@/lib/supabase-env';

// Writes subscription state to profiles. Configure the endpoint in Stripe for customer.subscription.* events.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY, whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whsec) return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  const stripe = new Stripe(secret);
  const event = stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') ?? '', whsec);
  if (event.type.startsWith('customer.subscription.')) {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata.userId;
    const cfg = supabaseAdminConfig();
    if (!cfg) throw new Error('Supabase is not configured');
    const db = createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
    await db.from('profiles').update({
      plan: 'plus',
      stripe_customer_id: String(sub.customer),
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      billing_interval: sub.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    }).eq('id', userId);
  }
  return NextResponse.json({ received: true });
}
