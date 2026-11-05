import type { Metadata, Viewport } from 'next';
import { Figtree, IBM_Plex_Mono } from 'next/font/google';
import { I18nProvider } from '@/i18n/I18nProvider';
import { THEME_SCRIPT } from '@/components/Theme';
import './globals.css';

const figtree = Figtree({ subsets: ['latin', 'latin-ext'], variable: '--font-figtree' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: '500', variable: '--font-plex-mono' });

// Search and social cards. The card image is app/opengraph-image.png (1200 × 630); X uses it too (summary_large_image).
const TITLE = 'sisma — Live Earthquake Map, Globe & Alerts';
const DESCRIPTION = 'Track earthquakes worldwide in real time. Live data from USGS, EMSC, GeoNet and JMA on a map and 3D globe, with custom alerts, felt reports and the science behind them.';
export const metadata: Metadata = {
  metadataBase: new URL('https://sisma.io'),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'sisma',
  keywords: ['earthquake', 'earthquakes today', 'live earthquake map', 'earthquake tracker', 'earthquake alerts', 'seismic activity', 'seismology', 'USGS', 'EMSC', 'tsunami'],
  openGraph: { type: 'website', siteName: 'sisma', locale: 'en_US', title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#6C4BF4' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400..600,0..1,0&display=block" />
      </head>
      <body><I18nProvider>{children}</I18nProvider></body>
    </html>
  );
}
