import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import science from '@/content/science.json';
import { JsonLd, appGraph, articleGraph, helpGraph, siteGraph } from './structured-data';
import { siteVerification } from './seo';
import { INDEXNOW_KEY } from './indexnow';
import { readFileSync } from 'node:fs';

describe('structured data', () => {
  it('describes the publisher, the site and the app', () => {
    expect(siteGraph().map(t => t['@type'])).toEqual(['Organization', 'WebSite']);
    const [app] = appGraph();
    expect(app).toMatchObject({ '@type': 'SoftwareApplication', name: 'sisma', operatingSystem: 'Web, Android' });
    expect((app.offers as { price: number }[]).map(o => o.price)).toEqual([0, 6.99]);
    expect(app).not.toHaveProperty('aggregateRating');
  });
  it('has an article with breadcrumbs for every science article', () => {
    for (const a of science) {
      const [article, crumbs] = articleGraph(a.id);
      expect(article).toMatchObject({ '@type': 'Article', url: `https://sisma.io/app/science/${a.id}`, image: `https://sisma.io/og/science-${a.id}.jpg` });
      expect((crumbs.itemListElement as { item: string }[]).map(i => i.item)).toEqual(['https://sisma.io/app/science', `https://sisma.io/app/science/${a.id}`]);
    }
    expect(articleGraph('nope')).toEqual([]);
  });
  it('writes valid JSON that cannot close its script element', () => {
    const html = renderToStaticMarkup(<JsonLd graph={helpGraph('x', 'A </script><b>title', 'd')} />);
    expect(html).not.toContain('</script><b>');
    const json = JSON.parse(html.replace(/^<script[^>]*>|<\/script>$/g, ''));
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@graph'][0].headline).toBe('A </script><b>title');
  });
});

describe('site verification tags', () => {
  it('uses only the tokens that are set', () => {
    expect(siteVerification({})).toBeUndefined();
    expect(siteVerification({ GOOGLE_SITE_VERIFICATION: 'g1', BING_SITE_VERIFICATION: ' b1 ', YANDEX_VERIFICATION: '' }))
      .toEqual({ google: 'g1', other: { 'msvalidate.01': 'b1' } });
  });
});

describe('IndexNow key', () => {
  it('is served as public/<key>.txt with the key as its content', () => {
    expect(readFileSync(new URL(`../../public/${INDEXNOW_KEY}.txt`, import.meta.url), 'utf8').trim()).toBe(INDEXNOW_KEY);
  });
});
