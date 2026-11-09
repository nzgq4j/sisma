// Automatic posts to X (formerly Twitter) for significant earthquakes, in the same manner and at the same time as the
// Bluesky posts (lib/bluesky.ts): the event's share card with alt text, the same short text with a link to the event's
// region view and hashtags, and a line saying it is automated and not an official warning. Administrators turn it on,
// set the minimum magnitude and connect the account in Me → Administration; the every-minute alert job posts.
//
// The account is connected with "Sign in with X" (OAuth 2.0 authorization code with PKCE, a confidential client:
// X_CLIENT_ID and X_CLIENT_SECRET in the server env). sisma never sees the X password; the tokens X returns are kept
// encrypted in Supabase Vault (public.x_session_get/set) and renewed by the server (X issues a new refresh token each
// time). Endpoints and request formats are those of X's own SDK (@xdevplatform/xdk 0.6.6) and twitter-api-v2 1.31:
// x.com/i/oauth2/authorize, api.x.com/2/oauth2/token and /revoke, /2/users/me, /2/media/upload/initialize · append ·
// finalize, /2/media/metadata (alt text), /2/tweets. Text length follows twitter-text v3 (280, links count 23).
// docs/x-setup.md
import { createHash, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Quake } from './quakes/types';
import { altText, autoCandidates, card, cardWait, eventUrl, fitPlace, postTags, postText, type PostRow } from './bluesky';
import { SITE } from './site';

export const X_MAX_WEIGHT = 280;
/** X counts every link as this many characters (t.co), whatever its length. */
const X_URL_WEIGHT = 23;
/** X rejects alt text longer than this. */
const X_MAX_ALT = 1000;
const API = 'https://api.x.com';
export const X_SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'];
/** A sign-in started on the admin page must come back from X within this long. */
export const STATE_TTL_MS = 10 * 60_000;

/**
 * Weighted length as X counts it (twitter-text v3): code points in the Latin and common punctuation ranges count 1,
 * everything else (CJK, emoji, "…") counts 2, and each link counts 23.
 */
export function xLength(text: string, urls: string[] = []): number {
  let s = text.normalize('NFC'), n = 0;
  for (const u of urls) {
    const parts = s.split(u);
    n += (parts.length - 1) * X_URL_WEIGHT;
    s = parts.join('');
  }
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    n += c <= 4351 || (c >= 8192 && c <= 8205) || (c >= 8208 && c <= 8223) || (c >= 8242 && c <= 8247) ? 1 : 2;
  }
  return n;
}

export interface XDraft { text: string; alt: string; url: string; place: string; length: number }

/** The post for one event (English, like the account), at most 280 as X counts it. */
export function draftXPost(q: Quake): XDraft {
  const url = eventUrl(q);
  const tags = postTags(q);
  const { place, text } = fitPlace(q, t => xLength(t, [url]) <= X_MAX_WEIGHT, p => postText(q, p, url, tags));
  return { text, alt: altText(q, place).slice(0, X_MAX_ALT), url, place, length: xLength(text, [url]) };
}

// --- OAuth 2.0 (authorization code with PKCE) ---
export interface XSession { accessToken: string; refreshToken: string; expiresAt: number; userId: string; username: string; scope: string }

/** An error answered by X (or reaching it); `code` is a short name for the admin page, `message` X's own words. */
export class XError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export const xConfigured = () => !!(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET);
export const redirectUri = () => `${SITE.url}/api/admin/x/callback`;
const basic = () => `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`;
const b64url = (b: Buffer) => b.toString('base64url');

/** X's error body → a short code and a readable message. */
function xErrorOf(status: number, body: Record<string, unknown>, what: string): XError {
  const errors = Array.isArray(body.errors) ? (body.errors as { message?: string }[]) : [];
  const detail = String(body.detail ?? body.error_description ?? errors[0]?.message ?? body.title ?? body.error ?? '');
  const code = status === 401 ? 'unauthorized' : status === 402 ? 'payment_required' : status === 429 ? 'rate_limited'
    : body.error === 'invalid_grant' ? 'expired' : /duplicate/i.test(detail) ? 'duplicate' : status === 403 ? 'forbidden' : `HTTP_${status}`;
  return new XError(code, `${what} ${status}${detail ? `: ${detail}` : ''}`.slice(0, 400));
}

async function call<T>(what: string, url: string, init: RequestInit): Promise<T> {
  let r: Response;
  try { r = await fetch(url, init); } catch (e) { throw new XError('unreachable', `${what}: ${String((e as Error)?.message ?? e)}`); }
  const text = await r.text();
  let body: Record<string, unknown> = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* not JSON */ }
  if (!r.ok) throw xErrorOf(r.status, body, what);
  return body as T;
}

const form = (o: Record<string, string>) => new URLSearchParams(o).toString();
interface TokenResponse { access_token: string; refresh_token?: string; expires_in: number; scope?: string }

async function token(params: Record<string, string>): Promise<TokenResponse> {
  return call<TokenResponse>('token', `${API}/2/oauth2/token`, {
    method: 'POST', headers: { authorization: basic(), 'content-type': 'application/x-www-form-urlencoded' }, body: form(params),
  });
}

/** Starts a sign-in: stores a one-time state and PKCE verifier for this administrator, returns X's authorize URL. */
export async function startSignIn(db: SupabaseClient, adminId: string, now = Date.now()): Promise<string> {
  if (!xConfigured()) throw new XError('not_configured', 'X_CLIENT_ID and X_CLIENT_SECRET are not set');
  const state = b64url(randomBytes(32)), verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  await db.from('x_oauth_states').delete().lt('created_at', new Date(now - STATE_TTL_MS).toISOString());
  const { error } = await db.from('x_oauth_states').insert({ state, code_verifier: verifier, admin_id: adminId });
  if (error) throw new XError('failed', 'could not start the sign-in');
  const q = new URLSearchParams({
    response_type: 'code', client_id: process.env.X_CLIENT_ID!, redirect_uri: redirectUri(), scope: X_SCOPES.join(' '),
    state, code_challenge: challenge, code_challenge_method: 'S256',
  });
  return `https://x.com/i/oauth2/authorize?${q}`;
}

async function storedSession(db: SupabaseClient): Promise<XSession | null> {
  const { data, error } = await db.rpc('x_session_get');
  if (error || !data) return null;
  const s = data as XSession;
  return s.refreshToken && s.accessToken ? s : null;
}
const saveSession = async (db: SupabaseClient, s: XSession | null) => {
  const { error } = await db.rpc('x_session_set', { p_session: s });
  if (error) throw new XError('failed', 'could not save the X session');
};

/** Finishes a sign-in from X's redirect: checks and uses up the state, gets the tokens and the account, stores them. */
export async function finishSignIn(db: SupabaseClient, state: string, code: string, now = Date.now()): Promise<{ username: string }> {
  const { data: row } = await db.from('x_oauth_states').delete().eq('state', state).select('code_verifier, admin_id, created_at').maybeSingle();
  if (!row || now - Date.parse(row.created_at) > STATE_TTL_MS) throw new XError('bad_state', 'the sign-in expired or was already used');
  const t = await token({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: row.code_verifier });
  if (!t.refresh_token) throw new XError('failed', 'X did not return a refresh token');
  const granted = (t.scope ?? '').split(/\s+/);
  const missing = X_SCOPES.filter(s => !granted.includes(s));
  if (t.scope && missing.length) throw new XError('scopes', `X did not grant: ${missing.join(', ')}`);
  const me = await call<{ data: { id: string; username: string } }>('users/me', `${API}/2/users/me`, { headers: { authorization: `Bearer ${t.access_token}` } });
  await saveSession(db, { accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: now + t.expires_in * 1000, userId: me.data.id, username: me.data.username, scope: t.scope ?? '' });
  await db.from('x_settings').update({ account_username: me.data.username, account_id: me.data.id, connected_at: new Date(now).toISOString(), connected_by: row.admin_id, last_error: null }).eq('id', 1);
  return { username: me.data.username };
}

/** Signs out: revokes the tokens at X (best effort) and forgets them. */
export async function disconnectX(db: SupabaseClient) {
  const s = await storedSession(db);
  if (s && xConfigured()) {
    for (const [tok, hint] of [[s.refreshToken, 'refresh_token'], [s.accessToken, 'access_token']] as const) {
      await call('revoke', `${API}/2/oauth2/revoke`, { method: 'POST', headers: { authorization: basic(), 'content-type': 'application/x-www-form-urlencoded' }, body: form({ token: tok, token_type_hint: hint }) }).catch(() => undefined);
    }
  }
  await saveSession(db, null);
  await db.from('x_settings').update({ account_username: null, account_id: null, connected_at: null, connected_by: null, last_error: null }).eq('id', 1);
}

/** True when an account is connected (whether its tokens still work is checked when used). */
export async function xConnected(db: SupabaseClient): Promise<boolean> {
  return xConfigured() && !!(await storedSession(db));
}

/**
 * A usable access token: the stored one, or a new one from the refresh token when it has under 5 minutes left. X
 * replaces the refresh token on each use, so the new pair is saved; if another run refreshed it a moment earlier,
 * that run's saved pair is used instead.
 */
async function authFor(db: SupabaseClient, now = Date.now()): Promise<XSession> {
  if (!xConfigured()) throw new XError('not_configured', 'X_CLIENT_ID and X_CLIENT_SECRET are not set');
  const s = await storedSession(db);
  if (!s) throw new XError('not_connected', 'X is not connected');
  if (s.expiresAt > now + 5 * 60_000) return s;
  try {
    const t = await token({ grant_type: 'refresh_token', refresh_token: s.refreshToken });
    const next = { ...s, accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: now + t.expires_in * 1000, scope: t.scope ?? s.scope };
    await saveSession(db, next);
    return next;
  } catch (e) {
    const again = await storedSession(db);
    if (again && again.refreshToken !== s.refreshToken && again.expiresAt > now + 60_000) return again;
    // Revoked or expired (e.g. access removed in X's settings): say so on the admin page; sign in again to fix.
    await db.from('x_settings').update({ last_error: String((e as Error)?.message ?? e).slice(0, 300) }).eq('id', 1);
    throw e;
  }
}

/** Checks that posting would work now: gets a token and asks X whose account it is. */
export async function checkX(db: SupabaseClient): Promise<{ username: string }> {
  const s = await authFor(db);
  const me = await call<{ data: { id: string; username: string } }>('users/me', `${API}/2/users/me`, { headers: { authorization: `Bearer ${s.accessToken}` } });
  if (me.data.username !== s.username) await saveSession(db, { ...s, username: me.data.username });
  await db.from('x_settings').update({ account_username: me.data.username, last_error: null }).eq('id', 1);
  return { username: me.data.username };
}

/** Uploads the card (initialize, append in 1 MB parts, finalize) and sets its alt text; returns the media id. */
async function uploadCard(s: XSession, png: Uint8Array, alt: string): Promise<string> {
  const auth = { authorization: `Bearer ${s.accessToken}` };
  const init = await call<{ data: { id: string } }>('media/initialize', `${API}/2/media/upload/initialize`, {
    method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ media_type: 'image/png', total_bytes: png.byteLength, media_category: 'tweet_image' }),
  });
  const id = init.data.id;
  const CHUNK = 1024 * 1024;
  for (let i = 0, off = 0; off < png.byteLength; i++, off += CHUNK) {
    const body = new FormData();
    body.append('segment_index', String(i));
    body.append('media', new Blob([png.slice(off, off + CHUNK)], { type: 'application/octet-stream' }), 'card.png');
    await call('media/append', `${API}/2/media/upload/${encodeURIComponent(id)}/append`, { method: 'POST', headers: auth, body });
  }
  const fin = await call<{ data?: { processing_info?: { state?: string; check_after_secs?: number } } }>('media/finalize', `${API}/2/media/upload/${encodeURIComponent(id)}/finalize`, { method: 'POST', headers: auth });
  // Images are normally ready at once; wait briefly if X says it is still processing.
  for (let info = fin.data?.processing_info, n = 0; info && info.state !== 'succeeded' && n < 5; n++) {
    if (info.state === 'failed') throw new XError('media_failed', 'X could not process the image');
    await new Promise(r => setTimeout(r, Math.min(5, info?.check_after_secs ?? 1) * 1000));
    const st = await call<{ data?: { processing_info?: { state?: string; check_after_secs?: number } } }>('media/status', `${API}/2/media/upload?${new URLSearchParams({ command: 'STATUS', media_id: id })}`, { headers: auth });
    info = st.data?.processing_info;
  }
  // Alt text is a nicety: a failure here doesn't stop the post.
  await call('media/metadata', `${API}/2/media/metadata`, {
    method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ id, metadata: { alt_text: { text: alt } } }),
  }).catch(e => console.error('x alt text', e));
  return id;
}

/** Publishes the post (with the card when there is one); returns its id and link. `png`: the card if already made. */
export async function publishX(db: SupabaseClient, q: Quake, draft: XDraft, png?: Uint8Array | null): Promise<{ id: string; url: string; image: boolean }> {
  const s = await authFor(db);
  if (png === undefined) png = await card(q);
  const mediaId = png ? await uploadCard(s, png, draft.alt) : null;
  const res = await call<{ data: { id: string } }>('tweets', `${API}/2/tweets`, {
    method: 'POST', headers: { authorization: `Bearer ${s.accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text: draft.text, ...(mediaId ? { media: { media_ids: [mediaId] } } : {}) }),
  });
  return { id: res.data.id, url: `https://x.com/${s.username}/status/${res.data.id}`, image: !!mediaId };
}

export type XOutcome = { ok: true; url: string; image: boolean } | { ok: false; error: string };

/** Claims the event (one post per event), posts it and records the result. A failed post can be posted again by hand. */
export async function postQuakeX(db: SupabaseClient, q: Quake, opts: { manual: boolean; by?: string | null; png?: Uint8Array | null }): Promise<XOutcome> {
  const draft = draftXPost(q);
  const row = {
    quake_id: q.id, quake_time: new Date(q.time).toISOString(), lat: q.lat, lon: q.lon, mag: Math.round(q.mag * 10) / 10,
    place: draft.place.slice(0, 200), text: draft.text, alt: draft.alt, status: 'posting', error: null,
    manual: opts.manual, posted_by: opts.by ?? null,
  };
  const ins = await db.from('x_posts').insert(row);
  if (ins.error) {
    const retry = await db.from('x_posts').update(row).eq('quake_id', q.id).eq('status', 'failed').select('quake_id');
    if (retry.error || !retry.data?.length) return { ok: false, error: 'already_posted' };
  }
  try {
    const res = await publishX(db, q, draft, opts.png);
    await db.from('x_posts').update({ status: 'posted', post_id: res.id, post_url: res.url }).eq('quake_id', q.id);
    return { ok: true, url: res.url, image: res.image };
  } catch (e) {
    const error = String((e as Error)?.message ?? e).slice(0, 500);
    await db.from('x_posts').update({ status: 'failed', error }).eq('quake_id', q.id);
    return { ok: false, error };
  }
}

/** The X step of the every-minute alert job: same events and timing as Bluesky. Never throws. */
export async function autoPostX(db: SupabaseClient, quakes: Quake[], now: number): Promise<{ posted: number; failed: number; waiting: number } | { skipped: string }> {
  try {
    if (!(await xConnected(db))) return { skipped: 'not_configured' };
    const { data: s } = await db.from('x_settings').select('enabled, min_magnitude').eq('id', 1).maybeSingle();
    if (!s?.enabled) return { skipped: 'off' };
    const { data: rows } = await db.from('x_posts').select('quake_id, quake_time, lat, lon, mag, status')
      .gte('quake_time', new Date(now - 2 * 3600_000).toISOString());
    const todo = autoCandidates(quakes, Number(s.min_magnitude), (rows ?? []) as PostRow[], now);
    let posted = 0, failed = 0, waiting = 0;
    for (const q of todo) {
      const png = await card(q, quakes);
      if (!png && cardWait(q, now)) { waiting++; continue; }
      const r = await postQuakeX(db, q, { manual: false, png });
      if (r.ok) posted++; else failed++;
    }
    return { posted, failed, waiting };
  } catch (e) {
    console.error('x auto post', e);
    return { skipped: 'error' };
  }
}
