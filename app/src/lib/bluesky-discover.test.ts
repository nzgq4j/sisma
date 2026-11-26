import { describe, expect, it } from 'vitest';
import { actionProblem, DEFAULT_TERMS, MAX_TERMS, mergeResults, normalizeTerms, rkeyOf, type PostView } from './bluesky-discover';

const ME = 'did:plc:sisma';
const post = (id: string, did: string, at: string, extra: Partial<PostView> = {}): PostView => ({
  uri: `at://${did}/app.bsky.feed.post/${id}`, cid: `cid-${id}`, indexedAt: at,
  author: { did, handle: `${did.split(':').pop()}.bsky.social`, displayName: 'Someone' },
  record: { text: `post ${id}`, createdAt: at }, likeCount: 3, ...extra,
});

describe('normalizeTerms', () => {
  it('trims, drops empty and duplicate terms (ignoring case) and caps the list', () => {
    expect(normalizeTerms([' #GeoSky ', '#geosky', '', '#', 'seismic  waves', 7 as unknown as string])).toBeNull();
    expect(normalizeTerms([' #GeoSky ', '#geosky', '', '#', 'seismic  waves'])).toEqual(['#GeoSky', 'seismic waves']);
    expect(normalizeTerms(Array.from({ length: 30 }, (_, i) => `t${i}`))).toHaveLength(MAX_TERMS);
    expect(normalizeTerms('x')).toBeNull();
  });
  it('keeps the defaults as they are', () => {
    expect(normalizeTerms(DEFAULT_TERMS)).toEqual(DEFAULT_TERMS);
  });
});

describe('mergeResults', () => {
  it('lists each post once with every term that found it, newest first, without own or labelled posts', () => {
    const a = post('a', 'did:plc:a', '2026-11-25T10:00:00Z');
    const b = post('b', 'did:plc:b', '2026-11-25T12:00:00Z', { viewer: { like: 'at://did:plc:sisma/app.bsky.feed.like/1' } });
    const mine = post('m', ME, '2026-11-25T13:00:00Z');
    const adult = post('x', 'did:plc:x', '2026-11-25T14:00:00Z', { labels: [{ val: 'porn' }] });
    const r = mergeResults([{ term: '#geosky', posts: [a, b, mine, adult] }, { term: 'seismic', posts: [a] }], ME);
    expect(r.map(p => p.uri)).toEqual([b.uri, a.uri]);
    expect(r[1].terms).toEqual(['#geosky', 'seismic']);
    expect(r[0].liked).toBe('at://did:plc:sisma/app.bsky.feed.like/1');
    expect(r[0].url).toBe('https://bsky.app/profile/b.bsky.social/post/b');
  });
});

describe('actions', () => {
  it('needs a post for like and repost, an account for follow, and its own record to undo', () => {
    expect(actionProblem('like', { uri: 'at://did:plc:a/app.bsky.feed.post/1', cid: 'c' })).toBeNull();
    expect(actionProblem('repost', { uri: 'https://x' })).toBe('bad_post');
    expect(actionProblem('follow', { did: 'did:plc:a' }, ME)).toBeNull();
    expect(actionProblem('follow', { did: ME }, ME)).toBe('self');
    expect(actionProblem('unlike', { record: 'at://did:plc:sisma/app.bsky.feed.like/3k' }, ME)).toBeNull();
    expect(actionProblem('unlike', { record: 'at://did:plc:sisma/app.bsky.feed.repost/3k' }, ME)).toBe('bad_record');
    expect(actionProblem('unfollow', { record: 'at://did:plc:other/app.bsky.graph.follow/3k' }, ME)).toBe('bad_record');
    expect(rkeyOf('at://did:plc:a/app.bsky.feed.post/3kxyz')).toBe('3kxyz');
  });
});
