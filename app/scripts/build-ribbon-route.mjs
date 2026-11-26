// Builds src/lib/ribbon/route.json, the reference route of the Pacific Fire Ribbon (Science → Pacific Fire Ribbon),
// from the Smithsonian volcano extract in src/lib/ribbon/gvp-arcs.json. Deterministic: the same input gives the same route.
//
//   node scripts/build-ribbon-route.mjs [output path]   (default: src/lib/ribbon/route.json)
//
// Method (docs/fire-ribbon.md):
//  1. The route visits the Smithsonian subregions marked route: true, in the order of their ids: from the southern tip
//     of the Andes north through the Americas, west along Alaska and the Aleutians, south through Kamchatka, Japan and
//     the Philippines, east through New Guinea and the Solomons, and south through Vanuatu, Tonga and the Kermadecs to
//     New Zealand.
//  2. For each subregion, its volcanoes are projected onto a plane tangent to the sphere at their centre (orthographic,
//     radius 6371 km; under 0.5% scale error across the widest arc). Their main direction (principal axis) is pointed
//     from the previous subregion towards the next one.
//  3. Along that direction the volcanoes are grouped in 100 km steps; each step with enough volcanoes (2 when the
//     subregion has 10 or more, else 1) gives one route point at the median position of its volcanoes, so an isolated
//     outlying volcano doesn't bend the route. Each point's offset across the arc is then averaged with its neighbours.
//  4. Consecutive subregions are joined by straight (geodesic) connectors, marked as connectors in the output: the
//     route does not claim a volcanic arc there.
//  5. Distances along the route are measured on the WGS84 ellipsoid (GeographicLib).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import geodesic from 'geographiclib-geodesic';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../src/lib/ribbon/gvp-arcs.json');
const out = process.argv[2] ?? join(here, '../src/lib/ribbon/route.json');
const STEP_KM = 100;
const R = 6371;
const RAD = Math.PI / 180;

const data = JSON.parse(readFileSync(src, 'utf8'));
const geod = geodesic.Geodesic.WGS84;

const vec = (lat, lon) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const toLatLon = v => [Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD, Math.atan2(v[1], v[0]) / RAD];
const median = xs => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

const arcs = data.arcs.filter(a => a.route).sort((a, b) => a.id - b.id);
const pts = new Map(arcs.map(a => [a.id, data.volcanoes.filter(v => v[0] === a.id).map(v => vec(v[2], v[3]))]));
const centre = id => norm(pts.get(id).reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]));

const vertices = [];
arcs.forEach((arc, i) => {
  const P = pts.get(arc.id);
  const c0 = centre(arc.id);
  const [lat0, lon0] = toLatLon(c0);
  const east = [-Math.sin(lon0 * RAD), Math.cos(lon0 * RAD), 0];
  const north = [-Math.sin(lat0 * RAD) * Math.cos(lon0 * RAD), -Math.sin(lat0 * RAD) * Math.sin(lon0 * RAD), Math.cos(lat0 * RAD)];
  const plane = v => [R * dot(v, east), R * dot(v, north)];
  const uv = P.map(plane);
  // Principal axis of the volcanoes in the plane.
  const mu = uv.reduce((s, p) => [s[0] + p[0] / uv.length, s[1] + p[1] / uv.length], [0, 0]);
  let sxx = 0, sxy = 0, syy = 0;
  for (const [u, v] of uv) { sxx += (u - mu[0]) ** 2; sxy += (u - mu[0]) * (v - mu[1]); syy += (v - mu[1]) ** 2; }
  const theta = uv.length > 1 ? 0.5 * Math.atan2(2 * sxy, sxx - syy) : 0;
  let axis = [Math.cos(theta), Math.sin(theta)];
  // Point it from the previous subregion towards the next.
  const prev = i > 0 ? plane(centre(arcs[i - 1].id)) : mu;
  const next = i < arcs.length - 1 ? plane(centre(arcs[i + 1].id)) : mu;
  const want = [next[0] - prev[0], next[1] - prev[1]];
  if (axis[0] * want[0] + axis[1] * want[1] < 0) axis = [-axis[0], -axis[1]];
  if (uv.length === 1 || (want[0] === 0 && want[1] === 0)) axis = norm([...want, 0]).slice(0, 2);
  const perp = [-axis[1], axis[0]];
  const ac = uv.map(([u, v]) => [u * axis[0] + v * axis[1], u * perp[0] + v * perp[1]]);
  const amin = Math.min(...ac.map(p => p[0]));
  const minCount = P.length >= 10 ? 2 : 1;
  const bins = new Map();
  for (const p of ac) { const k = Math.floor((p[0] - amin) / STEP_KM); (bins.get(k) ?? bins.set(k, []).get(k)).push(p); }
  const steps = [...bins.entries()].sort((a, b) => a[0] - b[0]).map(([, b]) => b).filter(b => b.length >= minCount)
    .map(b => [median(b.map(p => p[0])), median(b.map(p => p[1]))]);
  const smooth = steps.map((s, j) => (j === 0 || j === steps.length - 1 ? s : [s[0], (steps[j - 1][1] + s[1] + steps[j + 1][1]) / 3]));
  for (const [a, c] of smooth) {
    const u = a * axis[0] + c * perp[0], v = a * axis[1] + c * perp[1];
    const k = Math.sqrt(Math.max(0, 1 - (u * u + v * v) / (R * R)));
    const p = norm([0, 1, 2].map(d => c0[d] * k + (u * east[d] + v * north[d]) / R));
    const [lat, lon] = toLatLon(p);
    vertices.push({ lat: round(lat, 4), lon: round(lon, 4), arc: arc.id });
  }
});

let x = 0;
const rows = vertices.map((v, i) => {
  if (i > 0) x += geod.Inverse(vertices[i - 1].lat, vertices[i - 1].lon, v.lat, v.lon).s12 / 1000;
  return [v.lat, v.lon, round(x, 1), v.arc];
});

writeFileSync(out, JSON.stringify({
  version: 1,
  source: data.source,
  retrieved: data.retrieved,
  method: `scripts/build-ribbon-route.mjs: ${STEP_KM} km steps along each subregion's principal axis, median volcano position per step; WGS84 distances (GeographicLib)`,
  lengthKm: round(x, 1),
  columns: ['lat', 'lon', 'xKm', 'arc'],
  vertices: rows,
}) + '\n');
console.log(`${rows.length} route points, ${round(x, 0)} km`);
