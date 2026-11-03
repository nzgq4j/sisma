import { describe, expect, it } from 'vitest';
import { geoMercator } from 'd3-geo';
import { kForWebZoom, osmTileUrl, tileOpacity, visibleTiles, webZoom } from './tiles';

// Phone-sized map as WorldMap builds it: scale (H/2)/1.9, rotated to the user's longitude.
const w = 390, h = 708, sc = Math.max(h / 2 / 1.9, w / (2 * Math.PI)), lon0 = -110;
const proj = geoMercator().rotate([-lon0, 0]).scale(sc).translate([w / 2, h / 2]);

// Standard web-Mercator pixel of a point at zoom z.
const webPx = (lon: number, lat: number, z: number) => {
  const n = 256 * 2 ** z, s = Math.sin((lat * Math.PI) / 180);
  return { x: ((lon + 180) / 360) * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
};

describe('tiles', () => {
  it('converts between zoom factor and web zoom', () => {
    expect(webZoom(sc, kForWebZoom(sc, 12))).toBeCloseTo(12, 9);
    expect(tileOpacity(6)).toBe(0); expect(tileOpacity(7)).toBeCloseTo(0.5); expect(tileOpacity(9)).toBe(1);
  });

  it('places tiles so a point lands on the same pixel as the app projection draws it', () => {
    for (const [lon, lat, z] of [[-110.9, 31.4, 15], [139.69, 35.68, 12], [-109.9, 31.44, 18], [170, -40, 9]] as const) {
      const k = kForWebZoom(sc, z);
      const p = proj([lon, lat])!;
      // Centre the view on the point, as the region view does.
      const tf = { k, x: w / 2 - k * p[0], y: h / 2 - k * p[1] };
      const tiles = visibleTiles({ w, h, sc, lon0, tf });
      const wp = webPx(lon, lat, z), tx = Math.floor(wp.x / 256), ty = Math.floor(wp.y / 256);
      const t = tiles.find(t => t.x === ((tx % 2 ** z) + 2 ** z) % 2 ** z && t.y === ty)!;
      expect(t).toBeDefined();
      expect(t.size).toBeCloseTo(256, 6);
      // Point's screen position = tile corner + offset inside the tile.
      expect(t.left + (wp.x - tx * 256)).toBeCloseTo(w / 2, 4);
      expect(t.top + (wp.y - ty * 256)).toBeCloseTo(h / 2, 4);
    }
  });

  it('covers the screen with a sensible number of tiles and wraps x across the date line', () => {
    const z = 10, k = kForWebZoom(sc, z), p = proj([179.99, 0])!;
    const tiles = visibleTiles({ w, h, sc, lon0, tf: { k, x: w / 2 - k * p[0], y: h / 2 - k * p[1] } });
    expect(tiles.length).toBeGreaterThan(4); expect(tiles.length).toBeLessThan(20);
    expect(tiles.every(t => t.x >= 0 && t.x < 2 ** z)).toBe(true);
    expect(new Set(tiles.map(t => t.x)).has(0)).toBe(true); // tiles from both sides of 180°
  });

  it('builds OpenStreetMap tile URLs', () => {
    expect(osmTileUrl({ z: 3, x: 1, y: 2 })).toBe('https://tile.openstreetmap.org/3/1/2.png');
  });
});
