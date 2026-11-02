// Builds public/data/lakes.json from Natural Earth 1:50m lakes (public domain):
//   curl -o ne_50m_lakes.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson
//   node scripts/build-lakes.mjs ne_50m_lakes.geojson public/data/lakes.json 3
// Keeps lakes up to the given scalerank, rounds to 0.01°, and rewinds rings for d3-geo.
import fs from 'fs'; import { geoArea } from 'd3-geo';
const [src, out, maxRank] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
const r = c => Math.round(c * 100) / 100;
const polys = [];
for (const f of d.features) {
  if ((f.properties.scalerank ?? 9) > +maxRank) continue;
  const g = f.geometry; const list = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (let p of list) {
    p = p.map(ring => { const o = []; for (const [x, y] of ring) { const q = [r(x), r(y)]; const l = o[o.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) o.push(q); } return o; }).filter(ring => ring.length >= 4);
    if (!p.length) continue;
    // d3-geo wants exterior rings clockwise; a ring wound the other way covers the rest of the sphere.
    if (geoArea({ type: 'Polygon', coordinates: [p[0]] }) > 2 * Math.PI) p = p.map(ring => ring.slice().reverse());
    polys.push(p);
  }
}
const geo = { type: 'MultiPolygon', coordinates: polys };
fs.writeFileSync(out, JSON.stringify(geo));
console.log('polygons', polys.length, 'bytes', fs.statSync(out).size, 'area sr', geoArea(geo).toFixed(4));
