'use client';
import type { Quake } from '@/lib/quakes/types';
import { MagBadge } from './MagBadge';
import { useT } from '@/i18n/I18nProvider';
import { useDistance } from './Units';
import { FeltButton } from './FeltReport';

export function timeAgo(t: (k: never, v?: Record<string, number>) => string, ms: number) {
  const m = Math.round((Date.now() - ms) / 6e4);
  if (m < 1) return t('just_now' as never);
  if (m < 60) return t('ago_m' as never, { n: m });
  const h = Math.round(m / 60);
  return h < 48 ? t('ago_h' as never, { n: h }) : t('ago_d' as never, { n: Math.round(h / 24) });
}

export function QuakeRow({ q, onOpen }: { q: Quake & { distanceKm?: number | null }; onOpen: () => void }) {
  const { t } = useT();
  const u = useDistance();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, background: 'var(--surface)', borderRadius: 18 }}>
    <button onClick={onOpen} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: 12, paddingRight: 0, border: 0, background: 'transparent', borderRadius: 18, textAlign: 'left', color: 'var(--ink)', font: 'inherit', cursor: 'pointer' }}>
      <MagBadge mag={q.mag} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.region}</div>
        <div style={{ fontSize: 13, color: 'var(--ink2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.text(q.title)}</div>
        <div style={{ fontSize: 12, color: 'var(--ink2)', display: 'flex', gap: 10 }}>
          <span>{timeAgo(t as never, q.time)}</span>
          {q.distanceKm != null && <span>{u.dist(q.distanceKm)}</span>}
          <span>↓ {u.depth(q.depthKm)}</span>
        </div>
      </div>
      {q.tsunami && <span className="ms" style={{ color: 'var(--violet-text)', fontSize: 20 }}>tsunami</span>}
    </button>
    <FeltButton q={q} fallback={<span className="ms" aria-hidden="true" style={{ color: 'var(--ink2)', fontSize: 20 }}>chevron_right</span>} />
    </div>
  );
}
