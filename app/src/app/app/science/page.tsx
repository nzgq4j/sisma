'use client';
import Link from 'next/link';
import science from '@/content/science.json';
import { useT } from '@/i18n/I18nProvider';

export default function SciencePage() {
  const { m, t } = useT();
  return (
    <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: 'var(--ink2)' }}>{m.sci_sub}</p>
      {science.map((a, i) => (
        <Link key={a.id} href={'/app/science/' + a.id} style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 22, background: 'var(--surface)', color: 'var(--ink)', textDecoration: 'none' }}>
          <span className="ms" style={{ fontSize: 28 }}>{a.icon}</span>
          <span><small>{String(i + 1).padStart(2, '0')} · {t('min_read', { n: a.mins })}</small><br /><strong>{m.sci_t[i]}</strong></span>
        </Link>
      ))}
    </div>
  );
}
