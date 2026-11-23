// Play Store posts on Bluesky (Me → Administration): 10 posts about the Android app, each written in all 10 languages
// with its own hashtags and image description (content/promo/<locale>.json), illustrated with that language's Play
// Store screenshot or feature graphic (public/promo/<locale>/<image>.jpg) and linked to the Play listing in that
// language. When switched on, the every-minute alert job posts one a day at a random time (UTC), choosing a random
// post and language among the combinations not yet posted in the current round (not the previous post's language or post
// while others remain); after all 100 the next round starts.
// A post made by hand from the admin page counts as that day's post. docs/bluesky-setup.md
import type { SupabaseClient } from '@supabase/supabase-js';
import en from '@/content/promo/en.json';
import es from '@/content/promo/es.json';
import fr from '@/content/promo/fr.json';
import de from '@/content/promo/de.json';
import it from '@/content/promo/it.json';
import pt from '@/content/promo/pt.json';
import ja from '@/content/promo/ja.json';
import zh from '@/content/promo/zh.json';
import id from '@/content/promo/id.json';
import tr from '@/content/promo/tr.json';
import { blueskySource, detectFacets, publishPost, siteImage, type Facet } from './bluesky';
import { SITE } from './site';

export const PROMO_IDS = ['feed', 'detail', 'map', 'region', 'globe', 'depth', 'science', 'alerts', 'pulse', 'felt'] as const;
export type PromoId = (typeof PROMO_IDS)[number];
export const PROMO_LOCALES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'id', 'tr'] as const;
export type PromoLocale = (typeof PROMO_LOCALES)[number];
export const PROMO_TOTAL = PROMO_IDS.length * PROMO_LOCALES.length;

interface PromoText { text: string; tags: string[]; alt: string }
const CONTENT: Record<PromoLocale, Record<PromoId, PromoText>> = { en, es, fr, de, it, pt, ja, zh, id, tr };

/** Google Play's language parameter for each locale (Portuguese is the Brazilian listing). */
const PLAY_HL: Record<PromoLocale, string> = { en: 'en', es: 'es', fr: 'fr', de: 'de', it: 'it', pt: 'pt-BR', ja: 'ja', zh: 'zh-CN', id: 'id', tr: 'tr' };
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=io.sisma.app';
export const playUrl = (l: PromoLocale) => `${PLAY_URL}&hl=${PLAY_HL[l]}`;

/** Pictures: the Play Store phone screenshot for the topic (720 × 1280), or the feature graphic (1024 × 500). */
const FEATURE: PromoId[] = ['pulse', 'felt'];
export const promoImage = (p: PromoId, l: PromoLocale) => FEATURE.includes(p)
  ? { path: `/promo/${l}/feature.jpg`, width: 1024, height: 500 }
  : { path: `/promo/${l}/${p}.jpg`, width: 720, height: 1280 };

export const isPromoId = (v: unknown): v is PromoId => typeof v === 'string' && (PROMO_IDS as readonly string[]).includes(v);
export const isPromoLocale = (v: unknown): v is PromoLocale => typeof v === 'string' && (PROMO_LOCALES as readonly string[]).includes(v);
export const comboKey = (p: PromoId, l: PromoLocale) => `${p}:${l}`;

export interface PromoDraft { post: PromoId; locale: PromoLocale; text: string; facets: Facet[]; alt: string; image: string; url: string }

/** The post as published: the text, the Play link in that language, then the hashtags. */
export function draftPromo(p: PromoId, l: PromoLocale): PromoDraft {
  const c = CONTENT[l][p];
  const url = playUrl(l);
  const text = `${c.text}\n\n${url}\n\n${c.tags.map(t => `#${t}`).join(' ')}`;
  return { post: p, locale: l, text, facets: detectFacets(text), alt: c.alt, image: promoImage(p, l).path, url };
}

/** All 100 post / language combinations. */
export const allCombos = () => PROMO_IDS.flatMap(p => PROMO_LOCALES.map(l => ({ post: p, locale: l })));

/** A random combination not in `used` (keys from comboKey), or null when every one has been posted. */
export function pickCombo(used: Set<string>, rand = Math.random, last?: { post: string; locale: string } | null) {
  return spread(allCombos().filter(c => !used.has(comboKey(c.post, c.locale))), last, rand);
}

/** A random one of `left`, avoiding the language and the post of the previous one while other choices remain. */
export function spread<T extends { post: string; locale: string }>(left: T[], last: { post: string; locale: string } | null | undefined, rand = Math.random): T | null {
  if (!left.length) return null;
  const tiers = last ? [left.filter(c => c.locale !== last.locale && c.post !== last.post), left.filter(c => c.locale !== last.locale), left] : [left];
  const pool = tiers.find(t => t.length)!;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}

const DAY = 86_400_000, MINUTE = 60_000;
const dayStart = (ms: number) => Math.floor(ms / DAY) * DAY;
/** A random minute on the UTC day after `now`. */
export const nextSlot = (now: number, rand = Math.random) => dayStart(now) + DAY + Math.floor(rand() * (DAY / MINUTE)) * MINUTE;
/** A random minute in the rest of today (UTC), when switched on; tomorrow if less than ten minutes are left. */
export function firstSlot(now: number, rand = Math.random) {
  const end = dayStart(now) + DAY, from = now + 5 * MINUTE;
  return end - from < 10 * MINUTE ? nextSlot(now, rand) : from + Math.floor(rand() * ((end - from) / MINUTE)) * MINUTE;
}
export const sameUtcDay = (a: number, b: number) => dayStart(a) === dayStart(b);

// --- With the database (service role) ---
export interface PromoSettings { enabled: boolean; next_at: string | null; cycle: number }
export interface PromoRow { id: number; cycle: number; post_id: string; locale: string; status: 'posting' | 'posted' | 'failed'; error: string | null; post_url: string | null; manual: boolean; created_at: string }

export async function promoSettings(db: SupabaseClient): Promise<PromoSettings | null> {
  const { data } = await db.from('promo_settings').select('enabled, next_at, cycle').eq('id', 1).maybeSingle();
  return (data as PromoSettings | null) ?? null;
}

/** Combinations already posted (or being posted) in this round. */
export async function usedCombos(db: SupabaseClient, cycle: number): Promise<Set<string>> {
  const { data } = await db.from('promo_posts').select('post_id, locale').eq('cycle', cycle).neq('status', 'failed');
  return new Set(((data ?? []) as { post_id: string; locale: string }[]).map(r => `${r.post_id}:${r.locale}`));
}

/** The combination to post: the one asked for, else a random unused one (starting the next round after all 100). */
async function chooseCombo(db: SupabaseClient, s: PromoSettings, want?: { post?: PromoId; locale?: PromoLocale }) {
  let cycle = s.cycle;
  let used = await usedCombos(db, cycle);
  if (want?.post && want.locale) return { post: want.post, locale: want.locale, cycle };
  const fits = (c: { post: PromoId; locale: PromoLocale }) => (!want?.post || c.post === want.post) && (!want?.locale || c.locale === want.locale);
  let left = allCombos().filter(c => fits(c) && !used.has(comboKey(c.post, c.locale)));
  if (!left.length && used.size >= PROMO_TOTAL) {
    cycle += 1;
    await db.from('promo_settings').update({ cycle }).eq('id', 1);
    used = new Set();
    left = allCombos().filter(fits);
  }
  if (!left.length) left = allCombos().filter(fits); // that post (or language) is done this round: allow a repeat by hand
  const { data: prev } = await db.from('promo_posts').select('post_id, locale').neq('status', 'failed').order('created_at', { ascending: false }).limit(1);
  const last = (prev as { post_id: string; locale: string }[] | null)?.[0];
  const c = spread(left, last ? { post: last.post_id, locale: last.locale } : null)!;
  return { ...c, cycle };
}

export type PromoOutcome = { ok: true; url: string; image: boolean; post: PromoId; locale: PromoLocale } | { ok: false; error: string };

/** Records and publishes one post with its picture. */
async function publishPromo(db: SupabaseClient, c: { post: PromoId; locale: PromoLocale; cycle: number }, opts: { manual: boolean; by?: string | null; origin?: string }): Promise<PromoOutcome> {
  const d = draftPromo(c.post, c.locale);
  const ins = await db.from('promo_posts').insert({ cycle: c.cycle, post_id: c.post, locale: c.locale, text: d.text, alt: d.alt, status: 'posting', manual: opts.manual, posted_by: opts.by ?? null }).select('id').single();
  if (ins.error || !ins.data) return { ok: false, error: ins.error?.code === '23505' ? 'already_posted' : 'could not record the post' };
  const rowId = (ins.data as { id: number }).id;
  try {
    const img = promoImage(c.post, c.locale);
    const image = (opts.origin ? await siteImage(img.path, opts.origin, img.width, img.height) : null) ?? await siteImage(img.path, SITE.url, img.width, img.height);
    const res = await publishPost(db, { text: d.text, facets: d.facets, alt: d.alt, langs: [c.locale] }, image);
    await db.from('promo_posts').update({ status: 'posted', post_uri: res.uri, post_url: res.url }).eq('id', rowId);
    return { ok: true, url: res.url, image: res.image, post: c.post, locale: c.locale };
  } catch (e) {
    const error = String((e as Error)?.message ?? e).slice(0, 500);
    await db.from('promo_posts').update({ status: 'failed', error }).eq('id', rowId);
    return { ok: false, error };
  }
}

/** Posts now from the admin page; it counts as today's post, so a later automatic post today moves to tomorrow. */
export async function postPromoNow(db: SupabaseClient, want: { post?: PromoId; locale?: PromoLocale }, opts: { by: string; origin: string }, now = Date.now()): Promise<PromoOutcome> {
  const s = await promoSettings(db);
  if (!s) return { ok: false, error: 'not_configured' };
  const c = await chooseCombo(db, s, want);
  const r = await publishPromo(db, c, { manual: true, ...opts });
  if (r.ok && s.enabled && s.next_at && sameUtcDay(Date.parse(s.next_at), now) && Date.parse(s.next_at) > now) {
    await db.from('promo_settings').update({ next_at: new Date(nextSlot(now)).toISOString() }).eq('id', 1).eq('next_at', s.next_at);
  }
  return r;
}

/** The daily step of the every-minute alert job. Never throws. */
export async function autoPromo(db: SupabaseClient, now: number): Promise<{ posted: boolean; error?: string } | { skipped: string }> {
  try {
    const s = await promoSettings(db);
    if (!s?.enabled) return { skipped: 'off' };
    if (!s.next_at) {
      await db.from('promo_settings').update({ next_at: new Date(firstSlot(now)).toISOString() }).eq('id', 1).is('next_at', null);
      return { skipped: 'scheduled' };
    }
    if (Date.parse(s.next_at) > now) return { skipped: 'waiting' };
    if (!(await blueskySource(db))) return { skipped: 'not_configured' };
    // Claim this slot by moving it to tomorrow first, so two overlapping runs never both post.
    const claim = await db.from('promo_settings').update({ next_at: new Date(nextSlot(now)).toISOString() }).eq('id', 1).eq('next_at', s.next_at).select('id');
    if (claim.error || !claim.data?.length) return { skipped: 'taken' };
    const r = await publishPromo(db, await chooseCombo(db, s), { manual: false });
    return r.ok ? { posted: true } : { posted: false, error: r.error };
  } catch (e) {
    console.error('promo auto post', e);
    return { skipped: 'error' };
  }
}
