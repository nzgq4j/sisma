// Builds public/data/cities.json from Natural Earth 1:10m populated places (public domain):
//   curl -o ne_10m_populated_places.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places.geojson
//   node scripts/build-cities.mjs ne_10m_populated_places.geojson public/data/cities.json 6.9
// Keeps places Natural Earth shows by web-map zoom <max> (MIN_ZOOM), with position (0.01°), MIN_ZOOM, population and
// the name in the app's 10 languages (lib/cities.ts). A translated name equal to the English one is left empty.
import fs from 'fs';
const [src, out, maxZoom] = process.argv.slice(2);
const LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'id', 'tr'];
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
const r = c => Math.round(c * 100) / 100;
const rows = [];
for (const f of d.features) {
  const p = f.properties, z = Number(p.MIN_ZOOM);
  if (!Number.isFinite(z) || z > +maxZoom) continue;
  const [lon, lat] = f.geometry.coordinates;
  const en = (p.NAME_EN || p.NAME || '').trim();
  if (!en) continue;
  const names = LANGS.slice(1).map(l => { const v = (p[`NAME_${l.toUpperCase()}`] || '').trim(); return v && v !== en ? v : ''; });
  rows.push([r(lon), r(lat), z, Math.max(0, Math.round(Number(p.POP_MAX) || 0)), en, ...names]);
}
// Most important first: lowest MIN_ZOOM, then largest population (the order labels are placed in).
rows.sort((a, b) => a[2] - b[2] || b[3] - a[3]);
fs.writeFileSync(out, JSON.stringify({ langs: LANGS, rows }));
console.log('places', rows.length, 'bytes', fs.statSync(out).size);
