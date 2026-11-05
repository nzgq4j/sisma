import type { MetadataRoute } from 'next';

// Search engines may index the site and the public app pages; the API and account pages are left out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/app/me'] },
    sitemap: 'https://sisma.io/sitemap.xml',
  };
}
