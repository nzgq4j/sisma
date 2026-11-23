// "In Depth" library under Science: long-form, sourced articles on earthquakes, geology and tectonics.
// English text, SEO fields and references in content/library.json; the reader-facing text (title, standfirst,
// sections, FAQ) in content/library/<locale>.json, loaded only for the language in use. A translation that is
// missing or out of step with the English (different number of sections, paragraphs or FAQ items) falls back to
// English for that article; npm run check:i18n reports any such gap. Titles and descriptions for search engines,
// the references and the URLs stay English.
import library from '@/content/library.json';
import type { Locale } from '@/i18n/I18nProvider';

export interface LibrarySection { h: string; p: string[] }
export interface LibraryFaq { q: string; a: string }
export interface LibraryArticle {
  id: string; icon: string; tone: string; title: string; description: string; dek: string;
  published: string; updated: string; mins: number;
  /** Bluesky / social: hashtags without '#', and what the share card's picture shows (for its alt text). English. */
  hashtags: string[]; cardImage: string;
  sections: LibrarySection[]; faq: LibraryFaq[]; refs: { text: string; url: string | null }[];
}
export interface LibraryText { title: string; dek: string; sections: LibrarySection[]; faq: LibraryFaq[] }
export type LibraryTranslation = Record<string, LibraryText>;

export const LIBRARY = library as LibraryArticle[];
export const LIBRARY_PATH = '/app/science/in-depth';
export const libraryArticle = (id: string) => LIBRARY.find(a => a.id === id) ?? null;
export const libraryHref = (id: string) => `${LIBRARY_PATH}/${id}`;

/** Whether a translation has the same shape as the English: sections, paragraphs per section and FAQ items. */
export function fitsEnglish(a: LibraryArticle, t: LibraryText | undefined): t is LibraryText {
  return !!t && !!t.title && !!t.dek && t.sections?.length === a.sections.length
    && t.sections.every((s, i) => !!s.h && s.p?.length === a.sections[i].p.length && s.p.every(Boolean))
    && t.faq?.length === a.faq.length && t.faq.every(f => !!f.q && !!f.a);
}

/** The reader-facing text in the translation when it fits, else English; `lang` is the language it is in. */
export function localLibrary(a: LibraryArticle, tr: LibraryTranslation | null, locale: Locale): LibraryArticle & { lang: Locale } {
  const t = tr?.[a.id];
  return fitsEnglish(a, t) ? { ...a, title: t.title, dek: t.dek, sections: t.sections, faq: t.faq, lang: locale } : { ...a, lang: 'en' };
}

/** The share card shown under an article's title, in the language the text is in (scripts/og-cards.mjs; 1200 × 630). */
export const libraryCardSrc = (id: string, lang: Locale) => (lang === 'en' ? `/og/library-${id}.jpg` : `/og/${lang}/library-${id}.jpg`);

/** What each article's share card shows, per language (content/library-social/<locale>.json; also used for Bluesky alt text). */
export type LibraryCardText = Record<string, { image: string }>;
export async function loadLibraryCardText(locale: Locale): Promise<LibraryCardText | null> {
  switch (locale) {
    case 'es': return (await import('@/content/library-social/es.json')).default.articles;
    case 'fr': return (await import('@/content/library-social/fr.json')).default.articles;
    case 'de': return (await import('@/content/library-social/de.json')).default.articles;
    case 'it': return (await import('@/content/library-social/it.json')).default.articles;
    case 'pt': return (await import('@/content/library-social/pt.json')).default.articles;
    case 'ja': return (await import('@/content/library-social/ja.json')).default.articles;
    case 'zh': return (await import('@/content/library-social/zh.json')).default.articles;
    case 'id': return (await import('@/content/library-social/id.json')).default.articles;
    case 'tr': return (await import('@/content/library-social/tr.json')).default.articles;
    default: return null;
  }
}

/** Each language's file is its own chunk, fetched only when that language is in use. */
export async function loadLibraryTranslation(locale: Locale): Promise<LibraryTranslation | null> {
  switch (locale) {
    case 'es': return (await import('@/content/library/es.json')).default;
    case 'fr': return (await import('@/content/library/fr.json')).default;
    case 'de': return (await import('@/content/library/de.json')).default;
    case 'it': return (await import('@/content/library/it.json')).default;
    case 'pt': return (await import('@/content/library/pt.json')).default;
    case 'ja': return (await import('@/content/library/ja.json')).default;
    case 'zh': return (await import('@/content/library/zh.json')).default;
    case 'id': return (await import('@/content/library/id.json')).default;
    case 'tr': return (await import('@/content/library/tr.json')).default;
    default: return null;
  }
}
