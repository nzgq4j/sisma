'use client';
// The app's pull-up card (Map, Globe, Feed filters; Science → Pacific Fire Ribbon controls), after the polar lights
// app's map sheet: collapsed it shows a title, a count and a one-line summary; dragged or tapped open it shows its
// content. Drag the top strip to any height and it snaps to collapsed, half or nearly full; a tap on it steps through
// them. Like every selector (components/Sheet.tsx) it closes (collapses) on a swipe down (from the strip, or from the
// content while it is scrolled to the top) and on a double tap away from its controls. `fixed` pins it above the bottom
// navigation for scrolling pages instead of the bottom of a map stage. The snap can be controlled by the parent.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import styles from './panel.module.css';

export type Snap = 'peek' | 'half' | 'full';
/** Collapsed height in px; half and full are shares of the stage height. */
export const PANEL_PEEK = 84;
const HALF = 0.5, FULL = 0.88;
const NEXT: Record<Snap, Snap> = { peek: 'half', half: 'full', full: 'peek' };
/** Swipe down this far (px) or this fast (px/ms) from the list to close; two taps this close in time/space = double tap. */
const CLOSE_DISTANCE = 90, CLOSE_SPEED = 0.5, DOUBLE_TAP_MS = 320, DOUBLE_TAP_PX = 30;
const INTERACTIVE = 'button, a, input, select, textarea, label, summary, [role="button"], [role="slider"], [role="switch"]';
/** App bar height on phones: a fixed panel opens at most to just below it. */
const APP_BAR = 56;

export function PullPanel({ fixed = false, className, label, icon, title, count, line, expand, collapse, children, outside, snap: snapIn, onSnap }: {
  fixed?: boolean; className?: string;
  /** Accessible name of the card. */
  label: string; icon: string; title: string; count?: ReactNode; line: ReactNode;
  /** Labels of the handle (for keyboards and screen readers). */
  expand: string; collapse: string;
  /** The content shown when open. */
  children: ReactNode;
  /** Nodes kept mounted while collapsed (choice sheets opened from the content). */
  outside?: ReactNode;
  snap?: Snap; onSnap?: (s: Snap) => void;
}) {
  // Height: snapped, or following the finger while dragged.
  const [own, setOwn] = useState<Snap>('peek');
  const snap = snapIn ?? own;
  const setSnap = (s: Snap) => (onSnap ? onSnap(s) : setOwn(s));
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
  const setSnapRef = useRef(setSnap);
  useEffect(() => { snapRef.current = snap; heightRef.current = heightOf; setSnapRef.current = setSnap; });
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
      if (g.dy > CLOSE_DISTANCE || g.dy / Math.max(1, e.timeStamp - g.t) > CLOSE_SPEED) setSnapRef.current('peek');
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

  const h = drag ?? heightOf(snap);
  return (
    <section ref={ref} data-filter-panel="" className={[styles.sheet, fixed && styles.fixed, className, drag !== null && styles.dragging].filter(Boolean).join(' ')} style={{ height: h }} aria-label={label}>
      <div className={styles.grip} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <button type="button" className={styles.handle} aria-expanded={snap !== 'peek'}
          aria-label={snap === 'full' ? collapse : expand}
          onClick={e => { if (e.detail === 0) setSnap(NEXT[snap]); /* keyboard; taps go through the strip */ }}>
          <i />
        </button>
        <div className={styles.head}>
          <span className={styles.title}><span className="ms" aria-hidden="true">{icon}</span>{title}</span>
          {count !== undefined && <span className={styles.count}>{count}</span>}
        </div>
        <span className={styles.line}>{line}</span>
      </div>
      <div ref={bodyRef} className={styles.body} hidden={snap === 'peek' && drag === null} onPointerUp={onBodyTap}>
        {children}
      </div>
      {outside}
    </section>
  );
}
