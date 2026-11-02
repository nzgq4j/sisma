import { magColor } from '@/lib/theme';

export function MagBadge({ mag, size = 48 }: { mag: number; size?: number }) {
  const c = magColor(mag);
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.31, background: c.fill, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.375, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>
      {mag.toFixed(1)}
    </div>
  );
}
