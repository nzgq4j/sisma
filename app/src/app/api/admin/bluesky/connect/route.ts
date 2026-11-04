// Bluesky account for automatic posts, signed in from Me → Administration. Administrators only (lib/admin.ts).
// POST { identifier, password, service? } — signs in; the password is used for this request only and never stored
//   (the session goes to Supabase Vault). An app password is recommended (Bluesky → Settings → App passwords).
// GET — checks the connection now (gets a token, asks Bluesky whose it is).
// DELETE — signs out (also on Bluesky) and forgets the session; the env credentials, if any, apply again.
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { BlueskyError, checkConnection, connectAccount, DEFAULT_SERVICE, disconnectAccount } from '@/lib/bluesky';

export const dynamic = 'force-dynamic';

/** Bluesky's error names → what the admin page says. */
function errorCode(e: unknown): string {
  const code = e instanceof BlueskyError ? e.code : '';
  if (code === 'AuthFactorTokenRequired') return 'two_factor';
  if (code === 'AuthenticationRequired' || code === 'HTTP_401') return 'wrong_password';
  if (code === 'AccountTakedown') return 'account_takedown';
  if (code === 'RateLimitExceeded' || code === 'HTTP_429') return 'rate_limited';
  if (code === 'unreachable') return 'unreachable';
  if (code === 'not_configured') return 'not_configured';
  if (code === 'ExpiredToken' || code === 'InvalidToken') return 'expired';
  return 'failed';
}

/** https only, no credentials or paths: the Bluesky server (PDS) to sign in to. */
function serviceUrl(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return DEFAULT_SERVICE;
  if (typeof v !== 'string' || v.length > 200) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:' || u.username || u.password || (u.pathname !== '/' && u.pathname !== '') || u.search) return null;
    return u.origin;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { identifier?: unknown; password?: unknown; service?: unknown };
  const identifier = typeof body.identifier === 'string' ? body.identifier.trim().replace(/^@/, '') : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const service = serviceUrl(body.service);
  if (!identifier || identifier.length > 254 || !password || password.length > 256) return NextResponse.json({ error: 'missing' }, { status: 400 });
  if (!service) return NextResponse.json({ error: 'bad_service' }, { status: 400 });
  try {
    const r = await connectAccount(a.db, identifier, password, service, a.user.id);
    return NextResponse.json({ handle: r.handle });
  } catch (e) {
    return NextResponse.json({ error: errorCode(e) }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    return NextResponse.json(await checkConnection(a.db));
  } catch (e) {
    return NextResponse.json({ error: errorCode(e) }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const a = await requireAdmin(req);
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await disconnectAccount(a.db);
  return NextResponse.json({ ok: true });
}
