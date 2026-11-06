import type { MetadataRoute } from 'next';
import science from '@/content/science.json';

const BASE = 'https://sisma.io';

// Public pages for search engines: the home page, the app's views, every science article and the legal pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: 'always' | 'weekly' | 'monthly' | 'yearly') =>
    ({ url: BASE + path, priority, changeFrequency });
  return [
    page('/', 1, 'weekly'),
    page('/app', 0.9, 'always'),
    page('/app/map', 0.8, 'always'),
    page('/app/globe', 0.8, 'always'),
    page('/app/science', 0.7, 'monthly'),
    ...(science as { id: string }[]).map(a => page(`/app/science/${a.id}`, 0.6, 'monthly')),
    page('/help', 0.5, 'monthly'),
    page('/privacy', 0.2, 'yearly'),
    page('/terms', 0.2, 'yearly'),
  ];
}
