import type { MetadataRoute } from 'next';

// Install metadata for the PWA. Icons are generated from the design's logo mark (see src/components/Logo.tsx).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'sisma — The Pulse of a Living Planet',
    short_name: 'sisma',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#6C4BF4', // OS launch screen for the installed PWA; matches the in-app splash
    theme_color: '#6C4BF4',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
