'use client';
// Pull-up filter panel for the Map and Globe tabs, after the polar lights app's map sheet (aurora-monitor MapPanel):
// collapsed it shows the active filters in one line; dragged or tapped open it lists the filters (time range,
// minimum magnitude, region) as rows that open their choice sheets, the map layers as switches, and the legend.
// Drag the top strip to any height and it snaps to collapsed, half or nearly full; a tap on it steps through them.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData, VIEW_RANGES, RANGE_LABEL } from '@/components/QuakeData';
import { Sheet, SheetOptions } from '@/components/Sheet';
import { can } from '@/lib/entitlements';
import { MagFilterSheet, RegionFilterSheet } from './StageParts';
import styles from './panel.module.css';

type Snap = 'peek' | 'half' | 'full';
/** Collapsed height in px; half and full are shares of the stage height. */
export const PANEL_PEEK = 84;
const HALF = 0.5, FULL = 0.88;
const NEXT: Record<Snap, Snap> = { peek: 'half', half: 'full', full: 'peek' };

export function FilterPanel({ layers, legend, hint }: { layers: ReactNode; legend: ReactNode; hint?: ReactNode }) {
  const { t, m, nf } = useT();
  const { plan, setSheet } = useApp();
  const { range, setRange, region, setRegion, minMag, setMinMag, worldReg, setWorldReg, mapList } = useQuakeData();
  const locked = !can(plan, 'advancedFilters');
  const [open, setOpen] = useState<null | 'range' | 'mag' | 'region'>(null);

  // Height: snapped, or following the finger while dragged.
  const [snap, setSnap] = useState<Snap>('peek');
  const [drag, setDrag] = useState<number | null>(null);
  const [boxH, setBoxH] = useState(0);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const box = ref.current?.parentElement;
    if (!box) return;
    const ro = new ResizeObserver(() => setBoxH(box.clientHeight));
    ro.observe(box);
    return () => ro.disconnect();
  }, []);
  const heightOf = (s: Snap) => (s === 'peek' ? PANEL_PEEK : Math.max(PANEL_PEEK, Math.round(boxH * (s === 'half' ? HALF : FULL))));
  const gesture = useRef<{ y: number; h: number; t: number; moved: boolean } | null>(null);
  const onDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('[data-panel-action]')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { y: e.clientY, h: heightOf(snap), t: performance.now(), moved: false };
  };
  const onMove = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dy = e.clientY - g.y;
    if (Math.abs(dy) > 5) g.moved = true;
    if (g.moved) setDrag(Math.max(PANEL_PEEK, Math.min(heightOf('full'), g.h - dy)));
  };
  const onUp = (e: ReactPointerEvent) => {
    const g = gesture.current;
    gesture.current = null;
    setDrag(null);
    if (!g) return;
    if (!g.moved) { setSnap(NEXT[snap]); return; }
    // Nearest height, nudged by a flick.
    const h = g.h - (e.clientY - g.y), v = (g.y - e.clientY) / Math.max(1, performance.now() - g.t);
    const aim = h + v * 220;
    setSnap((['peek', 'half', 'full'] as Snap[]).reduce((a, b) => (Math.abs(heightOf(b) - aim) < Math.abs(heightOf(a) - aim) ? b : a)));
  };

  const rangeLabel = t(RANGE_LABEL[range]);
  const magLabel = minMag != null ? `M${nf.format(minMag)}+` : m.all_mags;
  const regLabel = worldReg ? m.wr[worldReg] : m.all_regions;
  const summary = [rangeLabel, minMag != null && magLabel, worldReg && regLabel, region !== 'all' && region].filter(Boolean).join(' · ');
  const filtered = minMag != null || !!worldReg || region !== 'all';
  const pick = (k: 'mag' | 'region') => (locked ? setSheet('paywall') : setOpen(k));

  const h = drag ?? heightOf(snap);
  return (
    <section ref={ref} data-filter-panel="" className={styles.sheet + (drag !== null ? ' ' + styles.dragging : '')} style={{ height: h }} aria-label={m.map.filters}>
      <div className={styles.grip} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <button type="button" className={styles.handle} aria-expanded={snap !== 'peek'}
          aria-label={snap === 'full' ? m.map.collapse : m.map.expand}
          onClick={e => { if (e.detail === 0) setSnap(NEXT[snap]); /* keyboard; taps go through the strip */ }}>
          <i />
        </button>
        <div className={styles.head}>
          <span className={styles.title}><span className="ms" aria-hidden="true">tune</span>{m.map.filters}</span>
          <span className={styles.count}>{t('count', { n: mapList.length })}</span>
        </div>
        <span className={styles.line}>{summary}</span>
      </div>
      <div className={styles.body} hidden={snap === 'peek' && drag === null}>
        <div className={styles.section}>
          <span className={styles.label}>{m.map.filters}</span>
          <div className={styles.rows}>
            <Row icon="schedule" label={m.map.time_range} value={rangeLabel} onClick={() => setOpen('range')} />
            <Row icon="filter_alt" label={t('mag_chip')} value={magLabel} locked={locked} active={minMag != null} onClick={() => pick('mag')} />
            <Row icon="public" label={t('region_chip')} value={regLabel} locked={locked} active={!!worldReg} onClick={() => pick('region')} />
            {region !== 'all' && (
              <div className={styles.row} data-active="">
                <span className="ms" aria-hidden="true">location_on</span>
                <span className={styles.rowLabel}>{region}</span>
                <button type="button" className={styles.clearOne} onClick={() => setRegion('all')} aria-label={`${region} — ${m.all_regions}`}>
                  <span className="ms" aria-hidden="true">close</span>
                </button>
              </div>
            )}
          </div>
          {filtered && (
            <button type="button" className={styles.clearAll} onClick={() => { setMinMag(null); setWorldReg(null); setRegion('all'); }}>
              {m.map.clear_filters}
            </button>
          )}
        </div>
        <div className={styles.section}>
          <span className={styles.label}>{m.map.layers}</span>
          <div className={styles.rows}>{layers}</div>
        </div>
        <div className={styles.section}>
          <span className={styles.label}>{m.map.legend}</span>
          {legend}
        </div>
        {hint && <div className={styles.hint}>{hint}</div>}
      </div>

      <Sheet open={open === 'range'} onClose={() => setOpen(null)} title={m.map.time_range}>
        <SheetOptions value={range} onPick={r => { setOpen(null); if (r === '1y' && plan === 'free') setSheet('paywall'); else setRange(r); }}
          options={VIEW_RANGES.map(r => ({ value: r, label: t(RANGE_LABEL[r]), meta: r === '1y' && plan === 'free' ? <span className="ms" aria-hidden="true">lock</span> : undefined }))} />
      </Sheet>
      <MagFilterSheet open={open === 'mag'} onClose={() => setOpen(null)} />
      <RegionFilterSheet open={open === 'region'} onClose={() => setOpen(null)} />
    </section>
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
