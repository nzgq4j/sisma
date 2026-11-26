'use client';
// Bottom sheet for every selector and detail pop-up. Behaviour matches the polar lights app (aurora-monitor
// BottomSheet): closes on a tap outside, a swipe down (from anywhere on it while its content is scrolled to the
// top), a double tap on it away from its controls, or Escape. The page behind doesn't scroll while it's open.
// Rendered at the end of <body> so a clipped or positioned parent (map stage) can't hide it.
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './sheet.module.css';

/** How far (px) a downward swipe must go, or how fast (px/ms), to close the sheet. */
const CLOSE_DISTANCE = 90;
const CLOSE_SPEED = 0.5;
/** Two taps within this long (ms) and this close (px) count as a double tap. */
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 30;
/** Taps on these are their own actions, never half of a double tap that closes the sheet. */
const INTERACTIVE = 'button, a, input, select, textarea, label, summary, [role="button"], [role="slider"], [role="checkbox"]';

let locks = 0, savedY = 0;
function lockPage() {
  if (locks++ > 0) return;
  savedY = window.scrollY;
  Object.assign(document.body.style, { position: 'fixed', top: `-${savedY}px`, left: '0', right: '0', overflow: 'hidden' });
}
function unlockPage() {
  if (--locks > 0) return;
  Object.assign(document.body.style, { position: '', top: '', left: '', right: '', overflow: '' });
  window.scrollTo(0, savedY);
}

interface SheetProps {
  open: boolean; onClose: () => void; children: ReactNode;
  /** Visible heading; also names the dialog. */
  title?: string;
  /** Names the dialog when there is no visible title. */
  label?: string;
  /** Extra class on the wrapper, e.g. to pin the website's light palette. */
  className?: string;
}

export function Sheet({ open, ...rest }: SheetProps) {
  return open ? <SheetPanel {...rest} /> : null;
}

function SheetPanel({ onClose, children, title, label, className }: Omit<SheetProps, 'open'>) {
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [closing, setClosing] = useState(false);
  const drag = useRef<{ y: number; t: number; dy: number; active: boolean } | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => prev?.focus?.();
  }, []);
  useEffect(() => { lockPage(); return unlockPage; }, []);

  // Keep the sheet in the part of the screen the keyboard leaves visible. On iPhone and iPad the on-screen keyboard
  // covers fixed content without resizing the page, so a search field and its results would end up behind it.
  useEffect(() => {
    const vv = window.visualViewport, el = wrap.current;
    if (!vv || !el) return;
    let frame = 0;
    const fit = () => {
      frame = 0;
      // Zoomed in: the visible area is smaller on purpose; leave the sheet on the whole screen.
      const covered = vv.scale <= 1.01 && window.innerHeight - vv.height > 1;
      Object.assign(el.style, covered ? { top: `${vv.offsetTop}px`, bottom: 'auto', height: `${vv.height}px` } : { top: '', bottom: '', height: '' });
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(fit); };
    vv.addEventListener('resize', queue);
    vv.addEventListener('scroll', queue);
    queue();
    return () => { vv.removeEventListener('resize', queue); vv.removeEventListener('scroll', queue); if (frame) cancelAnimationFrame(frame); };
  }, []);

  // Slide down, then close (a swipe or a double tap).
  const dismiss = () => { setClosing(true); setTimeout(() => closeRef.current(), 180); };
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const tap = (e: PointerEvent) => {
    if ((e.target as Element).closest(INTERACTIVE) || drag.current?.active) { lastTap.current = null; return; }
    const prev = lastTap.current, now = e.timeStamp;
    if (prev && now - prev.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_TAP_PX) {
      lastTap.current = null;
      dismiss();
    } else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
  };

  // Swipe down to close. Touch listeners are added by hand so a downward drag can stop the page scrolling.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const down = (e: TouchEvent) => {
      drag.current = el.scrollTop <= 0 && e.touches.length === 1 ? { y: e.touches[0].clientY, t: e.timeStamp, dy: 0, active: false } : null;
    };
    const move = (e: TouchEvent) => {
      const d = drag.current;
      if (!d) return;
      // Sliders and text areas keep their own gestures.
      if (!d.active && (e.target as Element).closest('input, textarea, [role="slider"]')) { drag.current = null; return; }
      const dy = e.touches[0].clientY - d.y;
      // Upward or barely moving: leave it to scrolling and taps.
      if (!d.active && (dy < 6 || el.scrollTop > 0)) { if (dy < 0) drag.current = null; return; }
      d.active = true;
      d.dy = Math.max(0, dy);
      e.preventDefault();
      setOffset(d.dy);
    };
    const up = (e: TouchEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d?.active) return;
      const speed = d.dy / Math.max(1, e.timeStamp - d.t);
      if (d.dy > CLOSE_DISTANCE || speed > CLOSE_SPEED) { setClosing(true); setTimeout(() => closeRef.current(), 180); }
      else setOffset(0);
    };
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', up);
    el.addEventListener('touchcancel', up);
    return () => {
      el.removeEventListener('touchstart', down);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', up);
      el.removeEventListener('touchcancel', up);
    };
  }, []);

  const dragging = offset > 0 && !closing;
  return createPortal(
    <div ref={wrap} className={`${styles.wrap} ${className ?? ''}`}>
      {/* Closes when the finger lifts as well as on click, so a tap outside always closes it. */}
      <button type="button" className={styles.backdrop} aria-label={title ?? label} tabIndex={-1} onClick={onClose}
        onPointerUp={e => { if (e.pointerType !== 'mouse') onClose(); }}
        style={{ opacity: closing ? 0 : 1 - Math.min(0.6, offset / 500) }} />
      <div ref={panel} className={styles.panel + (dragging ? ' ' + styles.dragging : '')} role="dialog" aria-modal="true"
        aria-label={title ?? label} tabIndex={-1} onPointerUp={tap}
        style={{ transform: closing ? 'translateY(100%)' : offset ? `translateY(${offset}px)` : undefined }}>
        <span className={styles.handle} aria-hidden="true" />
        {title && <h2 className={styles.title}>{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** A list of choices in a sheet, like the polar lights language list: label, optional leading/trailing, check on the current one. */
/** A list of choices. Single choice: `value`. Several: `values` (each row toggles; the sheet stays open). */
export function SheetOptions<T extends string>({ options, value, values, onPick }: {
  options: { value: T; label: ReactNode; lead?: ReactNode; meta?: ReactNode; lang?: string }[]; value?: T; values?: T[]; onPick: (v: T) => void;
}) {
  const on = (v: T) => (values ? values.includes(v) : v === value);
  return (
    <div className={styles.rows}>
      {options.map(o => (
        <button key={o.value} type="button" className={styles.row} lang={o.lang} aria-pressed={on(o.value)} onClick={() => onPick(o.value)}>
          {o.lead}
          <span className={styles.rowLabel}>{o.label}</span>
          {o.meta != null && <span className={styles.rowMeta}>{o.meta}</span>}
          {on(o.value) && <span className={`ms ${styles.check}`} aria-hidden="true">check</span>}
        </button>
      ))}
    </div>
  );
}
