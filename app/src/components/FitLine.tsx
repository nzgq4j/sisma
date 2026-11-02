'use client';
// One line of text that shrinks its font just enough to fit its box (like the polar lights app's FitHeadings),
// so details never wrap or get cut off: dates, places and German/Indonesian labels stay on one line.
// Re-fits when the box resizes, the text changes or web fonts arrive. Below `min` px it ellipsizes instead.
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export function FitLine({ children, min = 10, className, style, as: Tag = 'span', title }: {
  children: ReactNode; min?: number; className?: string; style?: CSSProperties; as?: 'span' | 'strong' | 'dd' | 'div' | 'p'; title?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.fontSize = '';
        if (!el.clientWidth || el.scrollWidth <= el.clientWidth + 1) return;
        const size = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = `${Math.max(min, Math.floor(size * (el.clientWidth / el.scrollWidth) * 0.98 * 10) / 10)}px`;
      });
    };
    fit();
    let lastW = 0;
    const ro = new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if (w !== lastW) { lastW = w; fit(); } });
    ro.observe(el);
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener('loadingdone', fit);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); document.fonts?.removeEventListener('loadingdone', fit); };
  }, [children, min]);
  return (
    <Tag ref={ref as never} className={className} title={title}
      style={{ display: 'block', minWidth: 0, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...style }}>
      {children}
    </Tag>
  );
}
