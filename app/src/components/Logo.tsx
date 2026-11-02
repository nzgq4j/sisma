// sisma logo: violet rounded square with the Material Symbols "earthquake" mark (design: 34px tile, 11px radius, 22px glyph).
// Colours follow the theme through --violet / --on-violet; pass `fixed` to pin the brand colours (website, which is light-only).
import { EARTHQUAKE_PATH } from './logo-path';

export function LogoMark({ size = 34, fixed = false, className }: { size?: number; fixed?: boolean; className?: string }) {
  const bg = fixed ? '#6C4BF4' : 'var(--violet)', fg = fixed ? '#FFFFFF' : 'var(--on-violet)';
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true" className={className} style={{ flex: 'none', display: 'block' }}>
      <rect width="96" height="96" rx="31.06" fill={bg} />
      <svg x="16.94" y="16.94" width="62.12" height="62.12" viewBox="0 -960 960 960"><path fill={fg} d={EARTHQUAKE_PATH} /></svg>
    </svg>
  );
}

/** Logo mark + "sisma" wordmark (optionally with the muted ".io"). */
export function Logo({ size = 34, withTld = true, fixed = false, textSize = 20 }: { size?: number; withTld?: boolean; fixed?: boolean; textSize?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.3) }}>
      <LogoMark size={size} fixed={fixed} />
      <span style={{ fontSize: textSize, fontWeight: 800, letterSpacing: '-.02em' }}>
        sisma{withTld && <span style={{ color: fixed ? '#5E587A' : 'var(--ink2)', fontWeight: 600 }}>.io</span>}
      </span>
    </span>
  );
}
