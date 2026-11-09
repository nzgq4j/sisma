import type { Quake } from './types';
import { splitPlace } from './region';
import { reviewStatus } from './status';

type Fetcher = (opts: { days: number; minMag: number }) => Promise<Quake[]>;

export const usgs: Fetcher = async ({ days, minMag }) => {
  const url = days <= 30 && minMag >= 2.5
    ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson'
    : 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time&minmagnitude=' + minMag +
      '&starttime=' + new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const res = await fetch(url, { next: { revalidate: 60 } });
  const j = await res.json();
  return j.features.filter((f: any) => f.properties.mag != null && reviewStatus('usgs', (f as { properties: { status?: string } }).properties.status) !== null).map((f: any): Quake => {
    const p = f.properties, c = f.geometry.coordinates, sp = splitPlace(p.place ?? p.title ?? 'Unknown');
    return { id: 'usgs:' + f.id, source: 'usgs', mag: +p.mag, magType: p.magType, title: sp.title, region: sp.region, time: p.time,
      lon: c[0], lat: c[1], depthKm: Math.max(0, c[2] ?? 0), felt: p.felt ?? undefined, cdi: p.cdi ?? undefined, tsunami: p.tsunami === 1, url: p.url,
      status: reviewStatus('usgs', p.status) ?? undefined };
  });
};

export const emsc: Fetcher = async ({ days, minMag }) => {
  const url = 'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=2000&minmag=' + minMag +
    '&start=' + new Date(Date.now() - days * 864e5).toISOString().slice(0, 19);
  const res = await fetch(url, { next: { revalidate: 60 } });
  const j = await res.json();
  return j.features.map((f: any): Quake => {
    const p = f.properties, region = String(p.flynn_region ?? 'Unknown');
    return { id: 'emsc:' + (p.unid ?? f.id), source: 'emsc', mag: +p.mag, magType: p.magtype, title: region, region: titleCase(region),
      time: Date.parse(p.time), lat: +p.lat, lon: +p.lon, depthKm: Math.max(0, +p.depth || 0), tsunami: false,
      url: 'https://www.seismicportal.eu/eventdetails.html?unid=' + (p.unid ?? f.id) };
  });
};

export const geonet: Fetcher = async () => {
  const res = await fetch('https://api.geonet.org.nz/quake?MMI=3', { headers: { Accept: 'application/vnd.geo+json;version=2' }, next: { revalidate: 60 } });
  const j = await res.json();
  return j.features.filter((f: { properties: { quality?: string } }) => reviewStatus('geonet', f.properties.quality) !== null).map((f: any): Quake => {
    const p = f.properties, c = f.geometry.coordinates;
    return { id: 'geonet:' + p.publicID, source: 'geonet', mag: +p.magnitude, title: p.locality, region: 'New Zealand', time: Date.parse(p.time),
      lon: c[0], lat: c[1], depthKm: Math.max(0, +p.depth || 0), mmi: p.mmi, tsunami: false, url: 'https://www.geonet.org.nz/earthquake/' + p.publicID,
      status: reviewStatus('geonet', p.quality) ?? undefined };
  });
};

/** ISO 6709 angle as JMA writes it: decimal degrees (+35.7) or degrees + minutes (+3543.3 = 35°43.3′). */
function iso6709Angle(raw: string, maxDeg: number): number {
  const v = parseFloat(raw);
  if (!Number.isFinite(v) || Math.abs(v) <= maxDeg) return v;
  const a = Math.abs(v), deg = Math.trunc(a / 100);
  return Math.sign(v) * (deg + (a - deg * 100) / 60);
}

/** Parses JMA's `cod` field ("+35.7+140.7-10000/" or "+3543.3+14042.9-10000/") into degrees and km. */
export function parseJmaCod(cod: string): { lat: number; lon: number; depthKm: number } | null {
  const m = /([+-][\d.]+)([+-][\d.]+)([+-]\d+)?/.exec(cod);
  if (!m) return null;
  const lat = iso6709Angle(m[1], 90), lon = iso6709Angle(m[2], 180);
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null;
  return { lat, lon, depthKm: m[3] ? Math.abs(parseInt(m[3], 10)) / 1000 : 0 };
}

/**
 * Japan and its seas (Hokkaido and the southern Kurils to Okinotorishima, Yonaguni to Minamitorishima's waters): where
 * JMA's own network locates earthquakes. JMA's list also carries large earthquakes elsewhere (e.g. "Western China"), with
 * rough coordinates and no depth; those are left to USGS and EMSC, which locate them properly.
 */
export const inJapanArea = (lat: number, lon: number) => lat >= 20 && lat <= 46.5 && lon >= 122 && lon <= 154;

export const jma: Fetcher = async () => {
  const res = await fetch('https://www.jma.go.jp/bosai/quake/data/list.json', { next: { revalidate: 60 } });
  const list: any[] = await res.json();
  // The list holds every bulletin for an event (newest first); keep only the latest one per event id.
  const seen = new Set<string>();
  return list.filter(e => e.cod && e.mag && e.mag !== 'Ｍ不明').flatMap((e): Quake[] => {
    const pos = parseJmaCod(e.cod);
    if (!pos || seen.has(e.eid) || !inJapanArea(pos.lat, pos.lon)) return [];
    seen.add(e.eid);
    return [{ id: 'jma:' + e.eid, source: 'jma', mag: parseFloat(e.mag), title: e.en_anm ?? e.anm, region: 'Japan', time: Date.parse(e.at),
      ...pos, tsunami: false, url: 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map' }];
  });
};

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export const SOURCES = { usgs, emsc, geonet, jma };
