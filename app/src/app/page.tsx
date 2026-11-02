'use client';
// Public overview website. Spec: design/Sisma Website.dc.html (nav, hero with live app, features, science, pricing, languages, footer).
import Link from 'next/link';
import { useT, LOCALES } from '@/i18n/I18nProvider';

export default function Home() {
  const { m, t, locale, setLocale } = useT();
  return (
    <main>
      <header style={{ position: 'sticky', top: 0, display: 'flex', gap: 20, alignItems: 'center', padding: '12px 24px', background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
        <strong style={{ fontSize: 20 }}>sisma<span style={{ color: 'var(--ink2)' }}>.io</span></strong>
        <nav style={{ display: 'flex', gap: 20, flex: 1 }}>
          <a href="#features">{m.web.nav_features}</a><a href="#science">{m.web.nav_science}</a><a href="#pricing">{m.web.nav_pricing}</a>
        </nav>
        <select value={locale} onChange={e => setLocale(e.target.value as never)}>{LOCALES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
        <Link href="/app">{m.web.open_app}</Link>
      </header>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 24px' }}>
        <h1 style={{ fontSize: 'clamp(40px,6vw,68px)', letterSpacing: '-.035em', margin: 0 }}>{m.web.hero_h}</h1>
        <p style={{ fontSize: 19, color: 'var(--ink2)', maxWidth: 540 }}>{m.web.hero_p}</p>
        {/* TODO: features, science grid, pricing (monthly/yearly toggle), languages, footer — see design file */}
        <p>{t('trial')}</p>
      </section>
    </main>
  );
}
