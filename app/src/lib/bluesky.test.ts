import { describe, expect, it } from 'vitest';
import { alreadyPosted, autoCandidates, BLUESKY_MAX_GRAPHEMES, draftPost, eventUrl, type PostRow } from './bluesky';
import type { Quake } from './quakes/types';

const NOW = Date.parse('2026-11-06T03:10:00Z');
const q = (o: Partial<Quake> = {}): Quake => ({ id: 'usgs:us7000abcd', source: 'usgs', mag: 6.4, title: '45 km E of Namie, Japan', region: 'Japan',
  time: Date.parse('2026-11-06T03:01:00Z'), lat: 37.5, lon: 141.5, depthKm: 35, tsunami: false, ...o });
const g = (s: string) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
const slice = (text: string, f: { index: { byteStart: number; byteEnd: number } }) => Buffer.from(text).subarray(f.index.byteStart, f.index.byteEnd).toString();

describe('draftPost', () => {
  it('builds the text, link and hashtags with correct byte ranges', () => {
    const d = draftPost(q());
    expect(d.text.split('\n')).toEqual([
      'M6.4 earthquake · Japan',
      '6 Nov, 03:01 UTC · 35 km (22 mi) deep',
      `Map and details: ${eventUrl(q())}`,
      '#earthquake #Japan',
      'Automated post · not an official warning service',
    ]);
    // "·" is 2 bytes in UTF-8: the ranges must be byte offsets, not character offsets.
    const [link, t1, t2] = d.facets;
    expect(slice(d.text, link)).toBe(eventUrl(q()));
    expect(link.features[0]).toEqual({ $type: 'app.bsky.richtext.facet#link', uri: 'https://sisma.io/app/map?focus=usgs%3Aus7000abcd' });
    expect(slice(d.text, t1)).toBe('#earthquake');
    expect(slice(d.text, t2)).toBe('#Japan');
    expect(t2.features[0]).toEqual({ $type: 'app.bsky.richtext.facet#tag', tag: 'Japan' });
    expect(d.alt).toMatch(/^sisma\.io earthquake card\. Map of the area around a magnitude 6\.4 earthquake, Japan: the epicentre is a ringed red dot/);
    expect(d.alt).toMatch(/6 Nov, 03:01 UTC, depth 35 km, coordinates .+, source USGS\. Not an official warning service\.$/);
  });
  it('mentions tsunami information and uses multi-word country tags', () => {
    const d = draftPost(q({ tsunami: true, region: 'Wellington, New Zealand', lat: -41.3, lon: 174.8 }));
    expect(d.text).toContain('Tsunami information issued: follow official warnings.');
    expect(d.text).toMatch(/#earthquake #NewZealand\n/);
    // Far from any coast there is no country: only #earthquake.
    expect(draftPost(q({ region: 'Kermadec Islands region', lat: -30, lon: -178 })).text).toMatch(/\n#earthquake\n/);
  });
  it('shortens a very long place to fit 300 graphemes and keeps the link intact', () => {
    const d = draftPost(q({ region: 'Ü'.repeat(400) }));
    expect(g(d.text)).toBeLessThanOrEqual(BLUESKY_MAX_GRAPHEMES);
    expect(d.text).toContain(eventUrl(q()));
    expect(slice(d.text, d.facets[0])).toBe(eventUrl(q()));
  });
});

describe('automatic selection', () => {
  const row = (o: Partial<PostRow>): PostRow => ({ quake_id: 'x', quake_time: new Date(q().time).toISOString(), lat: 37.5, lon: 141.5, mag: 6.4, status: 'posted', ...o });
  it('takes recent events at or above the minimum, largest first, at most 2', () => {
    const list = [q({ id: 'a', mag: 6.1, lat: 0 }), q({ id: 'b', mag: 7.0, lat: 10 }), q({ id: 'c', mag: 5.9, lat: 20 }), q({ id: 'd', mag: 6.5, lat: 30 })];
    expect(autoCandidates(list, 6, [], NOW).map(x => x.id)).toEqual(['b', 'd']);
  });
  it('skips old events (no backlog when switched on)', () => {
    expect(autoCandidates([q({ time: NOW - 31 * 60_000 })], 6, [], NOW)).toEqual([]);
  });
  it('skips the same event already posted under another agency id, but not a failed one', () => {
    const emsc = q({ id: 'emsc:2026abc', time: q().time + 30_000, lat: 37.6 });
    expect(alreadyPosted(emsc, [row({ quake_id: 'usgs:us7000abcd' })])).toBe(true);
    expect(alreadyPosted(emsc, [row({ quake_id: 'usgs:us7000abcd', status: 'failed' })])).toBe(false);
    expect(alreadyPosted(q(), [row({ quake_id: 'usgs:us7000abcd', status: 'failed' })])).toBe(true); // same id: retried by hand only
  });
});
