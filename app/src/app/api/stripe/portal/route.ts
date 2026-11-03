import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { userForRequest } from '@/lib/auth';
import { supabaseAdminConfig } from '@/lib/supabase-env';
import { SITE } from '@/lib/site';

// POST /api/stripe/portal with Authorization: Bearer <Supabase access token> → { url } of a Stripe customer portal
// session (change plan, update the card, invoices, cancel) for the signed-in user's own Stripe customer. The customer
// id is looked up on the server from the verified user; nothing in the request chooses it.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY, cfg = supabaseAdminConfig();
  if (!secret || !cfg) return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  const user = await userForRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
  const { data } = await db.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
  const customer = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (!customer) return NextResponse.json({ error: 'no_stripe_subscription' }, { status: 404 });
  const stripe = new Stripe(secret);
  try {
    const session = await stripe.billingPortal.sessions.create({ customer, return_url: SITE.url + '/app/me/subscription' });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: 'portal_failed' }, { status: 502 });
  }
}
