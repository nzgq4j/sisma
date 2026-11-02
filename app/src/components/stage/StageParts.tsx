'use client';
// Overlay pieces shared by the Map and Globe tabs.
import Link from 'next/link';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData, VIEW_RANGES, RANGE_LABEL, type Row } from '@/components/QuakeData';
import { MagBadge } from '@/components/MagBadge';
import { QuakeDetail } from '@/components/QuakeDetail';
import { FeltButton } from '@/components/FeltReport';
import { Sheet } from '@/components/Sheet';
import { timeAgo } from '@/components/QuakeRow';
import { useDesktop } from '@/components/dash/useDesktop';
import { MAG_SCALE } from '@/lib/theme';
import styles from './stage.module.css';

/** Time range chips (1 year is sisma+ only) and, when a region filter is active, a chip to clear it. */
export function RangeChips() {
  const { t } = useT();
  const { plan } = useApp();
  const { range, setRange, region, setRegion } = useQuakeData();
  return (
    <>
      {VIEW_RANGES.map(r => (r === '1y' && plan === 'free'
        ? <Link key={r} href="/app/me" className={styles.chip}>{t(RANGE_LABEL[r])}<span className="ms" aria-hidden="true">lock</span></Link>
        : <button key={r} type="button" className={styles.chip} aria-pressed={range === r} onClick={() => setRange(r)}>{t(RANGE_LABEL[r])}</button>))}
      {region !== 'all' && (
        <button type="button" className={styles.chip} aria-pressed onClick={() => setRegion('all')} aria-label={`${region} — ${t('all_regions')}`}>
          <span className="ms" aria-hidden="true">location_on</span>{region}<span className="ms" aria-hidden="true">close</span>
        </button>
      )}
    </>
  );
}

export function ToggleChip({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: string; label: string }) {
  return <button type="button" className={styles.chip} aria-pressed={on} onClick={onClick}><span className="ms" aria-hidden="true">{icon}</span>{label}</button>;
}

const MAG_LEGEND = [...MAG_SCALE].reverse().map(([min, fill], i) => ({ c: fill, l: i === 0 ? '<3' : min === 7 ? '7+' : String(min) }));
const DEPTH_LEGEND = [{ c: '#2CCB9A', l: '0–70 km' }, { c: '#7B61FF', l: '70–300' }, { c: '#B5179E', l: '300+' }];

export function Legend({ depth = false }: { depth?: boolean }) {
  const { t } = useT();
  return (
    <div className={styles.legend} aria-label={depth ? t('depth') : t('magnitude')}>
      {(depth ? DEPTH_LEGEND : MAG_LEGEND).map(x => <span key={x.l}><i style={{ background: x.c }} />{x.l}</span>)}
    </div>
  );
}

/** The selected quake: bottom card + detail sheet on phones, floating detail panel on desktop. */
export function Selection({ q, open, setOpen, onClear }: { q: Row; open: boolean; setOpen: (v: boolean) => void; onClear: () => void }) {
  const { t, m, nf } = useT();
  const desktop = useDesktop();
  if (desktop) return <aside className={styles.panel} aria-live="polite"><QuakeDetail q={q} onClose={onClear} /></aside>;
  return (
    <>
      <div className={styles.selCard}>
        <MagBadge mag={q.mag} size={52} />
        <div className={styles.selText}>
          <strong>{q.region}</strong>
          <span>{timeAgo(t as never, q.time)}{q.distanceKm != null ? ` · ${nf.format(Math.round(q.distanceKm))} km` : ''} · ↓ {nf.format(Math.round(q.depthKm))} km</span>
        </div>
        <FeltButton q={q} />
        <button type="button" className={styles.selBtn} onClick={() => setOpen(true)} aria-label={m.dash.details}>
          <span className="ms" aria-hidden="true">info</span>
        </button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)}><QuakeDetail q={q} onClose={() => setOpen(false)} /></Sheet>
    </>
  );
}
