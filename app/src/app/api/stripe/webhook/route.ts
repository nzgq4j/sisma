import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminConfig } from '@/lib/supabase-env';

// Writes subscription state to profiles. Configure the endpoint in Stripe for customer.subscription.* events.
// The account is the userId in the subscription's metadata (set by our checkout). Subscriptions made elsewhere (the
// Stripe dashboard, a payment link) have none: they are matched by the saved Stripe customer, then by the customer's
// email address (public.user_id_for_email, service role only).
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY, whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whsec) return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  const stripe = new Stripe(secret);
  const event = stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') ?? '', whsec);
  if (event.type.startsWith('customer.subscription.')) {
    const sub = event.data.object as Stripe.Subscription;
    const cfg = supabaseAdminConfig();
    if (!cfg) throw new Error('Supabase is not configured');
    const db = createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
    const userId = await accountFor(db, stripe, sub);
    if (!userId) return NextResponse.json({ received: true, matched: false });
    // effective_plan() decides access from the status; plan follows it so a cancelled subscription reads as free.
    const live = ['trialing', 'active', 'past_due'].includes(sub.status);
    const periodEnd = sub.items.data[0]?.current_period_end;
    // A Stripe subscription that has ended does not switch off a Google Play subscription that is still running.
    const { data: cur } = await db.from('profiles').select('billing_source, subscription_status').eq('id', userId).maybeSingle();
    if (!live && cur?.billing_source === 'play' && ['trialing', 'active', 'past_due'].includes(cur.subscription_status ?? '')) {
      await db.from('profiles').update({ stripe_customer_id: String(sub.customer), stripe_subscription_id: sub.id }).eq('id', userId);
      return NextResponse.json({ received: true });
    }
    const { error } = await db.from('profiles').update({
      billing_source: 'stripe',
      plan: live ? 'plus' : 'free',
      stripe_customer_id: String(sub.customer),
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      billing_interval: 'yearly', // the only plan sold
      trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    }).eq('id', userId);
    // Let Stripe retry if the database write failed.
    if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function accountFor(db: SupabaseClient, stripe: Stripe, sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.userId) return sub.metadata.userId;
  const customerId = String(sub.customer);
  const { data } = await db.from('profiles').select('id').eq('stripe_customer_id', customerId).limit(1).maybeSingle();
  if (data?.id) return data.id as string;
  const customer = await stripe.customers.retrieve(customerId);
  const email = 'deleted' in customer && customer.deleted ? null : customer.email;
  if (!email) return null;
  const { data: id } = await db.rpc('user_id_for_email', { p_email: email });
  return typeof id === 'string' ? id : null;
}
