import { NextResponse } from 'next/server';

// Android App Links: lets https://sisma.io/app/... links (Google sign-in return, email sign-in links) open in the
// sisma Android app instead of the browser. Fingerprints come from Play Console → Test and release → App integrity →
// App signing → "SHA-256 certificate fingerprint" (add the upload key's too for local test builds), set in Vercel as
// ANDROID_CERT_SHA256 (comma-separated). Not secret. Until it's set this answers 404 and links open in the browser.
export const dynamic = 'force-dynamic';

export function GET() {
  const prints = (process.env.ANDROID_CERT_SHA256 ?? '').split(',').map(s => s.trim().toUpperCase()).filter(s => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  if (!prints.length) return NextResponse.json([], { status: 404 });
  return NextResponse.json(
    [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'io.sisma.app', sha256_cert_fingerprints: prints } }],
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
