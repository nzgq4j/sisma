// Structured data (schema.org JSON-LD) for search engines: who publishes the site, the site itself, the web and Android
// app, and each science article and help topic with its place in the site (breadcrumbs). Only facts the pages show;
// no ratings or reviews. Check a page with Google's Rich Results Test or validator.schema.org. docs/search-setup.md
import en from '@/i18n/messages/en.json';
import science from '@/content/science.json';
import { SITE_URL, articleCard } from './seo';
import { PRICES, type Billing } from './entitlements';
import { SITE } from './site';

type Thing = Record<string, unknown>;
const ORG_ID = `${SITE_URL}/#organization`, SITE_ID = `${SITE_URL}/#website`;

/** The publisher (sisma) and the website, on every page. */
export function siteGraph(): Thing[] {
  return [
    { '@type': 'Organization', '@id': ORG_ID, name: 'sisma', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512 },
      email: 'support@sisma.io' },
    { '@type': 'WebSite', '@id': SITE_ID, name: 'sisma', alternateName: 'sisma.io', url: SITE_URL, inLanguage: 'en', publisher: { '@id': ORG_ID },
      description: 'Live earthquakes worldwide on a map and 3D globe, with alerts, felt reports and the science behind them.' },
  ];
}

/** The app (web and Android): free, with the optional sisma+ subscription. */
export function appGraph(): Thing[] {
  const free = { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'free' };
  const plus = (b: Billing) => ({ '@type': 'Offer', name: `sisma+ ${b}`, price: PRICES[b].usd, priceCurrency: 'USD', category: 'subscription' });
  return [{
    '@type': 'SoftwareApplication', '@id': `${SITE_URL}/#app`, name: 'sisma', url: `${SITE_URL}/app`, publisher: { '@id': ORG_ID },
    applicationCategory: 'ReferenceApplication', operatingSystem: 'Web, Android',
    // The Play Store page, once NEXT_PUBLIC_PLAY_URL is set (while the app is in testing there is no public page).
    ...(SITE.playUrl.startsWith('https://') ? { installUrl: SITE.playUrl } : {}),
    description: 'Track earthquakes worldwide in real time from USGS, EMSC, GeoNet and JMA, on a map and 3D globe, with custom alerts.',
    screenshot: `${SITE_URL}/og/home.jpg`, offers: [free, plus('yearly')],
  }];
}

const crumbs = (items: [string, string][]): Thing => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + path })),
});

/** A science article, with breadcrumbs Science › article. */
export function articleGraph(id: string): Thing[] {
  const card = articleCard(id), i = science.findIndex(a => a.id === id);
  if (!card || i < 0) return [];
  return [
    { '@type': 'Article', '@id': `${SITE_URL}${card.path}#article`, headline: en.sci_t[i], description: card.description, inLanguage: 'en',
      image: `${SITE_URL}/og/${card.image}.jpg`, url: SITE_URL + card.path, mainEntityOfPage: SITE_URL + card.path,
      author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, isPartOf: { '@id': SITE_ID } },
    crumbs([['Science', '/app/science'], [en.sci_t[i], card.path]]),
  ];
}

/** A help topic, with breadcrumbs Help › topic. */
export function helpGraph(slug: string, title: string, description: string): Thing[] {
  const path = `/help/${slug}`;
  return [
    { '@type': 'TechArticle', '@id': `${SITE_URL}${path}#article`, headline: title, description, inLanguage: 'en', url: SITE_URL + path,
      mainEntityOfPage: SITE_URL + path, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, isPartOf: { '@id': SITE_ID }, about: { '@id': `${SITE_URL}/#app` } },
    crumbs([['Help & support', '/help'], [title, path]]),
  ];
}

/** One JSON-LD block. "<" is escaped so the data can never close the script element. */
export function JsonLd({ graph }: { graph: Thing[] }) {
  if (!graph.length) return null;
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
