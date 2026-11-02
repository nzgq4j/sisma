import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { effectivePlan, type Plan } from './entitlements';
import { supabaseAdminConfig } from './supabase-env';

/** Reads the bearer token (Supabase session) and returns the effective plan. Demo mode: free. */
export async function planForRequest(req: NextRequest): Promise<Plan> {
  const cfg = supabaseAdminConfig();
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!cfg || !token) return 'free';
  const db = createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
  const { data: user } = await db.auth.getUser(token);
  if (!user.user) return 'free';
  const { data } = await db.from('profiles').select('plan, subscription_status, trial_ends_at').eq('id', user.user.id).single();
  return effectivePlan(data);
}
