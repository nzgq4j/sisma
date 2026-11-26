// Pacific Fire Ribbon: the USGS summary feeds turned into ribbon earthquakes. Server only (GET /api/science/ribbon).
//
// Source: the USGS Earthquake Hazards Program summary feeds for the past day, week or 30 days, all magnitudes: GeoJSON
// for the event fields, and the CSV version of the same feed for the location, depth and magnitude uncertainties (the
// GeoJSON feed doesn't carry them). Events are matched by their USGS id; an id seen twice keeps its latest update.
// Only events of type "earthquake" are kept (the feeds also list quarry blasts, explosions, ice quakes and landslides).
// Each earthquake is placed by its own latitude and longitude (lib/ribbon/transform.ts) and kept if it lies in the
// ribbon's corridor; its latitude, longitude, depth and id are passed on unchanged.
import { GROUPS, type GroupId, type Period, type RibbonQuake } from './shared';
import { inCorridor, toRibbon } from './transform';

const BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/';
const NAME: Record<Period, string> = { day: 'all_day', week: 'all_week', month: 'all_month' };
export const feedUrls = (p: Period) => ({ geojson: `${BASE}${NAME[p]}.geojson`, csv: `${BASE}${NAME[p]}.csv` });

interface Feature {
  id?: string;
  geometry?: { coordinates?: [number, number, number?] };
  properties?: Record<string, unknown>;
}
export interface FeedJson { metadata?: { generated?: number }; features?: Feature[] }

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null);

/** Splits CSV text into rows of fields (RFC 4180: quoted fields may hold commas, quotes and line breaks). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Uncertainties by event id from the CSV feed (columns found by name, not position). */
export function uncertainties(csv: string | null): Map<string, { hErr: number | null; dErr: number | null; magErr: number | null }> {
  const out = new Map<string, { hErr: number | null; dErr: number | null; magErr: number | null }>();
  if (!csv) return out;
  const [head, ...rows] = parseCsv(csv);
  if (!head) return out;
  const col = (n: string) => head.indexOf(n);
  const [id, h, d, m] = [col('id'), col('horizontalError'), col('depthError'), col('magError')];
  if (id < 0) return out;
  for (const r of rows) out.set(r[id], { hErr: h < 0 ? null : num(r[h]), dErr: d < 0 ? null : num(r[d]), magErr: m < 0 ? null : num(r[m]) });
  return out;
}

const groupIndex = (g: string) => GROUPS.indexOf(g as GroupId);

/** The earthquakes on the ribbon, with counts of what the feed held. */
export function ribbonQuakes(feed: FeedJson, csv: string | null): { quakes: RibbonQuake[]; counts: { feed: number; earthquakes: number; ribbon: number }; generated: number | null } {
  const features = feed.features ?? [];
  const errs = uncertainties(csv);
  const latest = new Map<string, Feature>();
  let earthquakes = 0;
  for (const f of features) {
    const p = f.properties ?? {};
    if (!f.id || !f.geometry?.coordinates) continue;
    if (p.type !== undefined && p.type !== 'earthquake') continue;
    const prev = latest.get(f.id);
    if (!prev) earthquakes++;
    if (!prev || (num(p.updated) ?? 0) > (num(prev.properties?.updated) ?? 0)) latest.set(f.id, f);
  }
  const quakes: RibbonQuake[] = [];
  for (const [id, f] of latest) {
    const [lon, lat, depth] = f.geometry!.coordinates!;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const pos = toRibbon(lat, lon);
    if (!pos || !inCorridor(pos)) continue;
    const p = f.properties ?? {};
    const e = errs.get(id);
    quakes.push({
      id, time: num(p.time) ?? 0, updated: num(p.updated) ?? num(p.time) ?? 0,
      lat, lon, depth: num(depth) ?? 0,
      mag: num(p.mag), magType: str(p.magType), place: str(p.place),
      status: str(p.status), net: str(p.net), sig: num(p.sig),
      felt: num(p.felt), cdi: num(p.cdi), mmi: num(p.mmi), alert: str(p.alert), tsunami: p.tsunami === 1,
      nst: num(p.nst), gap: num(p.gap), rms: num(p.rms), dmin: num(p.dmin),
      hErr: e?.hErr ?? null, dErr: e?.dErr ?? null, magErr: e?.magErr ?? null,
      url: str(p.url) ?? `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
      x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10,
      from: groupIndex(pos.from), to: groupIndex(pos.to),
    });
  }
  quakes.sort((a, b) => a.time - b.time);
  return { quakes, counts: { feed: features.length, earthquakes, ribbon: quakes.length }, generated: num(feed.metadata?.generated) };
}
