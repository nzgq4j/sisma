'use client';
import { useEffect, useRef } from 'react';

/**
 * Keeps a bottom-fixed bar on the bottom edge of the visible screen. Safari and Edge on iOS (WebKit bug 297779)
 * can leave such a bar floating above the bottom once the browser toolbar collapses on scroll; this moves it down
 * by the gap between the bar and the visible bottom. Where the bar is already in place the gap is zero and nothing
 * changes. Skipped while zoomed in, when the visible area legitimately differs. (Same fix as the polar lights app.)
 */
export function useStickToBottom<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const vv = window.visualViewport, el = ref.current;
    if (!vv || !el) return;
    let shift = 0, frame = 0;
    const fit = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      // Hidden (e.g. desktop layout): nothing to place.
      const gap = !box.height || vv.scale > 1.01 ? 0 : vv.offsetTop + vv.height - (box.bottom - shift);
      const next = gap > 0.5 ? Math.round(gap) : 0;
      if (next !== shift) { shift = next; el.style.transform = shift ? `translateY(${shift}px)` : ''; }
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(fit); };
    vv.addEventListener('resize', queue);
    vv.addEventListener('scroll', queue);
    window.addEventListener('scroll', queue, { passive: true });
    queue();
    return () => {
      vv.removeEventListener('resize', queue);
      vv.removeEventListener('scroll', queue);
      window.removeEventListener('scroll', queue);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return ref;
}
