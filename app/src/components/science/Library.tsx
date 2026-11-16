'use client';
// "In Depth" library pieces (lib/library.ts): the reader's translation, loaded on demand, and the article cards used on
// the Science list and the In Depth list. Cards look like the Science topics (tile, meta line, title, two-line blurb).
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT, type Locale } from '@/i18n/I18nProvider';
import { LIBRARY, libraryHref, loadLibraryTranslation, localLibrary, type LibraryTranslation } from '@/lib/library';
import styles from './science.module.css';

/** The library text for the current language: English straight away, the translation once its file has loaded. */
export function useLibraryTranslation(): LibraryTranslation | null {
  const { locale } = useT();
  const [loaded, setLoaded] = useState<{ locale: Locale; tr: LibraryTranslation | null } | null>(null);
  useEffect(() => {
    let alive = true;
    if (locale === 'en') return;
    loadLibraryTranslation(locale).then(tr => { if (alive) setLoaded({ locale, tr }); }).catch(() => { /* English */ });
    return () => { alive = false; };
  }, [locale]);
  return loaded?.locale === locale ? loaded.tr : null;
}

/** A date such as "16 November 2026" in the reader's language (dates in the content are UTC calendar days). */
export const formatDay = (day: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(day + 'T00:00:00Z'));

/** All library articles as cards; `exclude` leaves one out (e.g. the article being read). */
export function LibraryCards({ exclude }: { exclude?: string }) {
  const { t, locale } = useT();
  const tr = useLibraryTranslation();
  return (
    <div className={styles.topics}>
      {LIBRARY.filter(a => a.id !== exclude).map(src => {
        const a = localLibrary(src, tr, locale);
        return (
          <Link key={a.id} href={libraryHref(a.id)} className={styles.topic}>
            <span className={`${styles.tile} ${styles[a.tone as 'violet' | 'mint' | 'warm']}`}><span className="ms" aria-hidden="true">{a.icon}</span></span>
            <span className={styles.topicText} lang={a.lang}>
              <span className={styles.meta}>{t('min_read', { n: a.mins })}</span>
              <span className={styles.topicTitle}>{a.title}</span>
              <span className={styles.blurb}>{a.dek}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
