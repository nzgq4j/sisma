// Builds src/lib/quakes/towns.json — the towns for "27 km SSE of Uyuni" (lib/quakes/nearest-place.ts) — from GeoNames
// populated places with more than 1,000 people (cities1000, the list USGS uses for its place names), CC BY 4.0,
// credited in the app ("Place names: GeoNames"). The npm package cities.json republishes it:
//   npm pack cities.json && tar xzf cities.json-*.tgz
//   node scripts/build-towns.mjs package/cities.json src/lib/quakes/towns.json
// Each row: longitude, latitude (3 decimals, ~100 m), ISO country code, name. Server only (never imported by app pages).
import { readFileSync, writeFileSync } from 'node:fs';

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node scripts/build-towns.mjs <cities.json> <out.json>'); process.exit(1); }
const places = JSON.parse(readFileSync(src, 'utf8'));
const r3 = v => Math.round(Number(v) * 1000) / 1000;
const rows = places
  .filter(p => p.name && p.country && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
  .map(p => [r3(p.lng), r3(p.lat), p.country, p.name]);
writeFileSync(out, JSON.stringify({ source: 'GeoNames cities1000 (CC BY 4.0) via npm cities.json', count: rows.length, rows }));
console.log(`${rows.length} towns → ${out}`);
