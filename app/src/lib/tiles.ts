// Street-level detail for the Mercator map (components/dash/WorldMap.tsx): which web-map tiles cover the view and
// where they go on screen. The app's Mercator is rotated to the user's longitude, which for Mercator is only a
// horizontal shift, so standard web-Mercator tiles (256 px, zoom z = 2^z tiles across) line up exactly.

export const TILE_PX = 256;
/** Web-map zoom where tiles start to fade in over the app's own outlines, and where they are fully shown. */
export const TILE_FADE_FROM = 6.5, TILE_FADE_TO = 7.5;
/** Deepest zoom (street level). */
export const TILE_MAX_ZOOM = 18;

/** Web-map zoom level equivalent to the app map at projection scale `sc` and d3-zoom factor `k`. */
export const webZoom = (sc: number, k: number) => Math.log2((2 * Math.PI * sc * k) / TILE_PX);
/** d3-zoom factor that gives web-map zoom `z`. */
export const kForWebZoom = (sc: number, z: number) => (TILE_PX * 2 ** z) / (2 * Math.PI * sc);
/** 0 (only the app's outlines) → 1 (only tiles). */
export const tileOpacity = (zw: number) => Math.min(1, Math.max(0, (zw - TILE_FADE_FROM) / (TILE_FADE_TO - TILE_FADE_FROM)));

export interface View { w: number; h: number; sc: number; lon0: number; tf: { x: number; y: number; k: number } }
export interface Tile { key: string; z: number; x: number; y: number; left: number; top: number; size: number }

/** Map units (before the zoom transform) of a normalised web-Mercator position (0–1 across, 0–1 down). */
const toMap = (v: View, nx: number, ny: number) => ({
  x: v.w / 2 + 2 * Math.PI * v.sc * (nx - (v.lon0 + 180) / 360),
  y: v.h / 2 + 2 * Math.PI * v.sc * (ny - 0.5),
});

/** Tiles covering the screen at the current view, with screen positions (unwrapped horizontally, so the map
 *  scrolls endlessly; `x` is wrapped for the tile request). */
export function visibleTiles(v: View, level?: number): Tile[] {
  const z = level ?? Math.min(TILE_MAX_ZOOM, Math.max(0, Math.round(webZoom(v.sc, v.tf.k))));
  const n = 2 ** z;
  // Screen → normalised web-Mercator.
  const nx = (sx: number) => ((sx - v.tf.x) / v.tf.k - v.w / 2) / (2 * Math.PI * v.sc) + (v.lon0 + 180) / 360;
  const ny = (sy: number) => ((sy - v.tf.y) / v.tf.k - v.h / 2) / (2 * Math.PI * v.sc) + 0.5;
  const x0 = Math.floor(nx(0) * n), x1 = Math.floor(nx(v.w) * n);
  const y0 = Math.max(0, Math.floor(ny(0) * n)), y1 = Math.min(n - 1, Math.floor(ny(v.h) * n));
  const size = (v.tf.k * 2 * Math.PI * v.sc) / n;
  const out: Tile[] = [];
  if (x1 - x0 > 64 || y1 - y0 > 64) return out; // never request a flood of tiles
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const m = toMap(v, tx / n, ty / n);
      out.push({ key: `${z}/${tx}/${ty}`, z, x: ((tx % n) + n) % n, y: ty, left: v.tf.x + v.tf.k * m.x, top: v.tf.y + v.tf.k * m.y, size });
    }
  }
  return out;
}

/** MapTiler raster tile URL (retina tiles at 256 px). */
export const mapTilerUrl = (style: string, key: string, t: Pick<Tile, 'z' | 'x' | 'y'>, retina: boolean) =>
  `https://api.maptiler.com/maps/${encodeURIComponent(style)}/256/${t.z}/${t.x}/${t.y}${retina ? '@2x' : ''}.png?key=${encodeURIComponent(key)}`;
