// Event pin shared by the 2D maps (components/dash/WorldMap.tsx, SVG) and the globe (components/Globe.tsx, canvas):
// one size for every event, tip on the epicentre, head of radius PIN_R centred PIN_HEAD px above the tip, filled by
// magnitude band with the magnitude (one decimal) written in the head.
export const PIN_R = 11, PIN_HEAD = 18;
export const PIN_PATH = `M0 0C-2.5-5-${PIN_R}-9.5-${PIN_R}-${PIN_HEAD}A${PIN_R} ${PIN_R} 0 1 1 ${PIN_R}-${PIN_HEAD}C${PIN_R}-9.5 2.5-5 0 0Z`;
export const PIN_FONT_PX = 10, PIN_TEXT_DY = 3.6; // baseline offset from the head centre
export const pinLabel = (mag: number) => mag.toFixed(1);
/** Tap reach around the pin head, px (touch ≈ 44 px across). */
export const pinReach = (touch: boolean) => PIN_R + (touch ? 11 : 3);

/** Marker style for events on the maps and globe (Me → Map markers): numbered pins of one size, or circles whose
 *  size and colour show the magnitude. */
export type MarkerStyle = 'pins' | 'circles';
/** Circle radius (px) for a magnitude: grows with magnitude, never smaller than 2.4 px. */
export const dotRadius = (mag: number) => Math.max(2.4, (mag - 1.6) * 2.1);
/** Where a marker is aimed and how far a tap or click may land from that point (touch ≈ 44 px across). */
export function markerHit(style: MarkerStyle, mag: number, touch: boolean): { dy: number; reach: number } {
  if (style === 'pins') return { dy: -PIN_HEAD, reach: pinReach(touch) };
  const r = dotRadius(mag);
  return { dy: 0, reach: touch ? Math.max(22, r + 6) : r + 3 };
}
