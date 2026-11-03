'use client';
// Pull-up filter panel for the Map and Globe tabs, after the polar lights app's map sheet (aurora-monitor MapPanel):
// collapsed it shows the active filters in one line; dragged or tapped open it lists the filters (time range,
// minimum magnitude, region) as rows that open their choice sheets, the map layers as switches, and the legend.
// Drag the top strip to any height and it snaps to collapsed, half or nearly full; a tap on it steps through them.
// Like every selector (components/Sheet.tsx) it closes (collapses) on a swipe down (from the strip, or from the list
// while it is scrolled to the top) and on a double tap away from its controls. `fixed` pins it above the bottom
// navigation for scrolling pages (the Feed) instead of the bottom of a map stage.
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
/** Swipe down this far (px) or this fast (px/ms) from the list to close; two taps this close in time/space = double tap. */
const CLOSE_DISTANCE = 90, CLOSE_SPEED = 0.5, DOUBLE_TAP_MS = 320, DOUBLE_TAP_PX = 30;
const INTERACTIVE = 'button, a, input, select, textarea, label, summary, [role="button"], [role="slider"], [role="switch"]';
/** App bar height on phones: a fixed panel opens at most to just below it. */
const APP_BAR = 56;

export function FilterPanel({ layers, legend, hint, fixed = false }: { layers?: ReactNode; legend?: ReactNode; hint?: ReactNode; fixed?: boolean }) {
  const { t, m, nf } = useT();
  const { plan, setSheet } = useApp();
  const { range, setRange, region, setRegion, minMag, setMinMag, worldReg, setWorldReg, mapList, regions, all } = useQuakeData();
  const locked = !can(plan, 'advancedFilters');
  const [open, setOpen] = useState<null | 'range' | 'mag' | 'region' | 'place'>(null);

  // Height: snapped, or following the finger while dragged.
  const [snap, setSnap] = useState<Snap>('peek');
  const [drag, setDrag] = useState<number | null>(null);
  const [boxH, setBoxH] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (fixed) {
      // Room between the app bar and the panel's bottom edge (the top of the bottom navigation).
      const measure = () => setBoxH(Math.max(0, el.getBoundingClientRect().bottom - APP_BAR));
      measure();
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const box = el.parentElement;
    if (!box) return;
    const ro = new ResizeObserver(() => setBoxH(box.clientHeight));
    ro.observe(box);
    return () => ro.disconnect();
  }, [fixed]);
  const heightOf = (s: Snap) => (s === 'peek' ? PANEL_PEEK : Math.max(PANEL_PEEK, Math.round(boxH * (s === 'half' ? HALF : FULL))));
  const gesture = useRef<{ y: number; h: number; t: number; moved: boolean } | null>(null);
  const onDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('[data-panel-action]')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { y: e.clientY, h: heightOf(snap), t: e.timeStamp, moved: false };
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
    if (!g.moved) { if (!doubleTap(e)) setSnap(NEXT[snap]); return; }
    // Nearest height, nudged by a flick.
    const h = g.h - (e.clientY - g.y), v = (g.y - e.clientY) / Math.max(1, e.timeStamp - g.t);
    const aim = h + v * 220;
    setSnap((['peek', 'half', 'full'] as Snap[]).reduce((a, b) => (Math.abs(heightOf(b) - aim) < Math.abs(heightOf(a) - aim) ? b : a)));
  };

  // Double tap away from the controls closes it (as on the choice sheets).
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const doubleTap = (e: ReactPointerEvent) => {
    const prev = lastTap.current, now = e.timeStamp;
    if (prev && now - prev.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_TAP_PX) {
      lastTap.current = null; setSnap('peek'); return true;
    }
    lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    return false;
  };
  const onBodyTap = (e: ReactPointerEvent) => {
    if ((e.target as Element).closest(INTERACTIVE)) { lastTap.current = null; return; }
    doubleTap(e);
  };

  // Swipe down on the list (while it is scrolled to the top) follows the finger and closes the panel. Touch listeners
  // are added by hand so the downward drag can stop the list scrolling.
  const snapRef = useRef(snap);
  const heightRef = useRef(heightOf);
  useEffect(() => { snapRef.current = snap; heightRef.current = heightOf; });
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    let d: { y: number; t: number; h: number; dy: number; active: boolean } | null = null;
    const down = (e: TouchEvent) => {
      d = el.scrollTop <= 0 && e.touches.length === 1 ? { y: e.touches[0].clientY, t: e.timeStamp, h: heightRef.current(snapRef.current), dy: 0, active: false } : null;
    };
    const move = (e: TouchEvent) => {
      if (!d) return;
      if (!d.active && (e.target as Element).closest('input, textarea, [role="slider"]')) { d = null; return; }
      const dy = e.touches[0].clientY - d.y;
      if (!d.active && (dy < 6 || el.scrollTop > 0)) { if (dy < 0) d = null; return; }
      d.active = true; d.dy = Math.max(0, dy);
      e.preventDefault();
      setDrag(Math.max(PANEL_PEEK, d.h - d.dy));
    };
    const up = (e: TouchEvent) => {
      const g = d; d = null;
      if (!g?.active) return;
      setDrag(null);
      if (g.dy > CLOSE_DISTANCE || g.dy / Math.max(1, e.timeStamp - g.t) > CLOSE_SPEED) setSnap('peek');
    };
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', up);
    el.addEventListener('touchcancel', up);
    return () => {
      el.removeEventListener('touchstart', down); el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', up); el.removeEventListener('touchcancel', up);
    };
  }, []);

  const rangeLabel = t(RANGE_LABEL[range]);
  const magLabel = minMag != null ? `M${nf.format(minMag)}+` : m.all_mags;
  const regLabel = worldReg ? m.wr[worldReg] : m.all_regions;
  const placeLabel = region === 'all' ? m.map.all_places : region;
  const summary = [rangeLabel, minMag != null && magLabel, worldReg && regLabel, region !== 'all' && region].filter(Boolean).join(' · ');
  const shown = mapList.length;
  const filtered = minMag != null || !!worldReg || region !== 'all';
  const pick = (k: 'mag' | 'region') => (locked ? setSheet('paywall') : setOpen(k));

  const h = drag ?? heightOf(snap);
  return (
    <section ref={ref} data-filter-panel="" className={[styles.sheet, fixed && styles.fixed, drag !== null && styles.dragging].filter(Boolean).join(' ')} style={{ height: h }} aria-label={m.map.filters}>
      <div className={styles.grip} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <button type="button" className={styles.handle} aria-expanded={snap !== 'peek'}
          aria-label={snap === 'full' ? m.map.collapse : m.map.expand}
          onClick={e => { if (e.detail === 0) setSnap(NEXT[snap]); /* keyboard; taps go through the strip */ }}>
          <i />
        </button>
        <div className={styles.head}>
          <span className={styles.title}><span className="ms" aria-hidden="true">tune</span>{m.map.filters}</span>
          <span className={styles.count}>{t('count', { n: shown })}</span>
        </div>
        <span className={styles.line}>{summary}</span>
      </div>
      <div ref={bodyRef} className={styles.body} hidden={snap === 'peek' && drag === null} onPointerUp={onBodyTap}>
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
      </div>

      <Sheet open={open === 'range'} onClose={() => setOpen(null)} title={m.map.time_range}>
        <SheetOptions value={range} onPick={r => { setOpen(null); if (r === '1y' && plan === 'free') setSheet('paywall'); else setRange(r); }}
          options={VIEW_RANGES.map(r => ({ value: r, label: t(RANGE_LABEL[r]), meta: r === '1y' && plan === 'free' ? <span className="ms" aria-hidden="true">lock</span> : undefined }))} />
      </Sheet>
      <Sheet open={open === 'place'} onClose={() => setOpen(null)} title={m.map.place}>
        <SheetOptions value={region} onPick={r => { setRegion(r); setOpen(null); }}
          options={[{ value: 'all', label: m.map.all_places, meta: nf.format(all.length) }, ...regions.map(([r, n]) => ({ value: r, label: r, meta: nf.format(n) }))]} />
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
