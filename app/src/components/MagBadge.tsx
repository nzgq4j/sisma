import { magInkVar, magVar } from '@/lib/theme';

export function MagBadge({ mag, size = 48 }: { mag: number; size?: number }) {
  // Same colours as the map and globe pins (--mag-N / --mag-ink-N, following light/dark mode).
  const c = { fill: magVar(mag), text: magInkVar(mag) };
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.31, background: c.fill, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.375, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>
      {mag.toFixed(1)}
    </div>
  );
}
