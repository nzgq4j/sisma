'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { useStickToBottom } from './useStickToBottom';

const TABS = [
  { href: '/app', key: 'tab_feed', icon: 'format_list_bulleted' },
  { href: '/app/map', key: 'tab_map', icon: 'map' },
  { href: '/app/globe', key: 'tab_globe', icon: 'public' },
  { href: '/app/science', key: 'tab_science', icon: 'science' },
  { href: '/app/me', key: 'tab_me', icon: 'person' },
] as const;

export function BottomNav() {
  const path = usePathname();
  const { t } = useT();
  const ref = useStickToBottom<HTMLElement>();
  return (
    <nav ref={ref} style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 'calc(80px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)', background: 'var(--surface)', borderTop: '1px solid var(--line)', display: 'flex', zIndex: 10 }}>
      {/* The bar's colour continues below it, so any remaining gap under the bar shows the bar, not the page. */}
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '100%', height: 160, background: 'var(--surface)', pointerEvents: 'none' }} />
      {TABS.map(tab => {
        const on = tab.href === '/app' ? path === '/app' : path.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: on ? 'var(--violet-text)' : 'var(--ink2)', fontSize: 12, fontWeight: on ? 800 : 600, textDecoration: 'none' }}>
            <span style={{ width: 60, height: 32, borderRadius: 16, background: on ? 'var(--violet-soft)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className={'ms' + (on ? ' fill' : '')}>{tab.icon}</span>
            </span>
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
