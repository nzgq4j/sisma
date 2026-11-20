// Automatic Bluesky posts for significant earthquakes (administrators turn it on and set the minimum magnitude in
// Me → Admin). Each post has the event's share card (GET /api/share-card) with alt text, a short text with a link to
// the event's region view and hashtags, and a line saying it is not an official warning service.
// Posting uses the AT Protocol XRPC endpoints directly (createSession, uploadBlob, createRecord; formats checked against
// the app.bsky / com.atproto lexicons). The account is signed in from Me → Administration (session kept in Supabase
// Vault, never the password); BLUESKY_IDENTIFIER / BLUESKY_APP_PASSWORD (+ optional BLUESKY_SERVICE) in the server env
// are the fallback. docs/bluesky-setup.md
import { feltAltEn, isFeltMark, type FeltMark } from './felt-layers';
import en from '@/i18n/messages/en.json';
import { tsunamiLine } from './tsunami/text';
import { tsunamiTone } from './tsunami/view';
import type { Incident } from './tsunami/alerts';
import { matches } from './tsunami/alerts';
import { loadIncidents } from './tsunami/poll';
import { levelRank } from './tsunami/types';
import type { TsunamiAlert } from './tsunami/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Quake } from './quakes/types';
import { countryAt } from './country';
import { distanceKm, formatDms } from './geo';
import { KM_PER_MI } from './units';
import { SITE } from './site';
import { libraryHref, type LibraryArticle } from './library';

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

export const graphemes = (s: string) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
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
  // Official tsunami alert (lib/tsunami/): its level and centre on their own line, #tsunami while a warning, threat,
  // watch or advisory is in effect; without one, USGS's flag only points to the official information.
  const tsu = q.tsunamiAlert ? tsunamiLine(q.tsunamiAlert, en.tsu) : null;
  const hazard = tsunamiTone(q.tsunamiAlert) != null;
  const tsuText = tsu ? `${tsu}${hazard ? '. Follow local authorities.' : ''}` : q.tsunami ? `${en.tsu.check}.` : null;
  const tags = ['earthquake', ...(hazard ? ['tsunami'] : []), ...(country ? [tagOf(country)] : [])].filter(t => t && graphemes(t) <= 64);
  const build = (place: string) => {
    const lines = [
      `${mag} earthquake · ${place}`,
      `${time(q.time)} UTC · ${depth(q.depthKm)}`,
      ...(tsuText ? [tsuText] : []),
      `Map and details: ${url}`,
      tags.map(t => `#${t}`).join(' '),
      'Not an official warning service',
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
  // 7 days as coloured dots, plate boundaries as dashed lines, then the details and the disclaimer. The felt layers
  // drawn on the card are added when the card is made (cardAlt).
  const source = [q.source, ...(q.alsoIn ?? [])].map(x => x.toUpperCase()).join(', ');
  const alt = `sisma.io earthquake card. Map of the area around a magnitude ${q.mag.toFixed(1)} earthquake, ${place}: `
    + `the epicentre is a ringed dot in the magnitude colour, other earthquakes from the last 7 days are coloured dots, and dashed lines, where present, `
    + `mark tectonic plate boundaries. ${time(q.time)} UTC, depth ${Math.round(q.depthKm)} km, coordinates ${formatDms(q.lat, q.lon)}, `
    + `source ${source}.${tsu ? ` ${en.sharecard.alt_tsunami.replace('{text}', tsu)}` : ''} Not an official warning service.`;
  return { text, facets, alt, url, place };
}

/** One post per tsunami report: an event's incident, level, and whether it was cancelled. */
export const tsunamiKey = (a: Pick<TsunamiAlert, 'incident' | 'level' | 'status'>) => `${a.incident}|${a.level}|${a.status === 'cancelled' ? 'c' : 'a'}`;

/**
 * Post for a new official tsunami report (a new level, or a cancellation): the level and centre, the earthquake, the
 * official message, the region view when the earthquake is in the feeds, hashtags and the disclaimer. English. `q`: the
 * matched earthquake (its share card goes with the post, and its alt text), or null to post from the message alone.
 */
export function draftTsunamiPost(i: Incident, q: Quake | null): PostDraft {
  const line = tsunamiLine(i, en.tsu), hazard = tsunamiTone(i) != null;
  const mag = q?.mag ?? i.mag, when = q?.time ?? i.origin ?? i.issued;
  const lat = q?.lat ?? i.lat, lon = q?.lon ?? i.lon;
  const country = lat != null && lon != null ? countryName(countryAt(lat, lon)?.code ?? null) : null;
  const tags = ['tsunami', 'earthquake', ...(country ? [tagOf(country)] : [])].filter(t => t && graphemes(t) <= 64);
  const build = (place: string) => [
    `${line}${hazard ? '. Follow local authorities.' : ''}`,
    `${mag != null ? `M${mag.toFixed(1)} earthquake` : 'Earthquake'} · ${place}`,
    `${time(when)} UTC`,
    `Official message: ${i.url}`,
    ...(q ? [`Map and details: ${eventUrl(q)}`] : []),
    tags.map(t => `#${t}`).join(' '),
    'Not an official warning service',
  ].join('\n');
  let place = ((q ? q.region || q.title : i.place) || 'Unknown location').trim();
  let text = build(place);
  while ((graphemes(text) > BLUESKY_MAX_GRAPHEMES || bytes(text) > 3000) && place.length > 8) {
    place = place.slice(0, Math.max(8, place.length - 10)).trimEnd() + '…';
    text = build(place);
  }
  return { text, facets: detectFacets(text), alt: q ? draftPost({ ...q, tsunamiAlert: i }).alt : '', url: i.url, place: `${line} – ${place}` };
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
export async function card(q: Quake, known: Quake[] = []): Promise<CardImage | null> {
  try {
    const [{ shareCardResponse, FELT_HEADER }, { recentQuakes }] = await Promise.all([import('./share-card'), import('./quakes/find')]);
    const week = await recentQuakes(7).catch(() => [] as Quake[]);
    const seen = new Set<string>([q.id]);
    const all = [q, ...[...known, ...week].filter(x => !seen.has(x.id) && (seen.add(x.id), true))];
    const r = await shareCardResponse({ q, all, locale: 'en', units: 'km', tz: 'UTC', origin: SITE.url });
    if (!r.ok || !r.headers.get('content-type')?.startsWith('image/png')) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    const layers = (r.headers.get(FELT_HEADER) ?? '').split(',').filter(isFeltMark);
    return buf.byteLength <= BLUESKY_MAX_IMAGE_BYTES ? { data: buf, layers } : null;
  } catch (e) {
    console.error('bluesky card', q.id, e);
    return null;
  }
}

/** A share card made for a post, with the felt layers drawn on it (for the alt text). */
export interface CardImage { data: Uint8Array; layers: FeltMark[] }

/** The post's alt text for this card: the draft's description plus a sentence on the felt layers drawn, if any. */
export const cardAlt = (alt: string, img: CardImage | null) => (img?.layers.length ? `${alt} ${feltAltEn(img.layers)}` : alt);

/** An image attached to a post: its bytes, type and size in pixels (Bluesky shows it at this aspect ratio). */
export interface PostImage { data: Uint8Array; mime: 'image/png' | 'image/jpeg'; width: number; height: number }

/** Publishes a post (text, facets, optional image with alt text); returns its at:// uri and its bsky.app link. */
export async function publishPost(db: SupabaseClient, post: { text: string; facets: Facet[]; alt: string; langs?: string[] }, image: PostImage | null): Promise<{ uri: string; url: string; image: boolean }> {
  const s = await authFor(db);
  const auth = { authorization: `Bearer ${s.accessJwt}` };
  let embed: object | undefined;
  if (image) {
    const { blob } = await xrpc<{ blob: object }>(s.service, 'com.atproto.repo.uploadBlob', { method: 'POST', headers: { ...auth, 'content-type': image.mime }, body: image.data as BodyInit });
    embed = { $type: 'app.bsky.embed.images', images: [{ image: blob, alt: post.alt, aspectRatio: { width: image.width, height: image.height } }] };
  }
  const record = { $type: 'app.bsky.feed.post', text: post.text, facets: post.facets, langs: post.langs ?? ['en'], createdAt: new Date().toISOString(), ...(embed ? { embed } : {}) };
  const res = await xrpc<{ uri: string }>(s.service, 'com.atproto.repo.createRecord', {
    method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ repo: s.did, collection: 'app.bsky.feed.post', record }),
  });
  const rkey = res.uri.split('/').pop();
  return { uri: res.uri, url: `https://bsky.app/profile/${s.handle}/post/${rkey}`, image: !!image };
}

/** Publishes an event's post; `img`: the card if already made (null: none; undefined: make it now). */
export async function publish(db: SupabaseClient, q: Quake, draft: PostDraft, img?: CardImage | null) {
  if (img === undefined) img = await card(q);
  const res = await publishPost(db, { ...draft, alt: cardAlt(draft.alt, img) }, img ? { data: img.data, mime: 'image/png', width: CARD_W, height: CARD_H } : null);
  return { ...res, alt: cardAlt(draft.alt, img) };
}

// --- In Depth articles (posted by hand from Me → Administration or the article page) ---
/** Share cards of the library articles: public/og/library-<id>.jpg (scripts/og-cards.mjs), 1200 × 630. */
export const LIBRARY_CARD_W = 1200, LIBRARY_CARD_H = 630;
/** Bluesky's app limit for alt text. */
export const BLUESKY_MAX_ALT = 2000;
export const libraryUrl = (a: Pick<LibraryArticle, 'id'>) => `${SITE.url}${libraryHref(a.id)}`;
export const libraryCardPath = (a: Pick<LibraryArticle, 'id'>) => `/og/library-${a.id}.jpg`;

/** Whether a post of this text (and alt text) can be published: null, or what is wrong with it. */
export function postProblem(text: string, alt: string): 'empty' | 'too_long' | 'alt_too_long' | null {
  if (!text.trim()) return 'empty';
  if (graphemes(text) > BLUESKY_MAX_GRAPHEMES || bytes(text) > 3000) return 'too_long';
  if (graphemes(alt) > BLUESKY_MAX_ALT) return 'alt_too_long';
  return null;
}

/**
 * Link and hashtag facets for any text, so a post an administrator has edited still has working links and tags.
 * Links: http(s) addresses up to the next space, without trailing punctuation. Tags: # at the start or after a space,
 * letters, digits and _ (not digits only), at most 64 characters; the tag is stored without the #.
 */
export function detectFacets(text: string): Facet[] {
  const out: Facet[] = [];
  const span = (i: number, len: number) => ({ byteStart: bytes(text.slice(0, i)), byteEnd: bytes(text.slice(0, i + len)) });
  for (const m of text.matchAll(/https?:\/\/[^\s]+/g)) {
    const uri = m[0].replace(/[.,;:!?'")\]]+$/, '');
    if (uri.length > 10) out.push({ index: span(m.index, uri.length), features: [{ $type: 'app.bsky.richtext.facet#link', uri }] });
  }
  for (const m of text.matchAll(/(^|\s)#([\p{L}\p{N}_]+)/gu)) {
    const tag = m[2];
    if (/^\d+$/.test(tag) || graphemes(tag) > 64) continue;
    out.push({ index: span(m.index + m[1].length, tag.length + 1), features: [{ $type: 'app.bsky.richtext.facet#tag', tag }] });
  }
  return out.sort((a, b) => a.index.byteStart - b.index.byteStart);
}

/** Cuts a standfirst to at most `max` graphemes: whole sentences if they fit, else whole words and "…"; '' if nothing fits. */
function fitDek(dek: string, max: number): string {
  if (graphemes(dek) <= max) return dek;
  const sentences = dek.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let s = '';
  for (const x of sentences) { if (graphemes(s + x) > max) break; s += x; }
  if (s.trim()) return s.trim();
  const words = dek.split(/\s+/);
  let w = '';
  for (const x of words) { const next = w ? `${w} ${x}` : x; if (graphemes(next) + 1 > max) break; w = next; }
  return w.length >= 20 ? w.replace(/[\s,;:.–—-]+$/, '') + '…' : '';
}

/**
 * The suggested post for an In Depth article (English, the account's language): title, as much of the standfirst as
 * fits, the link and the article's hashtags, within 300 graphemes; and alt text describing its share card.
 */
export function draftLibraryPost(a: LibraryArticle): { text: string; facets: Facet[]; alt: string; url: string; image: string } {
  const url = libraryUrl(a);
  const tags = a.hashtags.map(t => `#${t}`).join(' ');
  const build = (dek: string) => [a.title, ...(dek ? [dek] : []), `Read: ${url}`, tags].join('\n\n');
  const room = BLUESKY_MAX_GRAPHEMES - graphemes(build('')) - 2;
  const text = build(room > 0 ? fitDek(a.dek, room) : '');
  const alt = `sisma share card. On the left, the sisma logo, the label In Depth, the title "${a.title}", the start of `
    + `the standfirst and the address sisma.io${libraryHref(a.id)}. On the right, ${a.cardImage}.`;
  return { text, facets: detectFacets(text), alt, url, image: libraryCardPath(a) };
}

/** A JPEG from the site (`origin` + `path`), or null if it is missing or too large. */
export async function siteImage(path: string, origin: string, width: number, height: number): Promise<PostImage | null> {
  try {
    const r = await fetch(`${origin.replace(/\/$/, '')}${path}`);
    if (!r.ok || !r.headers.get('content-type')?.startsWith('image/jpeg')) return null;
    const data = new Uint8Array(await r.arrayBuffer());
    return data.byteLength <= BLUESKY_MAX_IMAGE_BYTES ? { data, mime: 'image/jpeg', width, height } : null;
  } catch {
    return null;
  }
}

/** The article's share card, fetched from the site (`origin`), or null if it is missing or too large. */
export const libraryCard = (a: Pick<LibraryArticle, 'id'>, origin: string) => siteImage(libraryCardPath(a), origin, LIBRARY_CARD_W, LIBRARY_CARD_H);

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

/** Which recent events the automatic posting would post now: those with an official tsunami report whatever their
 *  magnitude, first, then the others at or above the minimum magnitude, largest first. */
export function autoCandidates(quakes: Quake[], minMagnitude: number, rows: PostRow[], now: number): Quake[] {
  return quakes
    .filter(q => (q.mag >= minMagnitude || q.tsunamiAlert) && q.time <= now + 60_000 && now - q.time <= AUTO_MAX_AGE_MS && !alreadyPosted(q, rows))
    .sort((a, b) => Number(!!b.tsunamiAlert) - Number(!!a.tsunamiAlert) || b.mag - a.mag)
    .slice(0, AUTO_MAX_PER_RUN);
}

export type PostOutcome = { ok: true; url: string; image: boolean } | { ok: false; error: string };

/** Claims the event (one post per event), posts it and records the result. A failed post can be posted again by hand. */
export async function postQuake(db: SupabaseClient, q: Quake, opts: { manual: boolean; by?: string | null; card?: CardImage | null }): Promise<PostOutcome> {
  const draft = draftPost(q);
  const row = {
    quake_id: q.id, quake_time: new Date(q.time).toISOString(), lat: q.lat, lon: q.lon, mag: Math.round(q.mag * 10) / 10,
    place: draft.place.slice(0, 200), text: draft.text, alt: draft.alt, status: 'posting', error: null,
    manual: opts.manual, posted_by: opts.by ?? null, tsunami_key: q.tsunamiAlert ? tsunamiKey(q.tsunamiAlert) : null,
  };
  // Claim: insert, or take over a failed attempt. Anything else means it is posted or being posted.
  const ins = await db.from('bluesky_posts').insert(row);
  if (ins.error) {
    const retry = await db.from('bluesky_posts').update(row).eq('quake_id', q.id).eq('status', 'failed').select('quake_id');
    if (retry.error || !retry.data?.length) return { ok: false, error: 'already_posted' };
  }
  try {
    const res = await publish(db, q, draft, opts.card);
    await db.from('bluesky_posts').update({ status: 'posted', post_uri: res.uri, post_url: res.url, alt: res.alt }).eq('quake_id', q.id);
    return { ok: true, url: res.url, image: res.image };
  } catch (e) {
    const error = String((e as Error)?.message ?? e).slice(0, 500);
    await db.from('bluesky_posts').update({ status: 'failed', error }).eq('quake_id', q.id);
    return { ok: false, error };
  }
}

/** The automatic step of the every-minute alert job. Never throws (alerts must still go out). */
export async function autoPost(db: SupabaseClient, quakes: Quake[], now: number): Promise<{ posted: number; failed: number; waiting: number; tsunami: { posted: number; failed: number } } | { skipped: string }> {
  try {
    if (!(await blueskySource(db))) return { skipped: 'not_configured' };
    const { data: s } = await db.from('bluesky_settings').select('enabled, min_magnitude').eq('id', 1).maybeSingle();
    if (!s?.enabled) return { skipped: 'off' };
    const { data: rows } = await db.from('bluesky_posts').select('quake_id, quake_time, lat, lon, mag, status')
      .gte('quake_time', new Date(now - 2 * 3600_000).toISOString());
    const todo = autoCandidates(quakes, Number(s.min_magnitude), (rows ?? []) as PostRow[], now);
    let posted = 0, failed = 0, waiting = 0;
    const waitingIds = new Set<string>();
    for (const q of todo) {
      // Without its card, a new event waits for the next run (every minute); after CARD_WAIT_MS it goes out as text.
      const img = await card(q, quakes);
      if (!img && cardWait(q, now)) { waiting++; waitingIds.add(q.id); continue; }
      const r = await postQuake(db, q, { manual: false, card: img });
      if (r.ok) posted++; else failed++;
    }
    const tsunami = await autoTsunami(db, quakes, now, waitingIds);
    return { posted, failed, waiting, tsunami };
  } catch (e) {
    console.error('bluesky auto post', e);
    return { skipped: 'error' };
  }
}

/** Tsunami reports older than this when first seen are not posted (a first run, or a late feed). */
export const TSUNAMI_POST_MAX_AGE_MS = 3 * 3600_000;

/** New tsunami reports (lib/tsunami/) not yet carried by a post, most serious first. */
export function tsunamiCandidates(list: Incident[], covered: Set<string>, now: number): Incident[] {
  return list
    .filter(i => now - i.issued <= TSUNAMI_POST_MAX_AGE_MS && !covered.has(tsunamiKey(i)))
    .sort((a, b) => levelRank(a.level) - levelRank(b.level) || b.issued - a.issued)
    .slice(0, AUTO_MAX_PER_RUN);
}

/**
 * Every new official tsunami report gets a post (one per event, level and cancellation): an earthquake post that already
 * carried it counts; otherwise a post of its own, with the earthquake's card when the earthquake is in the feeds. Waits
 * while that earthquake's own post is waiting for its card. Like earthquake posts, a failed post is not retried here.
 */
async function autoTsunami(db: SupabaseClient, quakes: Quake[], now: number, waitingIds: Set<string>): Promise<{ posted: number; failed: number }> {
  const list = await loadIncidents(db, 1, now);
  const keys = list.filter(i => now - i.issued <= TSUNAMI_POST_MAX_AGE_MS).map(tsunamiKey);
  if (!keys.length) return { posted: 0, failed: 0 };
  const { data } = await db.from('bluesky_posts').select('tsunami_key').in('tsunami_key', keys);
  const covered = new Set((data ?? []).map(r => r.tsunami_key as string));
  let posted = 0, failed = 0;
  for (const i of tsunamiCandidates(list, covered, now)) {
    const found = quakes.find(q => matches(q, i)) ?? null;
    if (found && waitingIds.has(found.id)) continue;
    const q = found ? { ...found, tsunamiAlert: { incident: i.incident, level: i.level, center: i.center, status: i.status, title: i.title, issued: i.issued, url: i.url, areas: i.areas } } : null;
    const img = q ? await card(q, quakes) : null;
    if (q && !img && cardWait(q, now)) continue;
    const r = await postTsunami(db, i, q, img);
    if (r.ok) posted++; else if (r.error !== 'already_posted') failed++;
  }
  return { posted, failed };
}

/** Claims and publishes the post for one tsunami report (bluesky_posts row "tsunami:<key>"). */
export async function postTsunami(db: SupabaseClient, i: Incident, q: Quake | null, img: CardImage | null): Promise<PostOutcome> {
  const draft = draftTsunamiPost(i, q), key = tsunamiKey(i), id = `tsunami:${key}`;
  const when = q?.time ?? i.origin ?? i.issued;
  const ins = await db.from('bluesky_posts').insert({
    quake_id: id, quake_time: new Date(when).toISOString(), lat: q?.lat ?? i.lat ?? 0, lon: q?.lon ?? i.lon ?? 0,
    mag: Math.round((q?.mag ?? i.mag ?? 0) * 10) / 10, place: draft.place.slice(0, 200), text: draft.text, alt: draft.alt,
    status: 'posting', error: null, manual: false, tsunami_key: key,
  });
  if (ins.error) return { ok: false, error: 'already_posted' };
  try {
    const res = q ? await publish(db, q, draft, img) : { ...(await publishPost(db, draft, null)), alt: '' };
    await db.from('bluesky_posts').update({ status: 'posted', post_uri: res.uri, post_url: res.url, alt: res.alt }).eq('quake_id', id);
    return { ok: true, url: res.url, image: res.image };
  } catch (e) {
    const error = String((e as Error)?.message ?? e).slice(0, 500);
    await db.from('bluesky_posts').update({ status: 'failed', error }).eq('quake_id', id);
    return { ok: false, error };
  }
}
