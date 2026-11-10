import type { MetadataRoute } from 'next';

// Search engines may crawl the site and the public app pages; the API is left out. The account pages (/app/me) stay
// crawlable on purpose: they carry noindex (app/app/me/layout.tsx and an X-Robots-Tag header in next.config.ts), and a
// crawler has to be allowed to fetch a page to see that and drop it from the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: 'https://sisma.io/sitemap.xml',
  };
}
