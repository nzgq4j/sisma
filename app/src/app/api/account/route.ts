import { NextRequest, NextResponse } from 'next/server';
import { adminClient, userForRequest } from '@/lib/auth';

// DELETE /api/account (Authorization: Bearer <access token>) — permanently deletes the signed-in user.
// profiles, saved_locations, alert_settings and push_tokens cascade; felt_reports keep the report with user_id = null.
// Refused while a paid subscription is still running, so nobody is billed for a deleted account.
export async function DELETE(req: NextRequest) {
  const db = adminClient();
  if (!db) return NextResponse.json({ error: 'accounts_not_configured' }, { status: 501 });
  const user = await userForRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: p } = await db.from('profiles').select('subscription_status, cancel_at_period_end').eq('id', user.id).maybeSingle();
  if (p && ['active', 'trialing', 'past_due'].includes(p.subscription_status ?? '') && !p.cancel_at_period_end) {
    return NextResponse.json({ error: 'subscription_active' }, { status: 409 });
  }
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
