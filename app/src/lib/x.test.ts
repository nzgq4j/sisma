import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { eventUrl } from './bluesky';
import { draftXPost, finishSignIn, publishX, STATE_TTL_MS, startSignIn, X_MAX_WEIGHT, X_SCOPES, xLength, type XSession } from './x';
import type { Quake } from './quakes/types';

const NOW = Date.parse('2026-11-09T12:00:00Z');
const q = (o: Partial<Quake> = {}): Quake => ({ id: 'usgs:us7000abcd', source: 'usgs', mag: 6.4, title: '45 km E of Namie, Japan', region: 'Japan',
  time: Date.parse('2026-11-09T11:50:00Z'), lat: 37.5, lon: 141.5, depthKm: 35, tsunami: false, ...o });

describe('xLength (twitter-text v3)', () => {
  it('counts Latin text 1, links 23, and "…", CJK and emoji 2', () => {
    expect(xLength('abc · def')).toBe(9);
    expect(xLength('see https://sisma.io/app/map?focus=usgs%3Aus7000abcd now', ['https://sisma.io/app/map?focus=usgs%3Aus7000abcd'])).toBe(4 + 23 + 4);
    expect(xLength('…')).toBe(2);
    expect(xLength('地震')).toBe(4);
    expect(xLength('🙂')).toBe(4); // two UTF-16 units, each outside the weight-1 ranges
  });
});

describe('draftXPost', () => {
  it('uses the same text as the Bluesky post and fits 280', () => {
    const d = draftXPost(q());
    expect(d.text.split('\n')).toEqual([
      'M6.4 earthquake · Japan',
      '9 Nov, 11:50 UTC · 35 km (22 mi) deep',
      `Map and details: ${eventUrl(q())}`,
      '#earthquake #Japan',
      'Automated post · not an official warning service',
    ]);
    expect(d.length).toBeLessThanOrEqual(X_MAX_WEIGHT);
    expect(d.alt).toMatch(/^sisma\.io earthquake card\./);
  });
  it('shortens a very long place to fit, keeping the link', () => {
    const d = draftXPost(q({ region: 'Long place name '.repeat(30) }));
    expect(d.length).toBeLessThanOrEqual(X_MAX_WEIGHT);
    expect(d.text).toContain(eventUrl(q()));
    expect(d.place.endsWith('…')).toBe(true);
  });
});

// --- A small stand-in for the database (only the calls lib/x.ts makes) ---
function fakeDb() {
  const tables: Record<string, Record<string, unknown>[]> = { x_oauth_states: [], x_settings: [{ id: 1 }] };
  let session: XSession | null = null;
  const builder = (t: string) => {
    const filters: ((r: Record<string, unknown>) => boolean)[] = [];
    let op: 'select' | 'delete' | 'update' = 'select', patch: Record<string, unknown> = {};
    const rows = () => (tables[t] ??= []).filter(r => filters.every(f => f(r)));
    const run = () => {
      const hit = rows();
      if (op === 'delete') tables[t] = tables[t].filter(r => !hit.includes(r));
      if (op === 'update') hit.forEach(r => Object.assign(r, patch));
      return hit;
    };
    const b = {
      insert: async (r: Record<string, unknown>) => { tables[t].push({ created_at: new Date(NOW).toISOString(), ...r }); return { error: null }; },
      delete: () => { op = 'delete'; return b; },
      update: (p: Record<string, unknown>) => { op = 'update'; patch = p; return b; },
      select: () => b,
      eq: (k: string, v: unknown) => { filters.push(r => r[k] === v); return b; },
      lt: (k: string, v: string) => { filters.push(r => String(r[k]) < v); return b; },
      maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
      then: (res: (v: { data: unknown; error: null }) => unknown) => res({ data: run(), error: null }),
    };
    return b;
  };
  const db = {
    from: builder,
    rpc: async (name: string, args?: { p_session: XSession | null }) => {
      if (name === 'x_session_get') return { data: session, error: null };
      session = args?.p_session ?? null;
      return { data: null, error: null };
    },
  };
  return { db: db as unknown as SupabaseClient, tables, get session() { return session; }, set session(s) { session = s; } };
}

type Call = { url: string; init: RequestInit };
function mockFetch(answer: (c: Call) => unknown) {
  const calls: Call[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const c = { url: String(url), init };
    calls.push(c);
    return new Response(JSON.stringify(answer(c)), { status: 200, headers: { 'content-type': 'application/json' } });
  }));
  return calls;
}

describe('Sign in with X', () => {
  beforeEach(() => { vi.stubEnv('X_CLIENT_ID', 'client-id'); vi.stubEnv('X_CLIENT_SECRET', 'client-secret'); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('sends the administrator to X with PKCE, then exchanges the code once and stores the tokens', async () => {
    const f = fakeDb();
    const url = new URL(await startSignIn(f.db, 'admin-1', NOW));
    expect(url.origin + url.pathname).toBe('https://x.com/i/oauth2/authorize');
    const p = url.searchParams;
    expect(p.get('response_type')).toBe('code');
    expect(p.get('client_id')).toBe('client-id');
    expect(p.get('redirect_uri')).toBe('https://sisma.io/api/admin/x/callback');
    expect(p.get('scope')).toBe(X_SCOPES.join(' '));
    expect(p.get('code_challenge_method')).toBe('S256');
    const stored = f.tables.x_oauth_states[0] as { state: string; code_verifier: string };
    expect(stored.state).toBe(p.get('state'));
    expect(p.get('code_challenge')).toBe(createHash('sha256').update(stored.code_verifier).digest('base64url'));

    const calls = mockFetch(c => (c.url.endsWith('/2/oauth2/token')
      ? { access_token: 'AT', refresh_token: 'RT', expires_in: 7200, scope: X_SCOPES.join(' ') }
      : { data: { id: '42', username: 'sisma_io' } }));
    expect(await finishSignIn(f.db, stored.state, 'the-code', NOW)).toEqual({ username: 'sisma_io' });
    const tok = calls[0];
    expect(tok.url).toBe('https://api.x.com/2/oauth2/token');
    expect((tok.init.headers as Record<string, string>).authorization).toBe(`Basic ${Buffer.from('client-id:client-secret').toString('base64')}`);
    const body = new URLSearchParams(String(tok.init.body));
    expect(Object.fromEntries(body)).toEqual({ grant_type: 'authorization_code', code: 'the-code', redirect_uri: 'https://sisma.io/api/admin/x/callback', code_verifier: stored.code_verifier });
    expect(calls[1].url).toBe('https://api.x.com/2/users/me');
    expect(f.session).toMatchObject({ accessToken: 'AT', refreshToken: 'RT', expiresAt: NOW + 7200_000, userId: '42', username: 'sisma_io' });
    expect(f.tables.x_settings[0]).toMatchObject({ account_username: 'sisma_io', connected_by: 'admin-1' });
    // The state is used up: the same redirect can't be replayed.
    await expect(finishSignIn(f.db, stored.state, 'the-code', NOW)).rejects.toMatchObject({ code: 'bad_state' });
  });

  it('refuses a state older than 10 minutes', async () => {
    const f = fakeDb();
    f.tables.x_oauth_states.push({ state: 's', code_verifier: 'v', admin_id: 'a', created_at: new Date(NOW - STATE_TTL_MS - 1000).toISOString() });
    mockFetch(() => ({}));
    await expect(finishSignIn(f.db, 's', 'c', NOW)).rejects.toMatchObject({ code: 'bad_state' });
  });

  it('refuses a sign-in where X granted fewer permissions', async () => {
    const f = fakeDb();
    f.tables.x_oauth_states.push({ state: 's', code_verifier: 'v', admin_id: 'a', created_at: new Date(NOW).toISOString() });
    mockFetch(() => ({ access_token: 'AT', refresh_token: 'RT', expires_in: 7200, scope: 'tweet.read users.read' }));
    await expect(finishSignIn(f.db, 's', 'c', NOW)).rejects.toMatchObject({ code: 'scopes' });
    expect(f.session).toBeNull();
  });
});

describe('publishX', () => {
  beforeEach(() => { vi.stubEnv('X_CLIENT_ID', 'client-id'); vi.stubEnv('X_CLIENT_SECRET', 'client-secret'); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  const session = (o: Partial<XSession> = {}): XSession => ({ accessToken: 'AT', refreshToken: 'RT', expiresAt: Date.now() + 3600_000, userId: '42', username: 'sisma_io', scope: X_SCOPES.join(' '), ...o });

  it('uploads the card in parts, sets its alt text, and posts with it', async () => {
    const f = fakeDb();
    f.session = session();
    const png = new Uint8Array(1024 * 1024 + 10).fill(7);
    const calls = mockFetch(c => (c.url.endsWith('/initialize') ? { data: { id: 'M1' } }
      : c.url.endsWith('/finalize') ? { data: { id: 'M1' } }
      : c.url.endsWith('/2/tweets') ? { data: { id: '1999', text: '' } } : {}));
    const d = draftXPost(q());
    const res = await publishX(f.db, q(), d, png);
    expect(res).toEqual({ id: '1999', url: 'https://x.com/sisma_io/status/1999', image: true });
    expect(calls.map(c => c.url)).toEqual([
      'https://api.x.com/2/media/upload/initialize',
      'https://api.x.com/2/media/upload/M1/append',
      'https://api.x.com/2/media/upload/M1/append',
      'https://api.x.com/2/media/upload/M1/finalize',
      'https://api.x.com/2/media/metadata',
      'https://api.x.com/2/tweets',
    ]);
    for (const c of calls) expect((c.init.headers as Record<string, string>).authorization).toBe('Bearer AT');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ media_type: 'image/png', total_bytes: png.byteLength, media_category: 'tweet_image' });
    const parts = [calls[1], calls[2]].map(c => c.init.body as FormData);
    expect(parts.map(b => b.get('segment_index'))).toEqual(['0', '1']);
    expect(await Promise.all(parts.map(async b => (b.get('media') as Blob).size))).toEqual([1024 * 1024, 10]);
    expect(JSON.parse(String(calls[4].init.body))).toEqual({ id: 'M1', metadata: { alt_text: { text: d.alt } } });
    expect(JSON.parse(String(calls[5].init.body))).toEqual({ text: d.text, media: { media_ids: ['M1'] } });
  });

  it('posts text only when there is no card', async () => {
    const f = fakeDb();
    f.session = session();
    const calls = mockFetch(() => ({ data: { id: '2000' } }));
    const d = draftXPost(q());
    expect((await publishX(f.db, q(), d, null)).image).toBe(false);
    expect(calls.map(c => c.url)).toEqual(['https://api.x.com/2/tweets']);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ text: d.text });
  });

  it('renews an expiring token first and saves the new refresh token', async () => {
    const f = fakeDb();
    f.session = session({ expiresAt: Date.now() + 60_000 });
    const calls = mockFetch(c => (c.url.endsWith('/oauth2/token') ? { access_token: 'AT2', refresh_token: 'RT2', expires_in: 7200, scope: X_SCOPES.join(' ') } : { data: { id: '2001' } }));
    await publishX(f.db, q(), draftXPost(q()), null);
    expect(Object.fromEntries(new URLSearchParams(String(calls[0].init.body)))).toEqual({ grant_type: 'refresh_token', refresh_token: 'RT' });
    expect((calls[1].init.headers as Record<string, string>).authorization).toBe('Bearer AT2');
    expect(f.session).toMatchObject({ accessToken: 'AT2', refreshToken: 'RT2' });
  });

  it('reports X’s error message and a short code', async () => {
    const f = fakeDb();
    f.session = session();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ title: 'Forbidden', detail: 'You are not allowed to create a Tweet with duplicate content.', status: 403 }), { status: 403 })));
    await expect(publishX(f.db, q(), draftXPost(q()), null)).rejects.toMatchObject({ code: 'duplicate', message: expect.stringContaining('duplicate content') });
  });
});
