'use client';
// Phone top app bar (design: 56px bar under the status bar): logo on Feed, back arrow on an article,
// tab title, and the language pill. Hidden on desktop, where the side navigation takes over.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { LanguagePicker } from './LanguagePicker';
import { LogoMark } from './Logo';

export function AppBar() {
  const path = usePathname();
  const { t, locale } = useT();
  const article = path.startsWith('/app/science/');
  const title = path === '/app' ? 'sisma' : path.startsWith('/app/map') ? t('tab_map') : path.startsWith('/app/globe') ? t('tab_globe')
    : path.startsWith('/app/science') ? t('sci_title') : path.startsWith('/app/me') ? t('tab_me') : 'sisma';
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 10, height: 56, display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px 0 12px', background: 'var(--bg)' }}>
      {article && (
        <Link href="/app/science" aria-label={t('sci_title')} style={{ width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
          <span className="ms">arrow_back</span>
        </Link>
      )}
      {path === '/app' && <span style={{ paddingLeft: 4 }}><LogoMark size={30} /></span>}
      <div style={{ flex: 1, minWidth: 0, fontSize: 21, fontWeight: 750, letterSpacing: '-.01em', paddingLeft: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      <LanguagePicker>{open => (
        <button type="button" onClick={open} aria-label={t('language')} aria-haspopup="dialog"
          style={{ height: 36, border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface)', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px 0 8px', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', position: 'relative' }}>
          <span className="ms" aria-hidden="true" style={{ fontSize: 18 }}>translate</span>
          {locale.toUpperCase()}
        </button>
      )}</LanguagePicker>
    </header>
  );
}
