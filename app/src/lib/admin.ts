// Administrators: profiles.is_admin, set by the database owner only (migration 20261106000100_bluesky.sql). Every admin
// API route calls requireAdmin, which checks the signed-in user's flag with the service role on each request.
import type { NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { adminClient, userForRequest } from './auth';

export async function requireAdmin(req: NextRequest): Promise<{ user: User; db: SupabaseClient } | null> {
  const db = adminClient(), user = await userForRequest(req);
  if (!db || !user) return null;
  const { data } = await db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  return data?.is_admin === true ? { user, db } : null;
}
