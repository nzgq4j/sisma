// POST /api/play/client-error { stage, code, message } with Authorization: Bearer <Supabase access token>.
// The Android app reports Google Play billing plugin errors here (lib/play-client.ts), so a purchase that fails or is
// misreported on a phone shows up in the server log with Google's response code. Nothing is stored.
import { NextResponse, type NextRequest } from 'next/server';
import { userForRequest } from '@/lib/auth';

const clip = (v: unknown, n: number) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, n);

export async function POST(req: NextRequest) {
  const user = await userForRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { stage?: unknown; code?: unknown; message?: unknown };
  const stage = b.stage === 'restore' ? 'restore' : 'purchase';
  console.warn('play client error', JSON.stringify({ user: user.id, stage, code: clip(b.code, 60), message: clip(b.message, 300) }));
  return NextResponse.json({ ok: true });
}
