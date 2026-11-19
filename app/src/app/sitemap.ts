import type { MetadataRoute } from 'next';
import science from '@/content/science.json';
import { TOPICS } from './help/topics';
import { LIBRARY, LIBRARY_PATH, libraryHref } from '@/lib/library';

const BASE = 'https://sisma.io';

// Public pages for search engines: the home page, the app's views, every science article, the In Depth library (with
// each article's last update) and the legal pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: 'always' | 'weekly' | 'monthly' | 'yearly') =>
    ({ url: BASE + path, priority, changeFrequency });
  return [
    page('/', 1, 'weekly'),
    page('/app', 0.9, 'always'),
    page('/app/map', 0.8, 'always'),
    page('/app/globe', 0.8, 'always'),
    page('/app/science', 0.7, 'monthly'),
    page('/app/science/data', 0.5, 'weekly'),
    ...(science as { id: string }[]).map(a => page(`/app/science/${a.id}`, 0.6, 'monthly')),
    page(LIBRARY_PATH, 0.7, 'weekly'),
    ...LIBRARY.map(a => ({ ...page(libraryHref(a.id), 0.7, 'monthly'), lastModified: a.updated })),
    page('/help', 0.5, 'monthly'),
    ...TOPICS.map(t => page(`/help/${t.slug}`, 0.4, 'monthly')),
    page('/privacy', 0.2, 'yearly'),
    page('/terms', 0.2, 'yearly'),
  ];
}
