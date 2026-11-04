// Bluesky handle verification: https://sisma.io/.well-known/atproto-did answers the account's DID as plain text, so
// the Bluesky account can use sisma.io as its handle (Bluesky → Settings → Account → Handle → "I have my own domain"
// → "No DNS panel"). The DID is public (it is in every post's at:// URI). docs/bluesky-setup.md
export const dynamic = 'force-static';

const DID = 'did:plc:ydcmwzpjnvqo4aybljucdz7s';

export function GET() {
  return new Response(DID, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
