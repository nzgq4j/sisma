import type { NextRequest } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';
import { effectivePlan, type Plan } from './entitlements';
import { supabaseAdminConfig } from './supabase-env';

/** Server-only admin client (secret key). null in demo mode. */
export function adminClient() {
  const cfg = supabaseAdminConfig();
  return cfg ? createClient(cfg.url, cfg.key, { auth: { persistSession: false } }) : null;
}

/** The user behind the request's bearer token (a Supabase access token), verified with Supabase Auth. */
export async function userForRequest(req: NextRequest): Promise<User | null> {
  const db = adminClient();
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!db || !token) return null;
  const { data } = await db.auth.getUser(token);
  return data.user ?? null;
}

/** Reads the bearer token (Supabase session) and returns the effective plan. Demo mode: free. */
export async function planForRequest(req: NextRequest): Promise<Plan> {
  const db = adminClient(), user = await userForRequest(req);
  if (!db || !user) return 'free';
  const { data } = await db.from('profiles').select('plan, subscription_status, trial_ends_at').eq('id', user.id).single();
  return effectivePlan(data);
}
