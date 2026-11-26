import type { Metadata, Viewport } from 'next';
import { Figtree, IBM_Plex_Mono } from 'next/font/google';
import { I18nProvider } from '@/i18n/I18nProvider';
import { THEME_SCRIPT } from '@/components/Theme';
import { CARDS, SITE_URL, cardMetadata, siteVerification } from '@/lib/seo';
import { JsonLd, siteGraph } from '@/lib/structured-data';
import './globals.css';

const figtree = Figtree({ subsets: ['latin', 'latin-ext'], variable: '--font-figtree' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: '500', variable: '--font-plex-mono' });

// Search and social cards: lib/seo.ts (one card per topic in public/og/, built by scripts/og-cards.mjs).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'sisma',
  keywords: ['earthquake', 'earthquakes today', 'live earthquake map', 'earthquake tracker', 'earthquake alerts', 'seismic activity', 'seismology', 'USGS', 'EMSC', 'tsunami'],
  ...cardMetadata(CARDS.home),
  verification: siteVerification(),
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#6C4BF4' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400..600,0..1,0&display=block" />
      </head>
      <body><JsonLd graph={siteGraph()} /><I18nProvider>{children}</I18nProvider></body>
    </html>
  );
}
