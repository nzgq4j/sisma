'use client';
// Desktop navigation rail. Replaces the bottom bar at >= 1024px (see dash.module.css).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { LanguagePicker } from '@/components/LanguagePicker';
import { useApp } from '@/components/AppState';
import { LogoMark } from '@/components/Logo';
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
  const { t, m } = useT();
  const { plan } = useApp();
  return (
    <aside className={styles.side}>
      <Link href="/" className={styles.sideBrand} aria-label={m.dash.website}>
        <LogoMark size={34} />
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
        <LanguagePicker>{(open, cur) => (
          <button type="button" className={styles.langRow} onClick={open} aria-haspopup="dialog" aria-label={`${t('language')}: ${cur.name}`}>
            <span className="ms" aria-hidden="true">translate</span>
            <span className={styles.langName}>{cur.name}</span>
            <span className="ms" aria-hidden="true">expand_less</span>
          </button>
        )}</LanguagePicker>
      </div>
    </aside>
  );
}
