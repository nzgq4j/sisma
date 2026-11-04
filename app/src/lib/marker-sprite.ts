// Event markers drawn into small offscreen canvases once per look (style, colours, number, size) and then stamped
// onto the map and globe canvases, so a thousand markers redraw in a few milliseconds while panning or spinning.
// Browser only.
import { PIN_FONT_PX, PIN_HEAD, PIN_PATH, PIN_R, PIN_TEXT_DY, dotRadius, type MarkerStyle } from './pin';

export interface Sprite { cv: HTMLCanvasElement; ax: number; ay: number; w: number; h: number }
export interface SpriteLook {
  style: MarkerStyle; mag: number; fill: string; ink: string; edge: string; font: string;
  /** Ink outline for the selected / focused marker. */
  outline?: string | null;
  scale?: number;
}

let shape: Path2D | null = null;
const cache = new Map<string, Sprite>();

export function markerSprite(l: SpriteLook): Sprite {
  const scale = l.scale ?? 1, dpr = window.devicePixelRatio || 1;
  const label = l.style === 'pins' ? l.mag.toFixed(1) : '';
  const r = l.style === 'circles' ? dotRadius(l.mag) : 0;
  // The font status is part of the key, so pins drawn before the web font loaded are redrawn once it has.
  const key = [l.style, l.fill, l.ink, label, r, l.outline ?? '', scale, l.edge, l.font, dpr, document.fonts?.status].join('|');
  let sp = cache.get(key);
  if (sp) return sp;
  if (cache.size > 800) cache.clear();
  const cv = document.createElement('canvas');
  if (l.style === 'pins') {
    shape ??= new Path2D(PIN_PATH);
    const pad = 3, w = (PIN_R + pad) * 2 * scale, h = (PIN_HEAD + PIN_R + pad * 2) * scale;
    cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
    const c = cv.getContext('2d')!;
    c.scale(dpr * scale, dpr * scale); c.translate(PIN_R + pad, PIN_HEAD + PIN_R + pad);
    c.lineJoin = 'round';
    c.fillStyle = l.fill; c.fill(shape); c.strokeStyle = l.edge; c.lineWidth = 1.5; c.stroke(shape);
    if (l.outline) { c.strokeStyle = l.outline; c.lineWidth = 2 / scale; c.stroke(shape); }
    c.fillStyle = l.ink; c.font = `800 ${PIN_FONT_PX}px ${l.font}`; c.textAlign = 'center';
    c.fillText(label, 0, -PIN_HEAD + PIN_TEXT_DY);
    sp = { cv, ax: (PIN_R + pad) * scale, ay: (PIN_HEAD + PIN_R + pad) * scale, w, h };
  } else {
    const ring = l.outline ? 4 + 1.2 : 0, half = r + 1 + ring + 1, size = half * 2;
    cv.width = Math.ceil(size * dpr); cv.height = Math.ceil(size * dpr);
    const c = cv.getContext('2d')!;
    c.scale(dpr, dpr); c.translate(half, half);
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2);
    c.globalAlpha = 0.92; c.fillStyle = l.fill; c.fill();
    c.globalAlpha = 1; c.strokeStyle = l.edge; c.lineWidth = 1; c.stroke();
    if (l.outline) { c.beginPath(); c.arc(0, 0, r + 4, 0, Math.PI * 2); c.strokeStyle = l.outline; c.lineWidth = 2.4; c.stroke(); }
    sp = { cv, ax: half, ay: half, w: size, h: size };
  }
  cache.set(key, sp);
  return sp;
}

/** Draws a sprite with its anchor (pin tip / circle centre) at x, y in CSS pixels. */
export function stampSprite(ctx: CanvasRenderingContext2D, sp: Sprite, x: number, y: number) {
  ctx.drawImage(sp.cv, x - sp.ax, y - sp.ay, sp.w, sp.h);
}
