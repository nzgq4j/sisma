'use client';
// Pull down at the top of a scrolling page to refresh (Feed list). A round indicator follows the finger under the
// app bar, its arrow turning as the pull grows; past the threshold it says "Release to refresh", then spins while
// `onRefresh` runs and briefly confirms ("Updated" or a failure note). The browser's own pull-to-reload is switched
// off while this is mounted so the two don't both fire. Touch only; nothing changes for mouse users.
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import styles from './ptr.module.css';

/** Finger travel (px) is halved; the indicator stops at MAX and a pull past THRESHOLD refreshes on release. */
const THRESHOLD = 72, MAX = 120, RESIST = 0.5, MIN_SPIN_MS = 600, DONE_MS = 1400;
/** Pulls that start on these keep their own gestures. */
const IGNORE = '[role="dialog"], [data-filter-panel], input, textarea, [role="slider"]';

type Phase = 'idle' | 'pulling' | 'refreshing' | 'done' | 'failed';

export function PullToRefresh({ onRefresh }: { onRefresh: () => Promise<boolean> }) {
  const { m } = useT();
  const p = m.ptr;
  const [pull, setPull] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const refreshRef = useRef(onRefresh);
  useEffect(() => { refreshRef.current = onRefresh; phaseRef.current = phase; });

  // No browser pull-to-reload on this page (Android Chrome) while our own gesture is active.
  useEffect(() => {
    const el = document.documentElement, prev = el.style.overscrollBehaviorY;
    el.style.overscrollBehaviorY = 'contain';
    return () => { el.style.overscrollBehaviorY = prev; };
  }, []);

  useEffect(() => {
    let start: { y: number; x: number } | null = null, dist = 0, active = false;
    const down = (e: TouchEvent) => {
      start = null; active = false; dist = 0;
      if (e.touches.length !== 1 || window.scrollY > 0 || phaseRef.current === 'refreshing') return;
      if ((e.target as Element).closest(IGNORE)) return;
      start = { y: e.touches[0].clientY, x: e.touches[0].clientX };
    };
    const move = (e: TouchEvent) => {
      if (!start) return;
      const dy = e.touches[0].clientY - start.y, dx = e.touches[0].clientX - start.x;
      if (!active) {
        // Upward, sideways or the page has scrolled: leave it to normal scrolling.
        if (dy < 6 || Math.abs(dx) > dy || window.scrollY > 0) { if (dy < 0 || Math.abs(dx) > 10) start = null; return; }
        active = true; setPhase('pulling');
      }
      e.preventDefault();
      dist = Math.min(MAX, Math.max(0, dy * RESIST));
      setPull(dist);
    };
    const up = () => {
      if (!active) { start = null; return; }
      start = null; active = false;
      if (dist < THRESHOLD) { setPull(0); setPhase('idle'); return; }
      setPull(THRESHOLD); setPhase('refreshing');
      const t0 = performance.now();
      void refreshRef.current().then(ok => {
        // Keep the spinner up long enough to be seen, then confirm and tuck the indicator away.
        setTimeout(() => {
          setPhase(ok ? 'done' : 'failed');
          setTimeout(() => { setPull(0); setPhase('idle'); }, ok ? DONE_MS : DONE_MS * 2);
        }, Math.max(0, MIN_SPIN_MS - (performance.now() - t0)));
      });
    };
    document.addEventListener('touchstart', down, { passive: true });
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', up);
    document.addEventListener('touchcancel', up);
    return () => {
      document.removeEventListener('touchstart', down); document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', up); document.removeEventListener('touchcancel', up);
    };
  }, []);

  const ready = phase === 'pulling' && pull >= THRESHOLD;
  const label = phase === 'refreshing' ? p.refreshing : phase === 'done' ? p.updated : phase === 'failed' ? p.failed : ready ? p.release : p.pull;
  const shown = phase !== 'idle' || pull > 0;
  return (
    <div className={styles.wrap} style={{ height: pull }} aria-hidden={!shown} data-dragging={phase === 'pulling' ? '' : undefined}>
      <div className={styles.inner} data-phase={phase} style={{ opacity: Math.min(1, pull / 40) }}>
        <span className={styles.badge}>
          <span className={`ms ${styles.icon}`} aria-hidden="true"
            style={phase === 'pulling' && !ready ? { transform: `rotate(${Math.round((pull / THRESHOLD) * 270)}deg)` } : undefined}>
            {phase === 'done' ? 'check' : phase === 'failed' ? 'error' : ready ? 'arrow_upward' : 'refresh'}
          </span>
        </span>
        <span className={styles.label} role="status" aria-live="polite">{shown ? label : ''}</span>
      </div>
    </div>
  );
}
