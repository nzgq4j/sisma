'use client';
// Overlay pieces shared by the Map and Globe tabs.
import { useState } from 'react';
import { useCardGestures } from './useCardGestures';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData, type Row } from '@/components/QuakeData';
import { QuakeDetail, QuakeSummary } from '@/components/QuakeDetail';
import { Sheet, SheetOptions } from '@/components/Sheet';
import { can } from '@/lib/entitlements';
import { useDesktop } from '@/components/dash/useDesktop';
import { MAG_SCALE } from '@/lib/theme';
import { useUnits } from '@/components/Units';
import { useMarkerStyle } from '@/components/MarkerStyle';
import { dotRadius } from '@/lib/pin';
import styles from './stage.module.css';

export const MAG_STEPS = [2.5, 3, 4, 5, 6, 7];

/** Minimum-magnitude filter for the maps (sisma+). Free users see a lock that opens the paywall. */
export function MagFilterChip() {
  const { t, m, nf } = useT();
  const { plan, setSheet } = useApp();
  const { minMag } = useQuakeData();
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
      <MagFilterSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** World-region filter (sisma+), shared by the Feed, Map, Globe and dashboard. Free users see a lock that opens the
 *  paywall. `chipStyle` lets the Feed use its own chip look. */
export function RegionFilterChip({ chipStyle }: { chipStyle?: (on: boolean) => React.CSSProperties }) {
  const { t, m } = useT();
  const { plan, setSheet } = useApp();
  const { worldReg } = useQuakeData();
  const [open, setOpen] = useState(false);
  const locked = !can(plan, 'advancedFilters');
  const label = worldReg ? m.wr[worldReg] : t('region_chip');
  return (
    <>
      <button type="button" className={chipStyle ? undefined : styles.chip} style={chipStyle?.(!!worldReg)} aria-pressed={!!worldReg} aria-haspopup="dialog"
        aria-label={`${t('region_chip')}: ${worldReg ? label : m.all_regions}`} onClick={() => (locked ? setSheet('paywall') : setOpen(true))}>
        <span className="ms" aria-hidden="true" style={chipStyle ? { fontSize: 17 } : undefined}>public</span>{label}
        {locked && <span className="ms" aria-hidden="true" style={chipStyle ? { fontSize: 15 } : undefined}>lock</span>}
      </button>
      <RegionFilterSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Minimum-magnitude choices with event counts (used by the chip and the map filter panel). */
export function MagFilterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, m, nf } = useT();
  const { minMag, setMinMag, list } = useQuakeData();
  return (
    <Sheet open={open} onClose={onClose} title={t('min_mag')}>
      <SheetOptions value={minMag == null ? 'all' : String(minMag)} onPick={v => { setMinMag(v === 'all' ? null : Number(v)); onClose(); }}
        options={[
          { value: 'all', label: m.all_mags, meta: nf.format(list.length) },
          ...MAG_STEPS.map(s => ({ value: String(s), label: `M${nf.format(s)}+`, meta: nf.format(list.filter(q => q.mag >= s).length) })),
        ]} />
    </Sheet>
  );
}

/** World-region choices with event counts (used by the chip and the map filter panel). */
export function RegionFilterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, m, nf } = useT();
  const { worldReg, setWorldReg, worldCounts, all } = useQuakeData();
  return (
    <Sheet open={open} onClose={onClose} title={t('region_chip')}>
      <SheetOptions value={worldReg ?? 'all'} onPick={v => { setWorldReg(v === 'all' ? null : (v as typeof worldCounts[number][0])); onClose(); }}
        options={[
          { value: 'all', label: m.all_regions, meta: nf.format(all.length) },
          ...worldCounts.map(([r, n]) => ({ value: r, label: m.wr[r], meta: nf.format(n) })),
        ]} />
    </Sheet>
  );
}

// Marker colours follow light/dark mode (--mag-N, index into MAG_SCALE), so the legend matches the map. With circle
// markers (Me → Map markers) each swatch is drawn at the size that band's circles have on the map.
const MAG_LEGEND = [...MAG_SCALE].reverse().map(([min], i) => ({ c: `var(--mag-${MAG_SCALE.length - 1 - i})`, l: i === 0 ? '<3' : min === 7 ? '7+' : String(min), mag: i === 0 ? 2.5 : min }));
// Depth bands 0–70, 70–300 and 300+ km (shallow / intermediate / deep), labelled in the chosen units.
const DEPTH_LEGEND = { km: ['0–70 km', '70–300', '300+'], mi: ['0–43 mi', '43–186', '186+'] };
const DEPTH_COLORS = ['#2CCB9A', '#7B61FF', '#B5179E'];

export function Legend({ depth = false, plain = false }: { depth?: boolean; plain?: boolean }) {
  const units = useUnits();
  const style = useMarkerStyle();
  const { t } = useT();
  const sized = style === 'circles' && !depth;
  return (
    <div className={plain ? `${styles.legend} ${styles.legendPlain}` : styles.legend} aria-label={depth ? t('depth') : t('magnitude')}>
      {depth
        ? DEPTH_LEGEND[units].map((l, i) => <span key={l}><i style={{ background: DEPTH_COLORS[i] }} />{l}</span>)
        : MAG_LEGEND.map(x => {
          const d = sized ? Math.round(dotRadius(x.mag) * 2) : 10;
          return <span key={x.l}><i style={{ background: x.c, width: d, height: d, borderRadius: d / 2 }} />{x.l}</span>;
        })}
    </div>
  );
}

/** The selected quake: bottom card + detail sheet on phones, floating detail panel on desktop. */
export function Selection({ q, open, setOpen, onClear, onShowRegion }: { q: Row; open: boolean; setOpen: (v: boolean) => void; onClear: () => void; onShowRegion?: () => void }) {
  const desktop = useDesktop();
  // Swipe up opens Details; swipe down or double tap (away from buttons) closes the card.
  const g = useCardGestures({ onUp: () => setOpen(true), onDown: onClear });
  return (
    <>
      <aside className={desktop ? styles.panel : styles.selCard} aria-live="polite" style={g.style} {...g.handlers}>
        {!desktop && <span className={styles.grab} aria-hidden="true" />}
        <QuakeSummary q={q} onClose={desktop ? onClear : undefined} onDetails={() => setOpen(true)} />
      </aside>
      <Sheet open={open} onClose={() => setOpen(false)} label={q.region}>
        <QuakeDetail q={q} onClose={() => setOpen(false)} onShowRegion={onShowRegion && (() => { setOpen(false); onShowRegion(); })} />
      </Sheet>
    </>
  );
}
