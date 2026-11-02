'use client';
// Desktop navigation rail. Replaces the bottom bar at >= 1024px (see dash.module.css).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT, LOCALES, type Locale } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import styles from './dash.module.css';

const TABS = [
  { href: '/app', key: 'tab_feed', icon: 'dashboard' },
  { href: '/app/map', key: 'tab_map', icon: 'map' },
  { href: '/app/globe', key: 'tab_globe', icon: 'public' },
  { href: '/app/science', key: 'tab_science', icon: 'science' },
  { href: '/app/me', key: 'tab_me', icon: 'person' },
] as const;

export function SideNav() {
  const path = usePathname();
  const { t, m, locale, setLocale } = useT();
  const { plan } = useApp();
  return (
    <aside className={styles.side}>
      <Link href="/" className={styles.sideBrand} aria-label={m.dash.website}>
        <span className={styles.brandMark}><span className="ms">earthquake</span></span>
        <span className={styles.wordmark}>sisma<span>.io</span></span>
      </Link>
      <nav className={styles.sideNav}>
        {TABS.map(tab => {
          const on = tab.href === '/app' ? path === '/app' : path.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className={styles.sideLink} aria-current={on ? 'page' : undefined}>
              <span className={'ms' + (on ? ' fill' : '')}>{tab.icon}</span>
              {tab.href === '/app' ? m.dash.overview : t(tab.key)}
            </Link>
          );
        })}
      </nav>
      <div className={styles.sideFoot}>
        <div className={styles.planCard}>
          <span className={styles.planLabel}>{t('current')}</span>
          <strong>{plan === 'plus' ? 'sisma+' : t('plan_free')}</strong>
          {plan === 'free' && <Link href="/app/me" className={styles.planBtn}>{t('upgrade')}</Link>}
        </div>
        <label className={styles.langRow}>
          <span className="ms" aria-hidden="true">translate</span>
          <select value={locale} onChange={e => setLocale(e.target.value as Locale)} aria-label={t('language')}>
            {LOCALES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </label>
      </div>
    </aside>
  );
}
