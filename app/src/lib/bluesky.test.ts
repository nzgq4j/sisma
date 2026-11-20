import { describe, expect, it } from 'vitest';
import { fitPlace, alreadyPosted, autoCandidates, BLUESKY_MAX_GRAPHEMES, CARD_WAIT_MS, cardWait, draftPost, draftTsunamiPost, eventUrl, tsunamiCandidates, tsunamiKey, TSUNAMI_POST_MAX_AGE_MS, type PostRow } from './bluesky';
import type { Incident } from './tsunami/alerts';
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
      'Not an official warning service',
    ]);
    // "·" is 2 bytes in UTF-8: the ranges must be byte offsets, not character offsets.
    const [link, t1, t2] = d.facets;
    expect(slice(d.text, link)).toBe(eventUrl(q()));
    expect(link.features[0]).toEqual({ $type: 'app.bsky.richtext.facet#link', uri: 'https://sisma.io/app/map?focus=usgs%3Aus7000abcd' });
    expect(slice(d.text, t1)).toBe('#earthquake');
    expect(slice(d.text, t2)).toBe('#Japan');
    expect(t2.features[0]).toEqual({ $type: 'app.bsky.richtext.facet#tag', tag: 'Japan' });
    expect(d.alt).toMatch(/^sisma\.io earthquake card\. Map of the area around a magnitude 6\.4 earthquake, Japan: the epicentre is a ringed dot in the magnitude colour, other earthquakes/);
    expect(d.alt).toMatch(/6 Nov, 03:01 UTC, depth 35 km, coordinates .+, source USGS\. Not an official warning service\.$/);
  });
  it('mentions tsunami information and uses multi-word country tags', () => {
    const d = draftPost(q({ tsunami: true, region: 'Wellington, New Zealand', lat: -41.3, lon: 174.8 }));
    expect(d.text).toContain('Large earthquake under the sea: check official tsunami information.');
    expect(d.text).toMatch(/#earthquake #NewZealand\n/);
    // Far from any coast there is no country: only #earthquake.
    expect(draftPost(q({ region: 'Kermadec Islands region', lat: -30, lon: -178 })).text).toMatch(/\n#earthquake\n/);
  });
  it('names the official tsunami alert, with #tsunami while it is in effect', () => {
    const alert = { incident: 'ptwc:1', level: 'warning' as const, center: 'PTWC' as const, status: 'active' as const, title: 'Tsunami Warning', issued: 0, url: 'https://www.tsunami.gov/x.txt', areas: [] };
    const d = draftPost(q({ tsunami: true, tsunamiAlert: alert }));
    expect(d.text).toContain('\nTsunami warning · PTWC. Follow local authorities.\n');
    expect(d.text).toMatch(/#earthquake #tsunami #Japan\n/);
    expect(slice(d.text, d.facets[2])).toBe('#tsunami');
    expect(d.alt).toContain('A label at the top left of the map reads “Tsunami warning · PTWC”. Not an official warning service.');
    const ended = draftPost(q({ tsunamiAlert: { ...alert, level: 'information', status: 'ended' } }));
    expect(ended.text).toContain('\nTsunami information · PTWC · No longer in effect\n');
    expect(ended.text).not.toContain('#tsunami');
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

describe('cardWait', () => {
  it('lets a new event wait for its card, then posts without it', () => {
    const now = Date.UTC(2026, 10, 5, 17, 30);
    expect(cardWait({ time: now - 60_000 }, now)).toBe(true);
    expect(cardWait({ time: now - CARD_WAIT_MS + 1 }, now)).toBe(true);
    expect(cardWait({ time: now - CARD_WAIT_MS }, now)).toBe(false);
  });
});

describe('jwtExpiry', () => {
  it('reads exp from the payload, 0 when unreadable', async () => {
    const { jwtExpiry } = await import('./bluesky');
    const t = `h.${Buffer.from(JSON.stringify({ exp: 1_800_000_000 })).toString('base64url')}.s`;
    expect(jwtExpiry(t)).toBe(1_800_000_000_000);
    expect(jwtExpiry('not-a-jwt')).toBe(0);
  });
});

describe('tsunami reports', () => {
  const inc = (o: Partial<Incident> = {}): Incident => ({ incident: 'ptwc:1', level: 'warning', center: 'PTWC', status: 'active', title: 'Tsunami Warning',
    issued: NOW - 5 * 60_000, url: 'https://www.tsunami.gov/events/PHEB/2026/11/06/1/WEPA40.txt', areas: [], origin: Date.parse('2026-11-06T03:01:00Z'),
    lat: 37.5, lon: 141.5, mag: 6.5, place: 'OFF EAST COAST OF HONSHU JAPAN', ...o });

  it('keys one post per event, level and cancellation', () => {
    expect(tsunamiKey(inc())).toBe('ptwc:1|warning|a');
    expect(tsunamiKey(inc({ status: 'ended' }))).toBe('ptwc:1|warning|a');
    expect(tsunamiKey(inc({ status: 'cancelled' }))).toBe('ptwc:1|warning|c');
  });

  it('posts new reports only, most serious first, at most two a run, never old ones', () => {
    const list = [inc({ incident: 'a', level: 'information' }), inc({ incident: 'b' }), inc({ incident: 'c', level: 'advisory' }),
      inc({ incident: 'd', level: 'major_warning', issued: NOW - TSUNAMI_POST_MAX_AGE_MS - 1 })];
    expect(tsunamiCandidates(list, new Set(), NOW).map(i => i.incident)).toEqual(['b', 'c']);
    expect(tsunamiCandidates(list, new Set(['b|warning|a', 'c|advisory|a']), NOW).map(i => i.incident)).toEqual(['a']);
  });

  it('posts earthquakes with a tsunami report whatever their magnitude, first', () => {
    const alert = { incident: 'ptwc:1', level: 'information' as const, center: 'PTWC' as const, status: 'active' as const, title: '', issued: 0, url: '', areas: [] };
    const list = [q({ id: 'big', mag: 6.8 }), q({ id: 'small', mag: 4.2, tsunamiAlert: alert, lat: 10, lon: 10 })];
    expect(autoCandidates(list, 6, [], NOW).map(x => x.id)).toEqual(['small', 'big']);
  });

  it('writes the post with the earthquake, or from the message alone', () => {
    const d = draftTsunamiPost(inc(), q());
    expect(d.text.split('\n').slice(0, 4)).toEqual(['Tsunami warning · PTWC. Follow local authorities.', 'M6.4 earthquake · Japan', '6 Nov, 03:01 UTC',
      'Official message: tsunami.gov']);
    expect(d.text).toContain(`Map and details: ${eventUrl(q())}`);
    expect(d.text).toMatch(/\n#tsunami #earthquake #Japan\nNot an official warning service$/);
    expect(d.facets.map(f => slice(d.text, f))).toEqual(['tsunami.gov', eventUrl(q()), '#tsunami', '#earthquake', '#Japan']);
    expect(d.facets[0].features[0]).toEqual({ $type: 'app.bsky.richtext.facet#link', uri: 'https://www.tsunami.gov/events/PHEB/2026/11/06/1/WEPA40.txt' });
    expect(d.alt).toContain('reads “Tsunami warning · PTWC”');
    expect(g(d.text)).toBeLessThanOrEqual(BLUESKY_MAX_GRAPHEMES);
    const alone = draftTsunamiPost(inc({ level: 'advisory', status: 'cancelled', mag: null }), null);
    expect(alone.text).toMatch(/^Tsunami advisory · PTWC · Cancelled\nEarthquake · OFF EAST COAST OF HONSHU JAPAN\n/);
    expect(alone.text).not.toContain('Map and details');
    expect(alone.alt).toBe('');
  });
});

describe('fitting the place name', () => {
  it('always ends, even when the post can never fit', () => {
    const r = fitPlace('United States', () => 'x'.repeat(400));
    expect(r.place).toBe('United S…');
    expect(fitPlace('A'.repeat(50), p => p + 'y'.repeat(260)).text.length).toBeLessThanOrEqual(300);
  });

  it('fits the follow-up for a long NTWC report (the 20 Nov Pinnacles event)', () => {
    const i: Incident = { incident: 'ntwc:tosga4', level: 'information', center: 'NTWC', status: 'ended', title: 'Tsunami Information', issued: NOW,
      url: 'https://www.tsunami.gov/events/PAAQ/2026/11/20/tosga4/1/WEPA43/WEPA43.txt', areas: [], origin: NOW, lat: 36.6, lon: -121.2, mag: 4.9,
      place: '30 miles SE of Monterey, California' };
    const d = draftTsunamiPost(i, q({ id: 'usgs:nc75468702', region: 'United States', lat: 36.6, lon: -121.2, mag: 5 }));
    expect(g(d.text)).toBeLessThanOrEqual(BLUESKY_MAX_GRAPHEMES);
    expect(d.text).toContain('M5.0 earthquake · United States');
    expect(d.text).toContain('Tsunami information · NTWC · No longer in effect');
  });
});
