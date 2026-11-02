import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { effectivePlan, type Plan } from './entitlements';

/** Reads the bearer token (Supabase session) and returns the effective plan. Demo mode: free. */
export async function planForRequest(req: NextRequest): Promise<Plan> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!url || !key || !token) return 'free';
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: user } = await db.auth.getUser(token);
  if (!user.user) return 'free';
  const { data } = await db.from('profiles').select('plan, subscription_status, trial_ends_at').eq('id', user.user.id).single();
  return effectivePlan(data);
}
