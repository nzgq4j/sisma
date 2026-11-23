// In Depth posts on Bluesky (Me → Administration), on the same pattern as the Play Store posts (lib/promo.ts): every
// article in each of the 10 languages, with that language's title, standfirst, hashtags and share card
// (public/og/<locale>/library-<id>.jpg; English: public/og/library-<id>.jpg) and a link that opens the article in that
// language (?lang=), tagged #geosky and #sciencesky. When switched on, the every-minute alert job posts twice a day, at a random minute in each half of
// the UTC day (00:00–12:00 and 12:00–24:00), choosing a random article and language among the combinations not yet
// posted in the current round (never the previous post's language or article while others remain); once every combination has been posted the next round starts. An article added later
// joins the current round. A post made by hand from the admin page counts as the post for that half-day.
// Hashtags, card descriptions and the alt-text wording per language: content/library-social/<locale>.json.
import type { SupabaseClient } from '@supabase/supabase-js';
import es from '@/content/library/es.json';
import fr from '@/content/library/fr.json';
import de from '@/content/library/de.json';
import it from '@/content/library/it.json';
import pt from '@/content/library/pt.json';
import ja from '@/content/library/ja.json';
import zh from '@/content/library/zh.json';
import id from '@/content/library/id.json';
import tr from '@/content/library/tr.json';
import sEn from '@/content/library-social/en.json';
import sEs from '@/content/library-social/es.json';
import sFr from '@/content/library-social/fr.json';
import sDe from '@/content/library-social/de.json';
import sIt from '@/content/library-social/it.json';
import sPt from '@/content/library-social/pt.json';
import sJa from '@/content/library-social/ja.json';
import sZh from '@/content/library-social/zh.json';
import sId from '@/content/library-social/id.json';
import sTr from '@/content/library-social/tr.json';
import { BLUESKY_MAX_GRAPHEMES, blueskySource, detectFacets, fitDek, graphemes, LIBRARY_CARD_H, LIBRARY_CARD_W, LIBRARY_FEED_TAGS, publishPost, siteImage, type Facet } from './bluesky';
import { fitsEnglish, LIBRARY, libraryArticle, libraryHref, type LibraryArticle, type LibraryTranslation } from './library';
import { SITE } from './site';

export const LIBRARY_POST_LOCALES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'id', 'tr'] as const;
export type LibraryPostLocale = (typeof LIBRARY_POST_LOCALES)[number];

interface Social { alt: string; articles: Record<string, { tags: string[]; image: string }> }
const SOCIAL: Record<LibraryPostLocale, Social> = { en: sEn, es: sEs, fr: sFr, de: sDe, it: sIt, pt: sPt, ja: sJa, zh: sZh, id: sId, tr: sTr } as Record<LibraryPostLocale, Social>;
const TEXT: Record<Exclude<LibraryPostLocale, 'en'>, LibraryTranslation> = { es, fr, de, it, pt, ja, zh, id, tr } as Record<Exclude<LibraryPostLocale, 'en'>, LibraryTranslation>;

export const isLibraryPostLocale = (v: unknown): v is LibraryPostLocale => typeof v === 'string' && (LIBRARY_POST_LOCALES as readonly string[]).includes(v);
export const isLibraryId = (v: unknown): v is string => typeof v === 'string' && !!libraryArticle(v);
export const comboKey = (article: string, l: LibraryPostLocale) => `${article}:${l}`;

/** All article / language combinations (every article in the library, in all 10 languages). */
export const allCombos = (ids: string[] = LIBRARY.map(a => a.id)) => ids.flatMap(article => LIBRARY_POST_LOCALES.map(locale => ({ article, locale })));
export const libraryPostTotal = () => LIBRARY.length * LIBRARY_POST_LOCALES.length;

/** The article's title and standfirst in that language (English when the translation is missing or out of step). */
function localText(a: LibraryArticle, l: LibraryPostLocale) {
  if (l === 'en') return { title: a.title, dek: a.dek };
  const t = TEXT[l][a.id];
  return fitsEnglish(a, t) ? { title: t.title, dek: t.dek } : { title: a.title, dek: a.dek };
}
/** The link: the article, opened in the post's language. */
export const libraryPostUrl = (article: string, l: LibraryPostLocale) => `${SITE.url}${libraryHref(article)}${l === 'en' ? '' : `?lang=${l}`}`;
/** The share card in that language: 1200 × 630 JPEG (scripts/og-cards.mjs). */
export const libraryPostImage = (article: string, l: LibraryPostLocale) => l === 'en' ? `/og/library-${article}.jpg` : `/og/${l}/library-${article}.jpg`;

export interface LibraryPostDraft { article: string; locale: LibraryPostLocale; text: string; facets: Facet[]; alt: string; image: string; url: string }

/** The post as published: title, as much of the standfirst as fits, the link and the hashtags (with #geosky #sciencesky), within 300 graphemes. */
export function draftLibraryPostIn(article: string, l: LibraryPostLocale): LibraryPostDraft {
  const a = libraryArticle(article);
  if (!a) throw new Error(`unknown article ${article}`);
  const { title, dek } = localText(a, l);
  const s = SOCIAL[l].articles[a.id];
  // The article's hashtags in that language, then the #geosky and #sciencesky feeds (every language).
  const tags = [...(l === 'en' || !s ? a.hashtags : s.tags), ...LIBRARY_FEED_TAGS].map(t => `#${t}`).join(' ');
  const url = libraryPostUrl(a.id, l);
  const build = (d: string) => [title, ...(d ? [d] : []), url, tags].join('\n\n');
  const room = BLUESKY_MAX_GRAPHEMES - graphemes(build('')) - 2;
  const text = build(room > 0 ? fitDek(dek, room) : '');
  const picture = l === 'en' || !s ? a.cardImage : s.image;
  const alt = SOCIAL[l].alt.replace('{title}', title).replace('{address}', `sisma.io${libraryHref(a.id)}`).replace('{image}', picture);
  return { article: a.id, locale: l, text, facets: detectFacets(text), alt, image: libraryPostImage(a.id, l), url };
}

/** A random combination not in `used` (keys from comboKey), or null when every one has been posted. */
export function pickCombo(used: Set<string>, rand = Math.random, ids?: string[], last?: { article: string; locale: string } | null) {
  return spread(allCombos(ids).filter(c => !used.has(comboKey(c.article, c.locale))), last, rand);
}

/**
 * A random one of `left`, avoiding the language and the article of the previous post while other choices remain, so
 * both the article and the language vary from one post to the next.
 */
export function spread<T extends { article: string; locale: string }>(left: T[], last: { article: string; locale: string } | null | undefined, rand = Math.random): T | null {
  if (!left.length) return null;
  const tiers = last ? [left.filter(c => c.locale !== last.locale && c.article !== last.article), left.filter(c => c.locale !== last.locale), left] : [left];
  const pool = tiers.find(t => t.length)!;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}

// --- Two posts a day: one at a random minute in each half of the UTC day ---
const HALF = 43_200_000, MINUTE = 60_000;
const halfStart = (ms: number) => Math.floor(ms / HALF) * HALF;
/** A random minute in the half-day after the one `now` is in. */
export const nextSlot = (now: number, rand = Math.random) => halfStart(now) + HALF + Math.floor(rand() * (HALF / MINUTE)) * MINUTE;
/** A random minute in the rest of the current half-day, when switched on; the next half-day if less than ten minutes are left. */
export function firstSlot(now: number, rand = Math.random) {
  const end = halfStart(now) + HALF, from = now + 5 * MINUTE;
  return end - from < 10 * MINUTE ? nextSlot(now, rand) : from + Math.floor(rand() * ((end - from) / MINUTE)) * MINUTE;
}
export const sameHalfDay = (a: number, b: number) => halfStart(a) === halfStart(b);

// --- With the database (service role) ---
export interface LibraryPostSettings { enabled: boolean; next_at: string | null; cycle: number }
export interface LibraryPostRow { id: number; cycle: number; article_id: string; locale: string; status: 'posting' | 'posted' | 'failed'; error: string | null; post_url: string | null; manual: boolean; created_at: string }

export async function libraryPostSettings(db: SupabaseClient): Promise<LibraryPostSettings | null> {
  const { data } = await db.from('library_post_settings').select('enabled, next_at, cycle').eq('id', 1).maybeSingle();
  return (data as LibraryPostSettings | null) ?? null;
}

/** Combinations already posted (or being posted) in this round, for articles still in the library. */
export async function usedCombos(db: SupabaseClient, cycle: number): Promise<Set<string>> {
  const { data } = await db.from('library_posts').select('article_id, locale').eq('cycle', cycle).neq('status', 'failed');
  return new Set(((data ?? []) as { article_id: string; locale: string }[]).filter(r => libraryArticle(r.article_id)).map(r => `${r.article_id}:${r.locale}`));
}

/** The combination to post: the one asked for, else a random unused one (starting the next round when all are used). */
async function chooseCombo(db: SupabaseClient, s: LibraryPostSettings, want?: { article?: string; locale?: LibraryPostLocale }) {
  let cycle = s.cycle;
  let used = await usedCombos(db, cycle);
  if (want?.article && want.locale) return { article: want.article, locale: want.locale, cycle };
  const fits = (c: { article: string; locale: LibraryPostLocale }) => (!want?.article || c.article === want.article) && (!want?.locale || c.locale === want.locale);
  let left = allCombos().filter(c => fits(c) && !used.has(comboKey(c.article, c.locale)));
  if (!left.length && used.size >= libraryPostTotal()) {
    cycle += 1;
    await db.from('library_post_settings').update({ cycle }).eq('id', 1);
    used = new Set();
    left = allCombos().filter(fits);
  }
  if (!left.length) left = allCombos().filter(fits); // that article (or language) is done this round: a repeat by hand
  const { data: prev } = await db.from('library_posts').select('article_id, locale').neq('status', 'failed').order('created_at', { ascending: false }).limit(1);
  const last = (prev as { article_id: string; locale: string }[] | null)?.[0];
  const c = spread(left, last ? { article: last.article_id, locale: last.locale } : null)!;
  return { ...c, cycle };
}

export type LibraryPostOutcome = { ok: true; url: string; image: boolean; article: string; locale: LibraryPostLocale } | { ok: false; error: string };

/** Records and publishes one post with its share card. */
async function publishLibraryPost(db: SupabaseClient, c: { article: string; locale: LibraryPostLocale; cycle: number }, opts: { manual: boolean; by?: string | null; origin?: string }): Promise<LibraryPostOutcome> {
  const d = draftLibraryPostIn(c.article, c.locale);
  const ins = await db.from('library_posts').insert({ cycle: c.cycle, article_id: c.article, locale: c.locale, text: d.text, alt: d.alt, status: 'posting', manual: opts.manual, posted_by: opts.by ?? null }).select('id').single();
  if (ins.error || !ins.data) return { ok: false, error: 'could not record the post' };
  const rowId = (ins.data as { id: number }).id;
  try {
    const image = (opts.origin ? await siteImage(d.image, opts.origin, LIBRARY_CARD_W, LIBRARY_CARD_H) : null) ?? await siteImage(d.image, SITE.url, LIBRARY_CARD_W, LIBRARY_CARD_H);
    const res = await publishPost(db, { text: d.text, facets: d.facets, alt: d.alt, langs: [c.locale] }, image);
    await db.from('library_posts').update({ status: 'posted', post_uri: res.uri, post_url: res.url }).eq('id', rowId);
    return { ok: true, url: res.url, image: res.image, article: c.article, locale: c.locale };
  } catch (e) {
    const error = String((e as Error)?.message ?? e).slice(0, 500);
    await db.from('library_posts').update({ status: 'failed', error }).eq('id', rowId);
    return { ok: false, error };
  }
}

/** Posts now from the admin page; it counts as this half-day's post, so a later automatic one moves to the next half-day. */
export async function postLibraryNow(db: SupabaseClient, want: { article?: string; locale?: LibraryPostLocale }, opts: { by: string; origin: string }, now = Date.now()): Promise<LibraryPostOutcome> {
  const s = await libraryPostSettings(db);
  if (!s) return { ok: false, error: 'not_configured' };
  const c = await chooseCombo(db, s, want);
  const r = await publishLibraryPost(db, c, { manual: true, ...opts });
  if (r.ok && s.enabled && s.next_at && sameHalfDay(Date.parse(s.next_at), now) && Date.parse(s.next_at) > now) {
    await db.from('library_post_settings').update({ next_at: new Date(nextSlot(now)).toISOString() }).eq('id', 1).eq('next_at', s.next_at);
  }
  return r;
}

/** The twice-daily step of the every-minute alert job. Never throws. */
export async function autoLibraryPost(db: SupabaseClient, now: number): Promise<{ posted: boolean; error?: string } | { skipped: string }> {
  try {
    const s = await libraryPostSettings(db);
    if (!s?.enabled) return { skipped: 'off' };
    if (!s.next_at) {
      await db.from('library_post_settings').update({ next_at: new Date(firstSlot(now)).toISOString() }).eq('id', 1).is('next_at', null);
      return { skipped: 'scheduled' };
    }
    if (Date.parse(s.next_at) > now) return { skipped: 'waiting' };
    if (!(await blueskySource(db))) return { skipped: 'not_configured' };
    // Claim this slot by moving it to the next half-day first, so two overlapping runs never both post.
    const claim = await db.from('library_post_settings').update({ next_at: new Date(nextSlot(now)).toISOString() }).eq('id', 1).eq('next_at', s.next_at).select('id');
    if (claim.error || !claim.data?.length) return { skipped: 'taken' };
    const r = await publishLibraryPost(db, await chooseCombo(db, s), { manual: false });
    return r.ok ? { posted: true } : { posted: false, error: r.error };
  } catch (e) {
    console.error('library auto post', e);
    return { skipped: 'error' };
  }
}
