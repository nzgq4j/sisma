'use client';
// Overlay pieces shared by the Map and Globe tabs.
import Link from 'next/link';
import { useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData, VIEW_RANGES, RANGE_LABEL, type Row } from '@/components/QuakeData';
import { QuakeDetail, QuakeSummary } from '@/components/QuakeDetail';
import { Sheet, SheetOptions } from '@/components/Sheet';
import { can } from '@/lib/entitlements';
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

const MAG_STEPS = [2.5, 3, 4, 5, 6, 7];

/** Minimum-magnitude filter for the maps (sisma+). Free users see a lock that opens the paywall. */
export function MagFilterChip() {
  const { t, m, nf } = useT();
  const { plan, setSheet } = useApp();
  const { minMag, setMinMag, list } = useQuakeData();
  const [open, setOpen] = useState(false);
  const locked = !can(plan, 'advancedFilters');
  const label = minMag != null ? `M${nf.format(minMag)}+` : t('mag_chip');
  return (
    <>
      <button type="button" className={styles.chip} aria-pressed={minMag != null} aria-haspopup="dialog"
        aria-label={`${t('min_mag')}: ${minMag != null ? label : m.all_mags}`} onClick={() => (locked ? setSheet('paywall') : setOpen(true))}>
        <span className="ms" aria-hidden="true">filter_alt</span>{label}
        {locked && <span className="ms" aria-hidden="true">lock</span>}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('min_mag')}>
        <SheetOptions value={minMag == null ? 'all' : String(minMag)} onPick={v => { setMinMag(v === 'all' ? null : Number(v)); setOpen(false); }}
          options={[
            { value: 'all', label: m.all_mags, meta: nf.format(list.length) },
            ...MAG_STEPS.map(s => ({ value: String(s), label: `M${nf.format(s)}+`, meta: nf.format(list.filter(q => q.mag >= s).length) })),
          ]} />
      </Sheet>
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
export function Selection({ q, open, setOpen, onClear, onShowRegion }: { q: Row; open: boolean; setOpen: (v: boolean) => void; onClear: () => void; onShowRegion?: () => void }) {
  const desktop = useDesktop();
  return (
    <>
      <aside className={desktop ? styles.panel : styles.selCard} aria-live="polite">
        <QuakeSummary q={q} onClose={desktop ? onClear : undefined} onDetails={() => setOpen(true)} />
      </aside>
      <Sheet open={open} onClose={() => setOpen(false)} label={q.region}>
        <QuakeDetail q={q} onClose={() => setOpen(false)} onShowRegion={onShowRegion && (() => { setOpen(false); onShowRegion(); })} />
      </Sheet>
    </>
  );
}
