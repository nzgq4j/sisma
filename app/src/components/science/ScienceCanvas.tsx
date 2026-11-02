'use client';
// Animated diagram for an article (design: initSci). 240px tall, theme-aware, with a pause button;
// it starts paused when the user prefers reduced motion.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { SCIENCE_PALETTE } from '@/lib/theme';
import { VISUALS, type CanvasVisual } from './visuals';
import styles from './science.module.css';

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const q = matchMedia(RM); q.addEventListener('change', cb); return () => q.removeEventListener('change', cb); };

function isDark() {
  const forced = document.documentElement.dataset.theme;
  if (forced === 'dark' || forced === 'light') return forced === 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Canvas + optional mode switcher (children) + caption row with the pause button, kept off the drawing. */
export function ScienceCanvas({ visual, mode, caption, children }: { visual: CanvasVisual; mode: string; caption: string; children?: ReactNode }) {
  const { m, nf } = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
  const [pausedPref, setPaused] = useState<boolean | null>(null);
  const paused = pausedPref ?? reduced;
  const live = useRef({ mode, paused, labels: m.sci.lbl, nf });
  useEffect(() => { live.current = { mode, paused, labels: m.sci.lbl, nf }; });

  useEffect(() => {
    const wrap = wrapRef.current, cv = canvasRef.current; if (!wrap || !cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let W = 0, H = 0, raf = 0, t = 0, last = performance.now();
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = wrap.clientWidth; H = wrap.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);
    const loop = (now: number) => {
      const s = live.current;
      if (!s.paused) t += Math.min(0.1, (now - last) / 1000); // paused keeps the current frame
      last = now;
      ctx.clearRect(0, 0, W, H);
      VISUALS[visual]({ ctx, W, H, t, mode: s.mode, P: isDark() ? SCIENCE_PALETTE.dark : SCIENCE_PALETTE.light, L: s.labels, nf: s.nf });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [visual]);

  return (
    <section className={styles.visual}>
      <div ref={wrapRef} className={styles.canvasWrap}>
        <canvas ref={canvasRef} role="img" aria-label={caption} />
      </div>
      {children}
      <div className={styles.captionRow}>
        <p className={styles.caption}>{caption}</p>
        <button type="button" className={styles.pause} onClick={() => setPaused(!paused)}
          aria-label={paused ? m.sci.play : m.sci.pause} title={paused ? m.sci.play : m.sci.pause}>
          <span className="ms">{paused ? 'play_arrow' : 'pause'}</span>
        </button>
      </div>
    </section>
  );
}
