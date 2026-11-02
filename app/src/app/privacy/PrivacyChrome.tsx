'use client';
// Translated header, notice and footer around the (English) privacy policy text. Light palette like the website.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { LogoMark } from '@/components/Logo';
import site from '@/components/site/site.module.css';
import styles from './privacy.module.css';

export function PrivacyChrome({ updated, children }: { updated: string; children: ReactNode }) {
  const { m, locale } = useT();
  const w = m.web;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(updated + 'T12:00:00Z'));
  return (
    <div className={site.site}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="sisma.io"><LogoMark size={30} fixed /><span>sisma<span>.io</span></span></Link>
        <Link href="/app" className={styles.open}>{w.privacy_open_app}</Link>
      </header>
      <main className={styles.doc}>
        <h1>{w.privacy}</h1>
        <p className={styles.meta}>{w.privacy_updated.replace('{date}', date)}</p>
        {locale !== 'en' && <p className={styles.notice} lang={locale}>{w.privacy_english}</p>}
        <div lang="en">{children}</div>
      </main>
      <footer className={site.footer}>
        <div className={site.footerInner}>
          <span className={site.footerMark}>sisma<span>.io</span></span>
          <p className={site.footerText}>{w.footer}</p>
          <Link href="/privacy" className={site.footerLink}>{w.privacy}</Link>
        </div>
      </footer>
    </div>
  );
}
