// Discover (Me → Administration): geoscience posts by other people on Bluesky, found with the signed-in sisma account,
// for an administrator to read and, by hand, like, repost or follow. Nothing here acts on its own.
//
// Search: app.bsky.feed.searchPosts, once per saved term (hashtags like "#geosky" and words like "seismic"), newest
// first; results are merged, the account's own posts and posts with adult or graphic content labels are left out, and
// each post keeps the terms that found it. The request goes to the account's own server (as the official client does),
// which passes app.bsky.* requests on to the Bluesky app view; being signed in also returns whether the account
// already likes or reposts each post and follows its author.
// Actions: like / repost / follow create a record in the account's repo (app.bsky.feed.like, app.bsky.feed.repost,
// app.bsky.graph.follow); undoing deletes that record by its key.
import type { SupabaseClient } from '@supabase/supabase-js';
import { authFor, xrpc } from './bluesky';

export const DEFAULT_TERMS = ['#geosky', '#sciencesky', '#earthquake', '#seismology', '#volcano', '#tsunami', '#geology',
  'earthquake', 'seismic', 'magnitude', 'fault', 'volcanic'];
export const MAX_TERMS = 20;
const MAX_TERM_LENGTH = 64;
const PER_TERM = 25;
const MAX_RESULTS = 100;
/** Content labels whose posts are not listed. */
const HIDDEN_LABELS = new Set(['porn', 'sexual', 'nudity', 'graphic-media', 'gore', '!hide', '!warn']);

/** Saved terms: trimmed, no empty or overlong ones, no duplicates (ignoring case), at most MAX_TERMS. */
export function normalizeTerms(list: unknown): string[] | null {
  if (!Array.isArray(list)) return null;
  const seen = new Set<string>(), out: string[] = [];
  for (const raw of list) {
    if (typeof raw !== 'string') return null;
    const t = raw.trim().replace(/\s+/g, ' ');
    if (!t || t.length > MAX_TERM_LENGTH || t === '#') continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k); out.push(t);
  }
  return out.slice(0, MAX_TERMS);
}

/** The record key at the end of an at:// uri. */
export const rkeyOf = (uri: string) => uri.split('/').pop() ?? '';

interface Label { val: string }
export interface PostView {
  uri: string; cid: string; indexedAt: string;
  author: { did: string; handle: string; displayName?: string; avatar?: string; viewer?: { following?: string }; labels?: Label[] };
  record: { text?: string; createdAt?: string; langs?: string[]; reply?: unknown };
  embed?: { $type?: string; images?: { thumb?: string; alt?: string }[]; external?: { uri?: string; title?: string; thumb?: string } };
  likeCount?: number; repostCount?: number; replyCount?: number; quoteCount?: number;
  viewer?: { like?: string; repost?: string };
  labels?: Label[];
}

export interface FoundPost {
  uri: string; cid: string; url: string; text: string; createdAt: string; langs: string[]; reply: boolean;
  author: { did: string; handle: string; name: string | null; avatar: string | null; following: string | null };
  image: { thumb: string; alt: string } | null;
  link: { uri: string; title: string } | null;
  likes: number; reposts: number; replies: number;
  liked: string | null; reposted: string | null;
  terms: string[];
}

function toFound(p: PostView): FoundPost {
  const img = p.embed?.images?.[0];
  const ext = p.embed?.external;
  return {
    uri: p.uri, cid: p.cid, url: `https://bsky.app/profile/${p.author.handle}/post/${rkeyOf(p.uri)}`,
    text: p.record.text ?? '', createdAt: p.record.createdAt ?? p.indexedAt, langs: p.record.langs ?? [], reply: !!p.record.reply,
    author: { did: p.author.did, handle: p.author.handle, name: p.author.displayName?.trim() || null, avatar: p.author.avatar ?? null, following: p.author.viewer?.following ?? null },
    image: img?.thumb ? { thumb: img.thumb, alt: img.alt ?? '' } : null,
    link: ext?.uri ? { uri: ext.uri, title: ext.title ?? ext.uri } : null,
    likes: p.likeCount ?? 0, reposts: p.repostCount ?? 0, replies: p.replyCount ?? 0,
    liked: p.viewer?.like ?? null, reposted: p.viewer?.repost ?? null,
    terms: [],
  };
}

/**
 * Merges the results of each term: one entry per post (with every term that found it), newest first, without the
 * account's own posts or posts labelled as adult or graphic content.
 */
export function mergeResults(byTerm: { term: string; posts: PostView[] }[], ownDid: string, max = MAX_RESULTS): FoundPost[] {
  const out = new Map<string, FoundPost>();
  for (const { term, posts } of byTerm) {
    for (const p of posts) {
      if (p.author.did === ownDid) continue;
      if ([...(p.labels ?? []), ...(p.author.labels ?? [])].some(l => HIDDEN_LABELS.has(l.val))) continue;
      const f = out.get(p.uri) ?? toFound(p);
      if (!f.terms.includes(term)) f.terms.push(term);
      out.set(p.uri, f);
    }
  }
  return [...out.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, max);
}

/** Searches Bluesky for each term with the signed-in account; `failed` lists the terms whose search failed. */
export async function discover(db: SupabaseClient, terms: string[]): Promise<{ handle: string; posts: FoundPost[]; failed: string[] }> {
  const s = await authFor(db);
  const auth = { authorization: `Bearer ${s.accessJwt}` };
  const failed: string[] = [];
  const byTerm = await Promise.all(terms.map(async term => {
    const qs = new URLSearchParams({ q: term, sort: 'latest', limit: String(PER_TERM) });
    try {
      const r = await xrpc<{ posts: PostView[] }>(s.service, `app.bsky.feed.searchPosts?${qs}`, { headers: auth });
      return { term, posts: r.posts ?? [] };
    } catch (e) {
      console.error('bluesky discover', term, e);
      failed.push(term);
      return { term, posts: [] };
    }
  }));
  return { handle: s.handle, posts: mergeResults(byTerm, s.did), failed };
}

export type DiscoverAction = 'like' | 'unlike' | 'repost' | 'unrepost' | 'follow' | 'unfollow';
export const ACTIONS: DiscoverAction[] = ['like', 'unlike', 'repost', 'unrepost', 'follow', 'unfollow'];
const COLLECTION: Record<DiscoverAction, string> = {
  like: 'app.bsky.feed.like', unlike: 'app.bsky.feed.like', repost: 'app.bsky.feed.repost', unrepost: 'app.bsky.feed.repost',
  follow: 'app.bsky.graph.follow', unfollow: 'app.bsky.graph.follow',
};

/** What an action needs: the post (uri + cid) to like or repost, the author's DID to follow, or the record to undo. */
export interface ActionTarget { uri?: string; cid?: string; did?: string; record?: string }

/** Checks an action's target before anything is sent; returns the reason it can't be done, or null. */
export function actionProblem(action: DiscoverAction, t: ActionTarget, ownDid?: string): string | null {
  if (action === 'like' || action === 'repost') return t.uri?.startsWith('at://') && t.cid ? null : 'bad_post';
  if (action === 'follow') return t.did?.startsWith('did:') ? (t.did === ownDid ? 'self' : null) : 'bad_account';
  // Undo: the record must be one of this account's own records in the right collection.
  const r = t.record ?? '';
  return r.startsWith('at://') && r.split('/')[3] === COLLECTION[action] && (!ownDid || r.split('/')[2] === ownDid) ? null : 'bad_record';
}

/** Likes, reposts or follows (returns the new record's uri), or undoes one (returns null). */
export async function engage(db: SupabaseClient, action: DiscoverAction, t: ActionTarget): Promise<string | null> {
  const s = await authFor(db);
  const problem = actionProblem(action, t, s.did);
  if (problem) throw new Error(problem);
  const headers = { authorization: `Bearer ${s.accessJwt}`, 'content-type': 'application/json' };
  const collection = COLLECTION[action];
  if (action === 'unlike' || action === 'unrepost' || action === 'unfollow') {
    await xrpc(s.service, 'com.atproto.repo.deleteRecord', { method: 'POST', headers, body: JSON.stringify({ repo: s.did, collection, rkey: rkeyOf(t.record!) }) });
    return null;
  }
  const createdAt = new Date().toISOString();
  const record = action === 'follow'
    ? { $type: collection, subject: t.did, createdAt }
    : { $type: collection, subject: { uri: t.uri, cid: t.cid }, createdAt };
  const r = await xrpc<{ uri: string }>(s.service, 'com.atproto.repo.createRecord', { method: 'POST', headers, body: JSON.stringify({ repo: s.did, collection, record }) });
  return r.uri;
}
