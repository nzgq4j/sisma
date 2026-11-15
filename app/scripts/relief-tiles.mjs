// Builds the light theme's relief layer from Natural Earth's "Cross Blended Hypso with Shaded Relief and Water"
// (HYP_50M_SR_W.tif, 10 800 × 5 400 px, equirectangular, public domain; naturalearthdata.com, also in the
// github.com/nvkelso/natural-earth-raster repository under 50m_rasters/):
//   - public/relief/{z}/{x}/{y}.webp: 256 px web-Mercator tiles, zoom 0–RELIEF_MAX_ZOOM, for the 2D map (lib/relief.ts)
//   - public/relief/globe.webp: 4096 × 2048 equirectangular texture for the globe (WebGL, lib/relief-globe.ts)
//
//   node scripts/relief-tiles.mjs path/to/HYP_50M_SR_W.tif
//
// Colours come from the source unchanged: humid lowlands green, arid lowlands tan and brown, highlands lighter, with
// shaded relief and the source's own water colour. Re-run only when the source or the zoom range changes.
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const MAX_ZOOM = 5; // keep in step with RELIEF_MAX_ZOOM in src/lib/relief.ts
const TILE = 256, QUALITY = 90; // lower quality shows seams between tiles when they are scaled up

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/relief-tiles.mjs HYP_50M_SR_W.tif'); process.exit(1); }
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'relief');

const { data, info } = await sharp(src, { limitInputPixels: false }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
console.log(`source ${W}×${H}×${C}`);

/** Bilinear sample of the source at fractional pixel (sx, sy); x wraps round the world, y is clamped. */
function sample(sx, sy, px, o) {
  const x0 = Math.floor(sx), y0 = Math.min(H - 1, Math.max(0, Math.floor(sy)));
  const fx = sx - x0, fy = Math.min(1, Math.max(0, sy - y0));
  const xa = ((x0 % W) + W) % W, xb = (xa + 1) % W, y1 = Math.min(H - 1, y0 + 1);
  for (let c = 0; c < 3; c++) {
    const a = data[(y0 * W + xa) * C + c], b = data[(y0 * W + xb) * C + c];
    const d = data[(y1 * W + xa) * C + c], e = data[(y1 * W + xb) * C + c];
    px[o + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
  }
}

rmSync(out, { recursive: true, force: true });
let count = 0, bytes = 0;
for (let z = 0; z <= MAX_ZOOM; z++) {
  const n = 2 ** z;
  // Source rows for each tile row are the same across a zoom level: latitude of each output pixel row.
  for (let ty = 0; ty < n; ty++) {
    const rows = new Float64Array(TILE);
    for (let py = 0; py < TILE; py++) {
      const ny = (ty * TILE + py + 0.5) / (n * TILE);
      const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * ny))) * 180 / Math.PI;
      rows[py] = (90 - lat) / 180 * H - 0.5;
    }
    for (let tx = 0; tx < n; tx++) {
      const px = Buffer.alloc(TILE * TILE * 3);
      for (let py = 0; py < TILE; py++) {
        for (let pxi = 0; pxi < TILE; pxi++) {
          const nx = (tx * TILE + pxi + 0.5) / (n * TILE);
          sample(nx * W - 0.5, rows[py], px, (py * TILE + pxi) * 3);
        }
      }
      mkdirSync(join(out, String(z), String(tx)), { recursive: true });
      const file = join(out, String(z), String(tx), `${ty}.webp`);
      const r = await sharp(px, { raw: { width: TILE, height: TILE, channels: 3 } }).webp({ quality: QUALITY, smartSubsample: true }).toFile(file);
      count++; bytes += r.size;
    }
  }
  console.log(`zoom ${z}: ${n * n} tiles`);
}
const g = await sharp(src, { limitInputPixels: false }).removeAlpha().resize(4096, 2048, { kernel: 'lanczos3' })
  .webp({ quality: 78 }).toFile(join(out, 'globe.webp'));
console.log(`${count} tiles, ${(bytes / 1e6).toFixed(1)} MB; globe.webp ${(g.size / 1e3).toFixed(0)} kB`);
