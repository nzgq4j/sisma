// GET /api/admin/x/callback?code&state — where X sends the administrator back after "Sign in with X". The browser
// carries no sisma session here, so the request is trusted only through the one-time state, which was created by an
// administrator in the last 10 minutes (lib/x.ts finishSignIn). Ends on Me → Administration with the result.
import { NextResponse, type NextRequest } from 'next/server';
import { adminClient } from '@/lib/auth';
import { finishSignIn, XError } from '@/lib/x';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const back = (q: Record<string, string>) => {
    const u = new URL('/app/me/admin', req.nextUrl.origin);
    for (const [k, v] of Object.entries({ net: 'x', ...q })) u.searchParams.set(k, v);
    return NextResponse.redirect(u, 303);
  };
  const state = p.get('state'), code = p.get('code');
  // Declined on X ("Cancel"): X returns error=access_denied.
  if (p.get('error')) return back({ x: 'error', code: p.get('error') === 'access_denied' ? 'denied' : 'failed' });
  if (!state || !code || state.length > 200 || code.length > 2000) return back({ x: 'error', code: 'bad_state' });
  const db = adminClient();
  if (!db) return back({ x: 'error', code: 'failed' });
  try {
    await finishSignIn(db, state, code);
    return back({ x: 'connected' });
  } catch (e) {
    console.error('x sign-in', e);
    return back({ x: 'error', code: e instanceof XError ? e.code.replace(/^HTTP_\d+$/, 'failed') : 'failed' });
  }
}
