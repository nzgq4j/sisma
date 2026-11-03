'use client';
// Gestures for the Map/Globe information card: swipe up → onUp (open details), swipe down or double tap away from
// buttons → onDown (close). Thresholds match components/Sheet.tsx so cards and sheets feel the same. The card follows
// the finger while dragging (upward with resistance). Simple taps on buttons still click normally.
import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';

const START_PX = 8;          // movement before a press becomes a drag
const SWIPE_UP_PX = 50;
const SWIPE_DOWN_PX = 70;
const SWIPE_SPEED = 0.5;     // px/ms
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 30;
const INTERACTIVE = 'button, a, input, select, textarea, label, summary, [role="button"], [role="switch"], [role="slider"], [role="checkbox"]';

export function useCardGestures({ onUp, onDown }: { onUp: () => void; onDown: () => void }) {
  const press = useRef<{ x: number; y: number; t: number; id: number; drag: boolean } | null>(null);
  const lastTap = useRef<{ x: number; y: number; t: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const end = () => { press.current = null; setDragging(false); setOffset(0); };

  return {
    style: { transform: offset ? `translateY(${offset}px)` : undefined, transition: dragging ? 'none' : 'transform .2s ease-out' },
    handlers: {
      onPointerDown: (e: RPointerEvent<HTMLElement>) => {
        if (!e.isPrimary) return;
        press.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId, drag: false };
      },
      onPointerMove: (e: RPointerEvent<HTMLElement>) => {
        const p = press.current; if (!p || p.id !== e.pointerId) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        if (!p.drag) {
          if (Math.abs(dy) < START_PX || Math.abs(dy) < Math.abs(dx)) return;
          p.drag = true; setDragging(true);
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* already released */ }
        }
        setOffset(dy > 0 ? dy : dy * 0.35);
      },
      onPointerUp: (e: RPointerEvent<HTMLElement>) => {
        const p = press.current; if (!p || p.id !== e.pointerId) return;
        const dy = e.clientY - p.y, dt = Math.max(1, e.timeStamp - p.t), v = dy / dt;
        if (p.drag) {
          lastTap.current = null; end();
          if (dy <= -SWIPE_UP_PX || v <= -SWIPE_SPEED) onUp();
          else if (dy >= SWIPE_DOWN_PX || v >= SWIPE_SPEED) onDown();
          return;
        }
        end();
        if ((e.target as Element).closest(INTERACTIVE)) { lastTap.current = null; return; }
        const prev = lastTap.current, now = { x: e.clientX, y: e.clientY, t: e.timeStamp };
        if (prev && now.t - prev.t <= DOUBLE_TAP_MS && Math.hypot(now.x - prev.x, now.y - prev.y) <= DOUBLE_TAP_PX) { lastTap.current = null; onDown(); }
        else lastTap.current = now;
      },
      onPointerCancel: end,
    },
  };
}
