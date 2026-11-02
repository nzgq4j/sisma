import type { Quake } from './types';
import { splitPlace } from './region';

type Fetcher = (opts: { days: number; minMag: number }) => Promise<Quake[]>;

export const usgs: Fetcher = async ({ days, minMag }) => {
  const url = days <= 30 && minMag >= 2.5
    ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson'
    : 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time&minmagnitude=' + minMag +
      '&starttime=' + new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const res = await fetch(url, { next: { revalidate: 60 } });
  const j = await res.json();
  return j.features.filter((f: any) => f.properties.mag != null).map((f: any): Quake => {
    const p = f.properties, c = f.geometry.coordinates, sp = splitPlace(p.place ?? p.title ?? 'Unknown');
    return { id: 'usgs:' + f.id, source: 'usgs', mag: +p.mag, magType: p.magType, title: sp.title, region: sp.region, time: p.time,
      lon: c[0], lat: c[1], depthKm: Math.max(0, c[2] ?? 0), felt: p.felt ?? undefined, cdi: p.cdi ?? undefined, tsunami: p.tsunami === 1, url: p.url };
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
  return j.features.map((f: any): Quake => {
    const p = f.properties, c = f.geometry.coordinates;
    return { id: 'geonet:' + p.publicID, source: 'geonet', mag: +p.magnitude, title: p.locality, region: 'New Zealand', time: Date.parse(p.time),
      lon: c[0], lat: c[1], depthKm: Math.max(0, +p.depth || 0), mmi: p.mmi, tsunami: false, url: 'https://www.geonet.org.nz/earthquake/' + p.publicID };
  });
};

export const jma: Fetcher = async () => {
  const res = await fetch('https://www.jma.go.jp/bosai/quake/data/list.json', { next: { revalidate: 60 } });
  const list: any[] = await res.json();
  return list.filter(e => e.cod && e.mag && e.mag !== 'Ｍ不明').map((e): Quake => {
    const m = /([+-][\d.]+)([+-][\d.]+)([+-]\d+)?/.exec(e.cod) ?? [];
    return { id: 'jma:' + e.eid, source: 'jma', mag: parseFloat(e.mag), title: e.en_anm ?? e.anm, region: 'Japan', time: Date.parse(e.at),
      lat: parseFloat(m[1]), lon: parseFloat(m[2]), depthKm: m[3] ? Math.abs(parseInt(m[3], 10)) / 1000 : 0, tsunami: false,
      url: 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map' };
  }).filter(q => Number.isFinite(q.lat));
};

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export const SOURCES = { usgs, emsc, geonet, jma };
