'use client';
// Translated header, notice and footer around the (English) legal pages: privacy policy and terms of service.
// Light palette like the website.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { LogoMark } from '@/components/Logo';
import site from '@/components/site/site.module.css';
import styles from './privacy.module.css';

export function PrivacyChrome({ updated, children, doc = 'privacy' }: { updated: string; children: ReactNode; doc?: 'privacy' | 'terms' }) {
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
        <h1>{doc === 'terms' ? w.terms : w.privacy}</h1>
        <p className={styles.meta}>{w.privacy_updated.replace('{date}', date)}</p>
        {locale !== 'en' && <p className={styles.notice} lang={locale}>{doc === 'terms' ? w.terms_english : w.privacy_english}</p>}
        <div lang="en">{children}</div>
      </main>
      <footer className={site.footer}>
        <div className={site.footerInner}>
          <span className={site.footerMark}>sisma<span>.io</span></span>
          <p className={site.footerText}>{w.footer}</p>
          <Link href="/privacy" className={site.footerLink}>{w.privacy}</Link>
          <Link href="/terms" className={site.footerLink}>{w.terms}</Link>
        </div>
      </footer>
    </div>
  );
}
