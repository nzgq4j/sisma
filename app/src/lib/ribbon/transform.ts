// Pacific Fire Ribbon: positions along the reference route (route.json, built by scripts/build-ribbon-route.mjs from the
// Smithsonian volcano catalogue). Server only: used by GET /api/science/ribbon.
//
// For a point (WGS84 latitude and longitude) toRibbon gives
//   x: distance along the route to the point's foot on the route, km (from the southern tip of the Andes);
//   y: signed distance from the route to the point, km; positive = left of the direction of travel, which faces the
//      open Pacific along most of the route (west of the Americas, south of the Aleutians, east of Japan, and so on).
// Both are measured on the WGS84 ellipsoid (GeographicLib geodesics). The foot is found on a sphere first, to pick the
// nearest route segments, then refined on the ellipsoid until the line to the point is perpendicular to the route.
// The original latitude, longitude and depth are kept by the caller; this only adds the route coordinates.
import geodesic from 'geographiclib-geodesic';
import route from './route.json';
import gvp from './gvp-arcs.json';
import type { GroupId } from './shared';

/** Points up to this far beyond either end of the route are still placed (on the route's extension). */
export const END_ALLOWANCE_KM = 500;
/** How far from the route an earthquake can be and still belong to the ribbon: on the Pacific (left) side, and on the
 * other side, where the descending plate's deep earthquakes lie (up to about 600 km behind the arc in South America). */
export const LEFT_KM = 400;
export const RIGHT_KM = 700;
/** Joins between subregions at least this long are shown as stretches with no volcanic arc. */
export const GAP_MIN_KM = 200;

export type Group = GroupId;
export const LENGTH_KM = route.lengthKm;

const geod = geodesic.Geodesic.WGS84;
const MASK = geodesic.Geodesic.LATITUDE | geodesic.Geodesic.LONGITUDE | geodesic.Geodesic.AZIMUTH | geodesic.Geodesic.DISTANCE_IN;
const RAD = Math.PI / 180;
const R_KM = 6371.0088;

type V3 = [number, number, number];
const vec = (lat: number, lon: number): V3 => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };

const groupOfArc = new Map<number, Group>(gvp.arcs.map(a => [a.id, a.group as Group]));

interface Segment {
  i: number; lat1: number; lon1: number; lat2: number; lon2: number; x1: number; len: number;
  a: V3; b: V3; n: V3; ang: number;
  /** The subregion the segment lies in, or 0 for a join between two subregions. */
  arc: number; from: Group; to: Group;
}

const V = route.vertices as [number, number, number, number][];
const SEGMENTS: Segment[] = V.slice(0, -1).map((p, i) => {
  const q = V[i + 1];
  const a = vec(p[0], p[1]), b = vec(q[0], q[1]);
  return {
    i, lat1: p[0], lon1: p[1], lat2: q[0], lon2: q[1], x1: p[2], len: q[2] - p[2],
    a, b, n: unit(cross(a, b)), ang: Math.acos(Math.max(-1, Math.min(1, dot(a, b)))),
    arc: p[3] === q[3] ? p[3] : 0, from: groupOfArc.get(p[3])!, to: groupOfArc.get(q[3])!,
  };
});

/** Spherical distance (km) from p to a segment, and the fraction along it of the nearest point (extended at the ends). */
function sphericalFoot(p: V3, s: Segment): { km: number; t: number } {
  const sinX = dot(p, s.n);
  const foot = unit([p[0] - sinX * s.n[0], p[1] - sinX * s.n[1], p[2] - sinX * s.n[2]]);
  const along = Math.atan2(dot(cross(s.a, foot), s.n), dot(s.a, foot));
  const ext = END_ALLOWANCE_KM / R_KM / s.ang;
  const lo = s.i === 0 ? -ext : 0, hi = s.i === SEGMENTS.length - 1 ? 1 + ext : 1;
  const t = Math.max(lo, Math.min(hi, along / s.ang));
  const c = t === along / s.ang ? foot : clampPoint(s, t);
  return { km: Math.acos(Math.max(-1, Math.min(1, dot(p, c)))) * R_KM, t };
}
function clampPoint(s: Segment, t: number): V3 {
  const th = t * s.ang;
  const u = unit(cross(s.n, s.a));
  return [Math.cos(th) * s.a[0] + Math.sin(th) * u[0], Math.cos(th) * s.a[1] + Math.sin(th) * u[1], Math.cos(th) * s.a[2] + Math.sin(th) * u[2]];
}

export interface RibbonPos {
  /** Distance along the route, km. */ x: number;
  /** Signed distance from the route, km (positive = left, the Pacific side on most of the route). */ y: number;
  /** Region: the group of the subregion it is beside, or the two groups a join connects. */ from: Group; to: Group;
}

/** Refines the foot on the ellipsoid: moves along the segment's geodesic until the point is square to it. */
function ellipsoidalFoot(lat: number, lon: number, s: Segment, t: number): { x: number; y: number } {
  const line = geod.InverseLine(s.lat1, s.lon1, s.lat2, s.lon2, MASK);
  const L = line.s13;
  const ext = END_ALLOWANCE_KM * 1000;
  const lo = s.i === 0 ? -ext : 0, hi = s.i === SEGMENTS.length - 1 ? L + ext : L;
  let d = Math.max(lo, Math.min(hi, t * L));
  let s12 = 0, side = 0;
  for (let k = 0; k < 8; k++) {
    const q = line.Position(d, MASK);
    const r = geod.Inverse(q.lat2!, q.lon2!, lat, lon);
    s12 = r.s12!;
    const delta = ((r.azi1! - q.azi2! + 540) % 360) - 180;
    side = Math.sin(delta * RAD);
    const step = s12 * Math.cos(delta * RAD);
    const nd = Math.max(lo, Math.min(hi, d + step));
    if (Math.abs(nd - d) < 1) { d = nd; break; }
    d = nd;
  }
  return { x: s.x1 + (d / L) * s.len, y: (side < 0 ? 1 : -1) * (s12 / 1000) };
}

/** Route coordinates of a point, or null when it is beyond the route's ends. Doesn't apply the LEFT_KM / RIGHT_KM corridor. */
export function toRibbon(lat: number, lon: number): RibbonPos | null {
  const p = vec(lat, lon);
  type Cand = { s: Segment; km: number; t: number };
  let best: Cand | null = null, second: Cand | null = null;
  for (const s of SEGMENTS) {
    const f = sphericalFoot(p, s);
    if (!best || f.km < best.km) { second = best; best = { s, ...f }; } else if (!second || f.km < second.km) second = { s, ...f };
  }
  if (!best) return null;
  let pick: { s: Segment; x: number; y: number } | null = null;
  for (const c of [best, second]) {
    if (!c) continue;
    const r = ellipsoidalFoot(lat, lon, c.s, c.t);
    if (!pick || Math.abs(r.y) < Math.abs(pick.y)) pick = { s: c.s, ...r };
  }
  if (!pick) return null;
  if (pick.x < -END_ALLOWANCE_KM + 1e-6 || pick.x > LENGTH_KM + END_ALLOWANCE_KM - 1e-6) return null;
  return { x: pick.x, y: pick.y, from: pick.s.arc ? groupOfArc.get(pick.s.arc)! : pick.s.from, to: pick.s.arc ? groupOfArc.get(pick.s.arc)! : pick.s.to };
}

/** The reverse of toRibbon: the latitude and longitude at route coordinates (x along, y to the left), on WGS84. */
export function fromRibbon(x: number, y: number): { lat: number; lon: number } {
  const s = SEGMENTS.find(g => x <= g.x1 + g.len) ?? SEGMENTS[SEGMENTS.length - 1];
  const seg = x < 0 ? SEGMENTS[0] : s;
  const line = geod.InverseLine(seg.lat1, seg.lon1, seg.lat2, seg.lon2, MASK);
  const q = line.Position(((x - seg.x1) / seg.len) * line.s13, MASK);
  const r = geod.Direct(q.lat2!, q.lon2!, q.azi2! + (y >= 0 ? -90 : 90), Math.abs(y) * 1000);
  return { lat: r.lat2!, lon: ((r.lon2! + 540) % 360) - 180 };
}

/** True when a point with these route coordinates belongs to the ribbon's corridor. */
export const inCorridor = (r: RibbonPos) => r.y <= LEFT_KM && r.y >= -RIGHT_KM;

/** Where each region (group of subregions) lies along the route, and the joins with no volcanic arc, for drawing. */
export function layout(): { lengthKm: number; regions: { group: Group; x0: number; x1: number }[]; gaps: { x0: number; x1: number }[] } {
  const regions: { group: Group; x0: number; x1: number }[] = [];
  for (const v of V) {
    const g = groupOfArc.get(v[3])!;
    const last = regions.at(-1);
    if (last && last.group === g) last.x1 = v[2]; else regions.push({ group: g, x0: v[2], x1: v[2] });
  }
  const gaps = SEGMENTS.filter(s => s.arc === 0 && s.len >= GAP_MIN_KM).map(s => ({ x0: s.x1, x1: s.x1 + s.len }));
  return { lengthKm: LENGTH_KM, regions, gaps };
}
