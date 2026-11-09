// Search and social metadata per topic: title, description, canonical URL and a 1200 × 630 card in public/og/
// (built by scripts/og-cards.mjs from the running app). English, like the science articles; the interface is translated.
import type { Metadata } from 'next';
import science from '@/content/science.json';
import en from '@/i18n/messages/en.json';

export const SITE_URL = 'https://sisma.io';

export interface Card {
  /** <title> and og:title */
  title: string;
  /** meta description, ≤ 160 characters */
  description: string;
  /** page path, also the canonical URL */
  path: string;
  /** /og/<image>.jpg */
  image: string;
  alt: string;
  /** Text drawn on the card image */
  kicker: string;
  heading: string;
  sub: string;
}

/** Shortens text to whole words, ending with … when it was cut. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—–-]+$/, '') + '…';
}

const firstSentence = (text: string) => text.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? text;

export const CARDS = {
  home: {
    title: 'sisma — Live Earthquake Map, Globe & Alerts',
    description: 'Track earthquakes worldwide in real time. Live data from USGS, EMSC, GeoNet and JMA on a map and 3D globe, with custom alerts, felt reports and the science behind them.',
    path: '/', image: 'home', alt: 'sisma: live earthquakes worldwide on a 3D globe, with real-time data from USGS, EMSC, GeoNet and JMA',
    kicker: '', heading: 'Live earthquakes, worldwide', sub: 'Real-time data from USGS, EMSC, GeoNet and JMA on a map and 3D globe, with custom alerts.',
  },
  feed: {
    title: 'Earthquakes Today: Live Feed of Recent Earthquakes | sisma',
    description: 'The latest earthquakes worldwide from USGS, EMSC, GeoNet and JMA. Sort by latest, nearest or strongest, with magnitude, depth and distance for each event.',
    path: '/app', image: 'feed', alt: 'A list of recent earthquakes sorted by strength, with magnitude, place, depth and distance',
    kicker: 'Live feed', heading: 'Earthquakes right now', sub: 'Latest, nearest or strongest, merged from four seismic agencies.',
  },
  map: {
    title: 'Live Earthquake Map | sisma',
    description: 'Interactive world map of recent earthquakes coloured by magnitude, with tectonic plate boundaries. Zoom from the whole planet down to street level.',
    path: '/app/map', image: 'map', alt: 'World map with recent earthquakes as pins coloured by magnitude',
    kicker: 'Map', heading: 'Live earthquake map', sub: 'Every recent earthquake, coloured by magnitude, with plate boundaries.',
  },
  globe: {
    title: '3D Earthquake Globe | sisma',
    description: 'Spin a 3D globe of recent earthquakes and switch to depth view to see how deep each one struck, from the surface down to 700 km.',
    path: '/app/globe', image: 'globe', alt: '3D globe with recent earthquakes coloured by depth',
    kicker: '3D globe', heading: 'See how deep they strike', sub: 'Spin the globe, or switch to depth view to see each earthquake by depth.',
  },
  science: {
    title: 'How Earthquakes Work: Illustrated Science | sisma',
    description: 'Eight illustrated guides to plate tectonics, faults, seismic waves, magnitude, depth, tsunamis, the Pacific Ring of Fire and earthquake preparedness.',
    path: '/app/science', image: 'science', alt: 'Diagrams of plate tectonics, fault types, seismic waves and a tsunami',
    kicker: 'Science', heading: 'How earthquakes work', sub: 'Eight illustrated guides, from plate tectonics to the Ring of Fire.',
  },
  help: {
    title: 'Help & Support — sisma',
    description: 'How to use sisma: the earthquake feed, map and globe, felt reports, sharing, your account and password reset, sisma+ billing, alerts, and troubleshooting.',
    path: '/help', image: 'home', alt: 'sisma: live earthquakes worldwide',
    kicker: '', heading: '', sub: '',
  },
  privacy: {
    title: 'Privacy policy — sisma',
    description: 'What personal data sisma handles, why, which providers process it, and how to delete your account.',
    path: '/privacy', image: 'home', alt: 'sisma: live earthquakes worldwide',
    kicker: '', heading: '', sub: '',
  },
  terms: {
    title: 'Terms of service — sisma',
    description: 'The terms for using sisma.io, the sisma app and sisma+ subscriptions.',
    path: '/terms', image: 'home', alt: 'sisma: live earthquakes worldwide',
    kicker: '', heading: '', sub: '',
  },
} satisfies Record<string, Card>;

/** One card per science article, from the article text (content/science.json) and its English title. */
export function articleCard(id: string): Card | null {
  const i = science.findIndex(a => a.id === id);
  if (i < 0) return null;
  const a = science[i], name = en.sci_t[i];
  return {
    title: `${name} — How Earthquakes Work | sisma`,
    description: clip(a.intro, 160),
    path: `/app/science/${a.id}`, image: `science-${a.id}`, alt: `${name}: illustration from the sisma science guide`,
    kicker: `Science · ${String(i + 1).padStart(2, '0')}`, heading: name, sub: clip(firstSentence(a.intro), 130),
  };
}

export const ARTICLE_IDS = science.map(a => a.id);

/** Next.js metadata for a card: title, description, canonical, Open Graph and the X large-image card. */
export function cardMetadata(c: Card): Metadata {
  const images = [{ url: `/og/${c.image}.jpg`, width: 1200, height: 630, alt: c.alt, type: 'image/jpeg' }];
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: c.path },
    openGraph: { type: c.path.startsWith('/app/science/') ? 'article' : 'website', siteName: 'sisma', locale: 'en_US', url: c.path, title: c.title, description: c.description, images },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description, images },
  };
}
