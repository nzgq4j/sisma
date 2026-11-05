// Automatic Bluesky posts for significant earthquakes (administrators turn it on and set the minimum magnitude in
// Me → Admin). Each post has the event's share card (GET /api/share-card) with alt text, a short text with a link to
// the event's region view and hashtags, and a line saying it is automated and not an official warning.
// Posting uses the AT Protocol XRPC endpoints directly (createSession, uploadBlob, createRecord; formats checked against
// the app.bsky / com.atproto lexicons). The account is signed in from Me → Administration (session kept in Supabase
// Vault, never the password); BLUESKY_IDENTIFIER / BLUESKY_APP_PASSWORD (+ optional BLUESKY_SERVICE) in the server env
// are the fallback. docs/bluesky-setup.md
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Quake } from './quakes/types';
import { countryAt } from './country';
import { distanceKm, formatDms } from './geo';
import { KM_PER_MI } from './units';
import { SITE } from './site';

export const BLUESKY_MAX_GRAPHEMES = 300;
/** Blobs above this are not attached (the lexicon allows 2 MB; staying well under it). */
export const BLUESKY_MAX_IMAGE_BYTES = 1_000_000;
const CARD_W = 1080, CARD_H = 1350;
/** Automatic posting only considers events this recent, so switching it on never posts a backlog. */
export const AUTO_MAX_AGE_MS = 30 * 60_000;
/** At most this many automatic posts per run (one run a minute). */
export const AUTO_MAX_PER_RUN = 2;
const SAME_EVENT_MS = 90_000, SAME_EVENT_KM = 100;


export const eventUrl = (q: Pick<Quake, 'id'>) => `${SITE.url}/app/map?focus=${encodeURIComponent(q.id)}`;

const graphemes = (s: string) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
const bytes = (s: string) => Buffer.byteLength(s, 'utf8');
const countryName = (code: string | null) => {
  if (!code) return null;
  try { return new Intl.DisplayNames('en', { type: 'region' }).of(code.toUpperCase()) ?? null; } catch { return null; }
};
/** "New Zealand" → "NewZealand"; letters and digits only (Bluesky tags end at punctuation). */
const tagOf = (name: string) => name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, '');

export interface Facet { index: { byteStart: number; byteEnd: number }; features: ({ $type: 'app.bsky.richtext.facet#link'; uri: string } | { $type: 'app.bsky.richtext.facet#tag'; tag: string })[] }
export interface PostDraft { text: string; facets: Facet[]; alt: string; url: string; place: string }

const time = (ms: number) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(ms);
const depth = (km: number) => `${Math.round(km)} km (${Math.round(km / KM_PER_MI)} mi) deep`;

/** Text (≤ 300 graphemes), link and hashtag facets, and alt text for one event. English: the account's language. */
export function draftPost(q: Quake): PostDraft {
  const country = countryName(countryAt(q.lat, q.lon)?.code ?? null);
  const url = eventUrl(q);
  const mag = `M${q.mag.toFixed(1)}`;
  const tags = ['earthquake', ...(country ? [tagOf(country)] : [])].filter(t => t && graphemes(t) <= 64);
  const build = (place: string) => {
    const lines = [
      `${mag} earthquake · ${place}`,
      `${time(q.time)} UTC · ${depth(q.depthKm)}`,
      ...(q.tsunami ? ['Tsunami information issued: follow official warnings.'] : []),
      `Map and details: ${url}`,
      tags.map(t => `#${t}`).join(' '),
      'Automated post · not an official warning service',
    ];
    return lines.join('\n');
  };
  // Shorten the place name until the post fits (the URL and the rest are fixed).
  let place = (q.region || q.title || 'Unknown location').trim();
  let text = build(place);
  while ((graphemes(text) > BLUESKY_MAX_GRAPHEMES || bytes(text) > 3000) && place.length > 8) {
    place = place.slice(0, Math.max(8, place.length - 10)).trimEnd() + '…';
    text = build(place);
  }
  const facets: Facet[] = [];
  const at = (needle: string, from = 0) => {
    const i = text.indexOf(needle, from);
    return i < 0 ? null : { byteStart: bytes(text.slice(0, i)), byteEnd: bytes(text.slice(0, i)) + bytes(needle), end: i + needle.length };
  };
  const link = at(url);
  if (link) facets.push({ index: { byteStart: link.byteStart, byteEnd: link.byteEnd }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }] });
  let from = link?.end ?? 0;
  for (const t of tags) {
    const hit = at(`#${t}`, from);
    if (!hit) continue;
    facets.push({ index: { byteStart: hit.byteStart, byteEnd: hit.byteEnd }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: t }] });
    from = hit.end;
  }
  // Describes the share card as drawn (app/api/share-card): map with the event as a ringed dot, other events of the last
  // 7 days as coloured dots, plate boundaries as dashed lines, then the details and the disclaimer.
  const source = [q.source, ...(q.alsoIn ?? [])].map(x => x.toUpperCase()).join(', ');
  const alt = `sisma.io earthquake card. Map of the area around a magnitude ${q.mag.toFixed(1)} earthquake, ${place}: `
    + `the epicentre is a ringed dot in the magnitude colour, other earthquakes from the last 7 days are coloured dots, and dashed lines, where present, `
    + `mark tectonic plate boundaries. ${time(q.time)} UTC, depth ${Math.round(q.depthKm)} km, coordinates ${formatDms(q.lat, q.lon)}, `
    + `source ${source}. Not an official warning service.`;
  return { text, facets, alt, url, place };
}

// --- AT Protocol client ---
// Credentials, in this order: the account signed in from Me → Administration (its session, never the password, kept
// encrypted in Supabase Vault: public.bluesky_session_get/set), then the BLUESKY_IDENTIFIER / BLUESKY_APP_PASSWORD env.
export const DEFAULT_SERVICE = 'https://bsky.social';
export interface StoredSession { service: string; did: string; handle: string; accessJwt: string; refreshJwt: string }
interface Auth { service: string; did: string; handle: string; accessJwt: string; source: 'account' | 'env' }

/** An error answered by the Bluesky server; `code` is its error name (e.g. AuthFactorTokenRequired) or HTTP_<status>. */
export class BlueskyError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

async function xrpc<T>(base: string, method: string, init: RequestInit): Promise<T> {
  let r: Response;
  try { r = await fetch(`${base.replace(/\/$/, '')}/xrpc/${method}`, init); } catch (e) { throw new BlueskyError('unreachable', `${method}: ${String((e as Error)?.message ?? e)}`); }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new BlueskyError(j.error || `HTTP_${r.status}`, `${method} ${r.status}${j.error ? ` ${j.error}` : ''}${j.message ? `: ${j.message}` : ''}`);
  }
  return (await r.json()) as T;
}

/** Expiry (ms) of a JWT, from its payload; 0 when unreadable. */
export function jwtExpiry(jwt: string): number {
  try { const exp = (JSON.parse(Buffer.from(jwt.split('.')[1] ?? '', 'base64url').toString()) as { exp?: number }).exp; return typeof exp === 'number' ? exp * 1000 : 0; } catch { return 0; }
}

const envConfigured = () => !!(process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD);
const envService = () => process.env.BLUESKY_SERVICE || DEFAULT_SERVICE;

async function storedSession(db: SupabaseClient): Promise<StoredSession | null> {
  const { data, error } = await db.rpc('bluesky_session_get');
  if (error || !data) return null;
  const s = data as StoredSession;
  return s.refreshJwt && s.did ? s : null;
}
const saveSession = async (db: SupabaseClient, s: StoredSession | null) => {
  const { error } = await db.rpc('bluesky_session_set', { p_session: s });
  if (error) throw new Error('could not save the Bluesky session');
};

/** Where posting credentials come from now: the signed-in account, the env, or nowhere. */
export async function blueskySource(db: SupabaseClient): Promise<'account' | 'env' | null> {
  if (await storedSession(db)) return 'account';
  return envConfigured() ? 'env' : null;
}

/** Signs in (the password is used for this request only) and stores the session. */
export async function connectAccount(db: SupabaseClient, identifier: string, password: string, service: string, by: string) {
  const s = await xrpc<StoredSession>(service, 'com.atproto.server.createSession', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier, password }),
  });
  await saveSession(db, { service, did: s.did, handle: s.handle, accessJwt: s.accessJwt, refreshJwt: s.refreshJwt });
  await db.from('bluesky_settings').update({ account_handle: s.handle, account_did: s.did, connected_at: new Date().toISOString(), connected_by: by, last_error: null }).eq('id', 1);
  return { handle: s.handle, did: s.did };
}

/** Signs out on Bluesky (ends the session there too) and forgets it. */
export async function disconnectAccount(db: SupabaseClient) {
  const s = await storedSession(db);
  if (s) await xrpc(s.service, 'com.atproto.server.deleteSession', { method: 'POST', headers: { authorization: `Bearer ${s.refreshJwt}` } }).catch(() => undefined);
  await saveSession(db, null);
  await db.from('bluesky_settings').update({ account_handle: null, account_did: null, connected_at: null, connected_by: null, last_error: null }).eq('id', 1);
}

/**
 * A usable access token: the stored session (renewed with its refresh token when it is about to expire; Bluesky
 * rotates the refresh token, so the new pair is saved), else a session from the env credentials.
 */
async function authFor(db: SupabaseClient, now = Date.now()): Promise<Auth> {
  const s = await storedSession(db);
  if (s) {
    if (jwtExpiry(s.accessJwt) > now + 5 * 60_000) return { ...s, source: 'account' };
    try {
      const r = await xrpc<StoredSession>(s.service, 'com.atproto.server.refreshSession', { method: 'POST', headers: { authorization: `Bearer ${s.refreshJwt}` } });
      const next = { service: s.service, did: r.did, handle: r.handle, accessJwt: r.accessJwt, refreshJwt: r.refreshJwt };
      await saveSession(db, next);
      if (r.handle !== s.handle) await db.from('bluesky_settings').update({ account_handle: r.handle }).eq('id', 1);
      return { ...next, source: 'account' };
    } catch (e) {
      // Expired or revoked (e.g. the app password was deleted): say so on the admin page; sign in again to fix.
      await db.from('bluesky_settings').update({ last_error: String((e as Error)?.message ?? e).slice(0, 300) }).eq('id', 1);
      if (!envConfigured()) throw e;
    }
  }
  if (!envConfigured()) throw new BlueskyError('not_configured', 'Bluesky is not connected');
  const base = envService();
  const r = await xrpc<StoredSession>(base, 'com.atproto.server.createSession', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: process.env.BLUESKY_IDENTIFIER, password: process.env.BLUESKY_APP_PASSWORD }),
  });
  return { service: base, did: r.did, handle: r.handle, accessJwt: r.accessJwt, source: 'env' };
}

/** Checks that posting would work now: gets a token and asks Bluesky who it belongs to. */
export async function checkConnection(db: SupabaseClient): Promise<{ handle: string; source: 'account' | 'env' }> {
  const a = await authFor(db);
  const me = await xrpc<{ handle: string; did: string }>(a.service, 'com.atproto.server.getSession', { headers: { authorization: `Bearer ${a.accessJwt}` } });
  // The saved account works again: clear its error (not when the env credentials stood in for it).
  if (a.source === 'account') await db.from('bluesky_settings').update({ last_error: null }).eq('id', 1);
  return { handle: me.handle, source: a.source };
}

/**
 * The share card for an event (English, km, UTC), or null if it could not be made or is too large. Drawn here from the
 * event the job already has (lib/share-card.tsx), not fetched from /api/share-card by id: a new event may not be found
 * there yet under the same id (feeds disagree for the first minutes), which left the first automatic posts without a card.
 * `known`: events already loaded (the job's last day), added to the week's events for the dots around it.
 */
export async function card(q: Quake, known: Quake[] = []): Promise<Uint8Array | null> {
  try {
    const [{ shareCardResponse }, { recentQuakes }] = await Promise.all([import('./share-card'), import('./quakes/find')]);
    const week = await recentQuakes(7).catch(() => [] as Quake[]);
    const seen = new Set<string>([q.id]);
    const all = [q, ...[...known, ...week].filter(x => !seen.has(x.id) && (seen.add(x.id), true))];
    const r = await shareCardResponse({ q, all, locale: 'en', units: 'km', tz: 'UTC', origin: SITE.url });
    if (!r.ok || !r.headers.get('content-type')?.startsWith('image/png')) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    return buf.byteLength <= BLUESKY_MAX_IMAGE_BYTES ? buf : null;
  } catch (e) {
    console.error('bluesky card', q.id, e);
    return null;
  }
}

/** Publishes the post; returns its at:// uri and its bsky.app link. `png`: the card if already made (null: none). */
export async function publish(db: SupabaseClient, q: Quake, draft: PostDraft, png?: Uint8Array | null): Promise<{ uri: string; url: string; image: boolean }> {
  const s = await authFor(db);
  const auth = { authorization: `Bearer ${s.accessJwt}` };
  if (png === undefined) png = await card(q);
  let embed: object | undefined;
  if (png) {
    const { blob } = await xrpc<{ blob: object }>(s.service, 'com.atproto.repo.uploadBlob', { method: 'POST', headers: { ...auth, 'content-type': 'image/png' }, body: png as BodyInit });
    embed = { $type: 'app.bsky.embed.images', images: [{ image: blob, alt: draft.alt, aspectRatio: { width: CARD_W, height: CARD_H } }] };
  }
  const record = { $type: 'app.bsky.feed.post', text: draft.text, facets: draft.facets, langs: ['en'], createdAt: new Date().toISOString(), ...(embed ? { embed } : {}) };
  const res = await xrpc<{ uri: string }>(s.service, 'com.atproto.repo.createRecord', {
    method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ repo: s.did, collection: 'app.bsky.feed.post', record }),
  });
  const rkey = res.uri.split('/').pop();
  return { uri: res.uri, url: `https://bsky.app/profile/${s.handle}/post/${rkey}`, image: !!png };
}

// --- Posting with the database (service role) ---
export interface PostRow { quake_id: string; quake_time: string; lat: number; lon: number; mag: number; status: string }

/** Events already posted (or being posted), including the same event under another agency's id. */
export function alreadyPosted(q: Quake, rows: Pick<PostRow, 'quake_id' | 'quake_time' | 'lat' | 'lon' | 'status'>[]): boolean {
  return rows.some(r => r.quake_id === q.id
    || (r.status !== 'failed' && Math.abs(Date.parse(r.quake_time) - q.time) < SAME_EVENT_MS && distanceKm(r.lat, r.lon, q.lat, q.lon) < SAME_EVENT_KM));
}

/** How long a new event's automatic post waits for its card before it is posted as text only. */
export const CARD_WAIT_MS = 15 * 60_000;
/** True while an event without a card should still wait for it. */
export const cardWait = (q: Pick<Quake, 'time'>, now: number) => now - q.time < CARD_WAIT_MS;

/** Which recent events the automatic posting would post now (largest first). */
export function autoCandidates(quakes: Quake[], minMagnitude: number, rows: PostRow[], now: number): Quake[] {
  return quakes
    .filter(q => q.mag >= minMagnitude && q.time <= now + 60_000 && now - q.time <= AUTO_MAX_AGE_MS && !alreadyPosted(q, rows))
    .sort((a, b) => b.mag - a.mag)
    .slice(0, AUTO_MAX_PER_RUN);
}

export type PostOutcome = { ok: true; url: string; image: boolean } | { ok: false; error: string };

/** Claims the event (one post per event), posts it and records the result. A failed post can be posted again by hand. */
export async function postQuake(db: SupabaseClient, q: Quake, opts: { manual: boolean; by?: string | null; png?: Uint8Array | null }): Promise<PostOutcome> {
  const draft = draftPost(q);
  const row = {
    quake_id: q.id, quake_time: new Date(q.time).toISOString(), lat: q.lat, lon: q.lon, mag: Math.round(q.mag * 10) / 10,
    place: draft.place.slice(0, 200), text: draft.text, alt: draft.alt, status: 'posting', error: null,
    manual: opts.manual, posted_by: opts.by ?? null,
  };
  // Claim: insert, or take over a failed attempt. Anything else means it is posted or being posted.
  const ins = await db.from('bluesky_posts').insert(row);
  if (ins.error) {
    const retry = await db.from('bluesky_posts').update(row).eq('quake_id', q.id).eq('status', 'failed').select('quake_id');
    if (retry.error || !retry.data?.length) return { ok: false, error: 'already_posted' };
  }
  try {
    const res = await publish(db, q, draft, opts.png);
    await db.from('bluesky_posts').update({ status: 'posted', post_uri: res.uri, post_url: res.url }).eq('quake_id', q.id);
    return { ok: true, url: res.url, image: res.image };
  } catch (e) {
    const error = String((e as Error)?.message ?? e).slice(0, 500);
    await db.from('bluesky_posts').update({ status: 'failed', error }).eq('quake_id', q.id);
    return { ok: false, error };
  }
}

/** The automatic step of the every-minute alert job. Never throws (alerts must still go out). */
export async function autoPost(db: SupabaseClient, quakes: Quake[], now: number): Promise<{ posted: number; failed: number; waiting: number } | { skipped: string }> {
  try {
    if (!(await blueskySource(db))) return { skipped: 'not_configured' };
    const { data: s } = await db.from('bluesky_settings').select('enabled, min_magnitude').eq('id', 1).maybeSingle();
    if (!s?.enabled) return { skipped: 'off' };
    const { data: rows } = await db.from('bluesky_posts').select('quake_id, quake_time, lat, lon, mag, status')
      .gte('quake_time', new Date(now - 2 * 3600_000).toISOString());
    const todo = autoCandidates(quakes, Number(s.min_magnitude), (rows ?? []) as PostRow[], now);
    let posted = 0, failed = 0, waiting = 0;
    for (const q of todo) {
      // Without its card, a new event waits for the next run (every minute); after CARD_WAIT_MS it goes out as text.
      const png = await card(q, quakes);
      if (!png && cardWait(q, now)) { waiting++; continue; }
      const r = await postQuake(db, q, { manual: false, png });
      if (r.ok) posted++; else failed++;
    }
    return { posted, failed, waiting };
  } catch (e) {
    console.error('bluesky auto post', e);
    return { skipped: 'error' };
  }
}
