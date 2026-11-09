// X account for automatic posts, connected from Me → Administration. Administrators only (lib/admin.ts).
// POST — starts "Sign in with X": returns X's authorize URL (one-time state and PKCE verifier stored for 10 minutes).
//   The administrator signs in on x.com and approves; X sends them back to /api/admin/x/callback. sisma never sees
//   the X password.
// GET — checks the connection now (gets a token, asks X whose account it is).
// DELETE — signs out: revokes the tokens at X and forgets them.
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { checkX, disconnectX, startSignIn, XError } from '@/lib/x';

export const dynamic = 'force-dynamic';

/** Short codes for the admin page (admin.x_err_*). */
const codeOf = (e: unknown) => (e instanceof XError ? e.code.replace(/^HTTP_\d+$/, 'failed') : 'failed');

export async function POST(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    return NextResponse.json({ url: await startSignIn(a.db, a.user.id) });
  } catch (e) {
    return NextResponse.json({ error: codeOf(e) }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    return NextResponse.json(await checkX(a.db));
  } catch (e) {
    return NextResponse.json({ error: codeOf(e), detail: e instanceof Error ? e.message : '' }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await disconnectX(a.db);
  return NextResponse.json({ ok: true });
}
