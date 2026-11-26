'use client';
// Infinite scroll for long lists (the feed): draws the first `step` rows and `step` more each time the end of the list
// comes within `margin` px of the screen. The rows are already loaded (one request for the feed, map and globe);
// only the drawing is spread out. Starts again from `step` when `resetKey` changes (a new sort order or filter).
import { useCallback, useEffect, useRef, useState } from 'react';

/** Rows drawn at first and per batch: a few screens ahead, so the first paint after loading stays short. */
export const LIST_STEP = 30;

export function useGrowingList(total: number, resetKey: unknown, step = LIST_STEP, margin = 800) {
  const [shown, setShown] = useState(step);
  const [key, setKey] = useState(resetKey);
  if (key !== resetKey) { setKey(resetKey); setShown(step); }
  const io = useRef<IntersectionObserver | null>(null);
  const more = shown < total;
  // A callback ref on the element after the last row: observed while there are rows left to draw.
  const sentinel = useCallback((el: HTMLElement | null) => {
    io.current?.disconnect(); io.current = null;
    if (!el || !more) return;
    io.current = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) setShown(n => n + step); }, { rootMargin: `0px 0px ${margin}px 0px` });
    io.current.observe(el);
  }, [more, step, margin, shown]); // eslint-disable-line react-hooks/exhaustive-deps -- re-observe after each batch
  useEffect(() => () => io.current?.disconnect(), []);
  return { shown: Math.min(shown, total), more, sentinel };
}
