// Relief layer for the light theme's Mercator map and globe: Natural Earth "Cross Blended Hypso with Shaded Relief and
// Water" (public domain): humid lowlands green, arid lowlands tan and brown, highlands lighter, with hill shading.
// Built by scripts/relief-tiles.mjs into public/relief/ (web-Mercator tiles to RELIEF_MAX_ZOOM, and an equirectangular
// texture for the globe). Above RELIEF_MAX_ZOOM the deepest tiles are scaled up until the street tiles take over.

/** Deepest relief tile level (keep in step with MAX_ZOOM in scripts/relief-tiles.mjs). */
export const RELIEF_MAX_ZOOM = 5;
export const reliefTileUrl = (z: number, x: number, y: number) => `/relief/${z}/${x}/${y}.webp`;
export const RELIEF_GLOBE_URL = '/relief/globe.webp';
/** NEXT_PUBLIC_RELIEF=off keeps the flat light-theme colours. */
export const RELIEF_ON = process.env.NEXT_PUBLIC_RELIEF !== 'off';

const cache = new Map<string, HTMLImageElement>();
const waiting = new Set<() => void>();

/** The image for `url` once it has loaded, else null; starts loading it and calls `onLoad` when it arrives. */
export function reliefImage(url: string, onLoad?: () => void): HTMLImageElement | null {
  let img = cache.get(url);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.onload = () => { const fns = [...waiting]; waiting.clear(); fns.forEach(f => f()); };
    img.src = url;
    cache.set(url, img);
  }
  if (img.complete && img.naturalWidth > 0) return img;
  if (onLoad) waiting.add(onLoad);
  return null;
}

/**
 * The globe texture as pixels (2048 × 1024, equirectangular: x = longitude −180…180, y = latitude 90…−90), once loaded.
 */
let globePixels: { w: number; h: number; data: Uint8ClampedArray } | null = null;
export function reliefGlobePixels(onLoad?: () => void) {
  if (globePixels) return globePixels;
  const img = reliefImage(RELIEF_GLOBE_URL, onLoad);
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  globePixels = { w: c.width, h: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data };
  return globePixels;
}

/**
 * Longitude / latitude (degrees) under a point of an orthographic globe, for a d3 rotation [λ, φ, 0] (degrees) and a
 * point (u, v) on the unit disc (u right, v up; u² + v² ≤ 1). Same result as d3's geoOrthographic().rotate().invert,
 * without per-point projection objects (used for every pixel of the globe texture).
 */
export function orthoInvert(u: number, v: number, lambda: number, phi: number): [number, number] {
  const r = Math.PI / 180, x = Math.sqrt(Math.max(0, 1 - u * u - v * v)), y = u, z = v;
  const cp = Math.cos(phi * r), sp = Math.sin(phi * r);
  const lon = Math.atan2(y, x * cp + z * sp) / r - lambda;
  const lat = Math.asin(Math.max(-1, Math.min(1, z * cp - x * sp))) / r;
  return [((lon + 540) % 360) - 180, lat];
}
