'use client';
// Frame of the help centre: a sticky header with Back (to the page you came from, or Me), the help home and Back to
// app; the topic list beside the article on wide screens; previous / next topic links; a translated notice that the
// guide is in English. Follows the app's light / dark setting (globals.css tokens), unlike the light-only website.
import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { LogoMark } from '@/components/Logo';
import s from './help.module.css';

export interface NavTopic { slug: string; icon: string; title: string; sub: string }

export function HelpChrome({ nav, current, title, children }: { nav: NavTopic[]; current?: string; title: string; children: ReactNode }) {
  const { m, locale } = useT();
  const w = m.web;
  const router = useRouter();
  const i = current ? nav.findIndex(t => t.slug === current) : -1;
  const prev = i > 0 ? nav[i - 1] : null, next = i >= 0 && i < nav.length - 1 ? nav[i + 1] : null;

  // Back: return to the page you came from on sisma (the app, or another help page). The Navigation API lists only this
  // site's history entries, so index > 0 means one exists; browsers without it fall back to the referrer. Opened from
  // elsewhere, Back goes one level up: a topic to the help home, the help home to Me.
  const up = current ? '/help' : '/app/me';
  const back = (e: React.MouseEvent) => {
    e.preventDefault();
    let inSite = false;
    try {
      const nav = (window as { navigation?: { currentEntry?: { index: number } | null } }).navigation;
      if (nav?.currentEntry) inSite = nav.currentEntry.index > 0;
      else inSite = !!document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1;
    } catch { /* no history information */ }
    if (inSite) router.back(); else router.push(up);
  };

  return (
    <div className={s.frame}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <a href={up} onClick={back} className={s.back}><span className="ms" aria-hidden="true">arrow_back</span>{m.sub.back}</a>
          <Link href="/help" className={s.brand} aria-label={w.help}><LogoMark size={28} /><span>{w.help}</span></Link>
          <Link href="/app" className={s.openApp}>{w.help_back_to_app}</Link>
        </div>
      </header>

      <div className={s.layout}>
        <nav className={s.side} aria-label={w.help_topics}>
          <Link href="/help" className={s.sideHome} aria-current={current ? undefined : 'page'}><span className="ms" aria-hidden="true">home</span>{w.help_topics}</Link>
          <ul>
            {nav.map(t => (
              <li key={t.slug}>
                <Link href={`/help/${t.slug}`} aria-current={t.slug === current ? 'page' : undefined} lang="en">
                  <span className="ms" aria-hidden="true">{t.icon}</span>{t.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className={s.main}>
          {current && (
            <p className={s.crumbs}><Link href="/help">{w.help}</Link><span aria-hidden="true">›</span><span lang="en">{title}</span></p>
          )}
          <h1 className={s.h1} lang={current ? 'en' : undefined}>{title}</h1>
          {locale !== 'en' && <p className={s.notice} lang={locale}>{w.help_english}</p>}
          <div className={s.doc} lang="en">{children}</div>

          {current && (
            <nav className={s.pager} aria-label={w.help_topics}>
              {prev ? <Link href={`/help/${prev.slug}`} className={s.pagerLink}><small>{w.help_prev}</small><span lang="en"><span className="ms" aria-hidden="true">arrow_back</span>{prev.title}</span></Link> : <span />}
              {next ? <Link href={`/help/${next.slug}`} className={`${s.pagerLink} ${s.pagerNext}`}><small>{w.help_next}</small><span lang="en">{next.title}<span className="ms" aria-hidden="true">arrow_forward</span></span></Link> : <span />}
            </nav>
          )}
        </main>
      </div>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <p>{w.footer}</p>
          <span className={s.footerLinks}>
            <Link href="/help">{w.help}</Link>
            <Link href="/privacy">{w.privacy}</Link>
            <Link href="/terms">{w.terms}</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

/** Links to the old one-page guide (/help#section) open the topic's own page. */
const OLD_ANCHORS: Record<string, string> = {
  'password-reset': 'account#password-reset', 'delete-account': 'account#delete-account', cancel: 'plus#cancel',
};
export function OldAnchorRedirect({ slugs }: { slugs: string[] }) {
  const router = useRouter();
  useEffect(() => {
    const h = location.hash.slice(1);
    const to = OLD_ANCHORS[h] ?? (slugs.includes(h) ? h : null);
    if (to) router.replace(`/help/${to}`);
  }, [router, slugs]);
  return null;
}
