// Automatic felt maps (no React, used by the device and the server).
// When a quake is felt, people open the app: nearby app activity spikes in the minutes after the event. Devices
// that allow location send an approximate position while the app is open (blurred here by up to BLUR_M before it
// leaves the device, with no identifiers). For an event we count positions within the likely felt radius during the
// WINDOW_S seconds after it, compare each ~10 km cell with its usual activity in the hour before, and keep cells with
// a clear surge from at least MIN_PEOPLE positions, so nothing can be tied to a single person.
import { distanceKm } from './geo';

export const BLUR_M = 500;
export const WINDOW_S = 180;
export const BASELINE_MIN = 60;
export const CELL_DEG = 0.1;
export const MIN_PEOPLE = 3;
export const PING_EVERY_MS = 60_000;

export interface Ping { lat: number; lon: number }
export interface HeatCell { lat: number; lon: number; n: number; w: number }
export interface FeltMap { cells: HeatCell[]; total: number; radiusKm: number }

/** Random point within `meters` of the position (uniform over the disk); rounded to 4 decimals (~11 m). */
export function blur(lat: number, lon: number, rand: () => number = Math.random, meters = BLUR_M): Ping {
  const r = meters * Math.sqrt(rand()), a = rand() * 2 * Math.PI;
  const dLat = (r * Math.cos(a)) / 111_320, dLon = (r * Math.sin(a)) / (111_320 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  const round = (v: number) => Math.round(v * 1e4) / 1e4;
  let nl = lon + dLon; if (nl > 180) nl -= 360; if (nl < -180) nl += 360;
  return { lat: round(Math.max(-90, Math.min(90, lat + dLat))), lon: round(nl) };
}

/** Rough distance within which a quake of this magnitude is commonly felt (25 km at M3 … ~610 km at M7, ≤ 1500 km). */
export function feltRadiusKm(mag: number) {
  return Math.round(Math.min(1500, Math.max(25, 25 * Math.exp(0.8 * (mag - 3)))));
}

const cellOf = (p: Ping) => {
  const lat = Math.round(p.lat / CELL_DEG) * CELL_DEG, lon = Math.round(p.lon / CELL_DEG) * CELL_DEG;
  return { key: `${lat.toFixed(1)},${lon.toFixed(1)}`, lat: Number(lat.toFixed(1)), lon: Number(lon.toFixed(1)) };
};

/**
 * Builds the felt map for an epicentre from pings in the WINDOW_S after the event (`window`) and pings in the
 * BASELINE_MIN before it (`baseline`). A cell is kept when it has at least MIN_PEOPLE pings in the window and at
 * least 2 more than its usual rate for that length of time; `w` (0–1) is its surge relative to the strongest cell.
 */
export function buildFeltMap(epi: { lat: number; lon: number; mag: number }, window: Ping[], baseline: Ping[]): FeltMap {
  const radiusKm = feltRadiusKm(epi.mag);
  const near = (p: Ping) => distanceKm(epi.lat, epi.lon, p.lat, p.lon) <= radiusKm;
  const count = (list: Ping[]) => {
    const m = new Map<string, { lat: number; lon: number; n: number }>();
    for (const p of list) if (near(p)) { const c = cellOf(p); const e = m.get(c.key) ?? { lat: c.lat, lon: c.lon, n: 0 }; e.n++; m.set(c.key, e); }
    return m;
  };
  const now = count(window), before = count(baseline), scale = WINDOW_S / (BASELINE_MIN * 60);
  const kept: { lat: number; lon: number; n: number; surge: number }[] = [];
  for (const [k, c] of now) {
    const surge = c.n - (before.get(k)?.n ?? 0) * scale;
    if (c.n >= MIN_PEOPLE && surge >= 2) kept.push({ ...c, surge });
  }
  const top = Math.max(1, ...kept.map(c => c.surge));
  return {
    radiusKm,
    total: kept.reduce((s, c) => s + c.n, 0),
    cells: kept.sort((a, b) => b.surge - a.surge).map(c => ({ lat: c.lat, lon: c.lon, n: c.n, w: Math.round(Math.sqrt(c.surge / top) * 100) / 100 })),
  };
}
