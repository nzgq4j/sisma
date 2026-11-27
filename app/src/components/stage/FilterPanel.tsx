'use client';
// Pull-up filter panel for the Map and Globe tabs, after the polar lights app's map sheet (aurora-monitor MapPanel):
// collapsed it shows the active filters in one line; dragged or tapped open it lists the filters (time range,
// minimum magnitude, region) as rows that open their choice sheets, the map layers as switches, and the legend.
// Drag the top strip to any height and it snaps to collapsed, half or nearly full; a tap on it steps through them.
// Like every selector (components/Sheet.tsx) it closes (collapses) on a swipe down (from the strip, or from the list
// while it is scrolled to the top) and on a double tap away from its controls. `fixed` pins it above the bottom
// navigation for scrolling pages (the Feed) instead of the bottom of a map stage.
import { useState, type ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { setPendingYearRange } from '@/lib/pending-upgrade';
import { useQuakeData, VIEW_RANGES, RANGE_LABEL } from '@/components/QuakeData';
import { Sheet, SheetOptions } from '@/components/Sheet';
import { can } from '@/lib/entitlements';
import { MagFilterSheet, RegionFilterSheet } from './StageParts';
import { PullPanel } from './PullPanel';
import styles from './panel.module.css';

export { PANEL_PEEK } from './PullPanel';

export function FilterPanel({ layers, legend, hint, fixed = false }: { layers?: ReactNode; legend?: ReactNode; hint?: ReactNode; fixed?: boolean }) {
  const { t, m, nf } = useT();
  const { plan, setSheet } = useApp();
  const { range, setRange, region, setRegion, minMag, setMinMag, worldReg, setWorldReg, mapList, regions, all } = useQuakeData();
  const locked = !can(plan, 'advancedFilters');
  const [open, setOpen] = useState<null | 'range' | 'mag' | 'region' | 'place'>(null);
  const rangeLabel = t(RANGE_LABEL[range]);
  const magLabel = minMag != null ? `M${nf.format(minMag)}+` : m.all_mags;
  const regLabel = worldReg ? m.wr[worldReg] : m.all_regions;
  const placeLabel = region === 'all' ? m.map.all_places : region;
  const summary = [rangeLabel, minMag != null && magLabel, worldReg && regLabel, region !== 'all' && region].filter(Boolean).join(' · ');
  const shown = mapList.length;
  const filtered = minMag != null || !!worldReg || region !== 'all';
  const pick = (k: 'mag' | 'region') => (locked ? setSheet('paywall') : setOpen(k));

  return (
    <PullPanel fixed={fixed} label={m.map.filters} icon="tune" title={m.map.filters} count={t('count', { n: shown })} line={summary}
      expand={m.map.expand} collapse={m.map.collapse} outside={<>
      <Sheet open={open === 'range'} onClose={() => setOpen(null)} title={m.map.time_range}>
        <SheetOptions value={range} onPick={r => { setOpen(null); if (r === '1y' && plan === 'free') { setPendingYearRange(); setSheet('paywall'); } else setRange(r); }}
          options={VIEW_RANGES.map(r => ({ value: r, label: t(RANGE_LABEL[r]), meta: r === '1y' && plan === 'free' ? <span className="ms" aria-hidden="true">lock</span> : undefined }))} />
      </Sheet>
      <Sheet open={open === 'place'} onClose={() => setOpen(null)} title={m.map.place}>
        <SheetOptions value={region} onPick={r => { setRegion(r); setOpen(null); }}
          options={[{ value: 'all', label: m.map.all_places, meta: nf.format(all.length) }, ...regions.map(([r, n]) => ({ value: r, label: r, meta: nf.format(n) }))]} />
      </Sheet>
      <MagFilterSheet open={open === 'mag'} onClose={() => setOpen(null)} />
      <RegionFilterSheet open={open === 'region'} onClose={() => setOpen(null)} />
      </>}>
        <div className={styles.section}>
          <span className={styles.label}>{m.map.filters}</span>
          <div className={styles.rows}>
            <Row icon="schedule" label={m.map.time_range} value={rangeLabel} onClick={() => setOpen('range')} />
            <Row icon="filter_alt" label={t('mag_chip')} value={magLabel} locked={locked} active={minMag != null} onClick={() => pick('mag')} />
            <Row icon="public" label={t('region_chip')} value={regLabel} locked={locked} active={!!worldReg} onClick={() => pick('region')} />
            <Row icon="location_on" label={m.map.place} value={placeLabel} active={region !== 'all'} onClick={() => setOpen('place')} />
          </div>
          {filtered && (
            <button type="button" className={styles.clearAll} onClick={() => { setMinMag(null); setWorldReg(null); setRegion('all'); }}>
              {m.map.clear_filters}
            </button>
          )}
        </div>
        {layers && (
          <div className={styles.section}>
            <span className={styles.label}>{m.map.layers}</span>
            <div className={styles.rows}>{layers}</div>
          </div>
        )}
        {legend && (
          <div className={styles.section}>
            <span className={styles.label}>{m.map.legend}</span>
            {legend}
          </div>
        )}
        {hint && <div className={styles.hint}>{hint}</div>}
    </PullPanel>
  );
}

function Row({ icon, label, value, onClick, locked, active }: { icon: string; label: string; value: string; onClick: () => void; locked?: boolean; active?: boolean }) {
  return (
    <button type="button" className={styles.row} onClick={onClick} aria-haspopup="dialog" data-active={active ? '' : undefined}>
      <span className="ms" aria-hidden="true">{icon}</span>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
      <span className="ms" aria-hidden="true">{locked ? 'lock' : 'chevron_right'}</span>
    </button>
  );
}

/** A layer switch row inside the panel. */
export function LayerToggle({ on, onChange, icon, label }: { on: boolean; onChange: (v: boolean) => void; icon: string; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={styles.row} onClick={() => onChange(!on)}>
      <span className="ms" aria-hidden="true">{icon}</span>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.switch} aria-hidden="true"><i /></span>
    </button>
  );
}
