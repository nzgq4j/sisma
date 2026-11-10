import type { NextConfig } from 'next';

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // Only sisma.io is indexed: the same site under *.vercel.app (deployment and branch addresses) asks search engines
      // to leave it out, so they don't list duplicates. Every page also names its sisma.io address as canonical.
      { source: '/:path*', missing: [{ type: 'host', value: 'sisma.io' }], headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
      // Account pages are never listed (also a noindex meta tag in app/app/me/layout.tsx).
      { source: '/app/me', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/app/me/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
