import { describe, expect, it } from 'vitest';
import { LIBRARY } from './library';
import { BLUESKY_MAX_GRAPHEMES, detectFacets, draftLibraryPost, graphemes, LIBRARY_FEED_TAGS, libraryUrl, postProblem } from './bluesky';

const enc = new TextEncoder();
const sliceBytes = (s: string, a: number, b: number) => new TextDecoder().decode(enc.encode(s).slice(a, b));

describe('In Depth posts', () => {
  for (const a of LIBRARY) {
    it(`${a.id}: fits, links the article and tags it`, () => {
      const d = draftLibraryPost(a);
      expect(graphemes(d.text)).toBeLessThanOrEqual(BLUESKY_MAX_GRAPHEMES);
      expect(d.text.startsWith(a.title)).toBe(true);
      expect(d.url).toBe(libraryUrl(a));
      expect(d.image).toBe(`/og/library-${a.id}.jpg`);
      const link = d.facets.find(f => f.features[0].$type === 'app.bsky.richtext.facet#link');
      expect(link && sliceBytes(d.text, link.index.byteStart, link.index.byteEnd)).toBe(d.url);
      const tags = d.facets.flatMap(f => f.features).filter(f => f.$type === 'app.bsky.richtext.facet#tag').map(f => (f as { tag: string }).tag);
      expect(tags).toEqual([...a.hashtags, ...LIBRARY_FEED_TAGS]);
      expect(a.hashtags.length).toBeGreaterThan(0);
      expect(d.alt).toContain(a.title);
      expect(postProblem(d.text, d.alt)).toBeNull();
    });
  }
});

describe('detectFacets', () => {
  it('finds links and tags with byte offsets, after non-ASCII text', () => {
    const text = 'Séisme — voir https://sisma.io/a/b. #géologie #2024 #Earth_Science\nfin';
    const f = detectFacets(text);
    expect(f.map(x => sliceBytes(text, x.index.byteStart, x.index.byteEnd))).toEqual(['https://sisma.io/a/b', '#géologie', '#Earth_Science']);
    expect(f[1].features[0]).toEqual({ $type: 'app.bsky.richtext.facet#tag', tag: 'géologie' });
  });
  it('ignores # inside words', () => expect(detectFacets('a#b c')).toEqual([]));
});

describe('postProblem', () => {
  it('rejects empty and over-long posts', () => {
    expect(postProblem('  ', '')).toBe('empty');
    expect(postProblem('x'.repeat(301), '')).toBe('too_long');
    expect(postProblem('ok', 'x'.repeat(2001))).toBe('alt_too_long');
  });
});
