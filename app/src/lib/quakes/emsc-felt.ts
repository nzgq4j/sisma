// EMSC felt reports ("testimonies", collected through the EMSC websites and the LastQuake app) for one EMSC event:
// seismicportal.eu/testimonies-ws/api/search?unids=[<unid>]&includeTestimonies=true answers with a zip holding
// <unid>.csv (with events.csv, the CC BY 4.0 licence and EMSC's instructions), one report per line under a
// "#longitude,latitude,time,source,iraw,icorr" header (older archives: <unid>.txt, "longitude,latitude,iraw,icorr").
// icorr is the intensity corrected after Bossu et al. 2016; columns are found by their header names.
// Reports are grouped here, on the server, into ~10 km cells (0.1°) with a count and a mean intensity, so the app never
// receives individual positions. Data © EMSC, CC BY 4.0: credited where shown. Used by GET /api/emsc-felt.
import { inflateRawSync } from 'node:zlib';

export interface EmscFeltCell { lat: number; lon: number; n: number; mmi: number }
export interface EmscFelt { reports: number; maxMmi: number | null; cells: EmscFeltCell[] }

/** The EMSC unid of a sisma quake (its own id, or an EMSC record merged into it), or null. */
export function emscUnid(q: { id: string; otherIds?: string[] }): string | null {
  const id = [q.id, ...(q.otherIds ?? [])].find(i => i.startsWith('emsc:'));
  return id ? id.slice(5) : null;
}
export const isEmscUnid = (v: string) => /^\d{8}_\d{7}$/.test(v);

/** The EMSC event page. */
export const emscEventPage = (unid: string) => `https://www.seismicportal.eu/eventdetails.html?unid=${encodeURIComponent(unid)}`;

/** Files in a zip archive (stored or deflated), read through its central directory. */
export function unzip(buf: Uint8Array): Record<string, string> {
  const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65_535); i--) if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not a zip archive');
  const count = b.readUInt16LE(eocd + 10);
  let p = b.readUInt32LE(eocd + 16);
  const out: Record<string, string> = {};
  for (let k = 0; k < count; k++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip directory');
    const method = b.readUInt16LE(p + 10), size = b.readUInt32LE(p + 20);
    const nameLen = b.readUInt16LE(p + 28), extraLen = b.readUInt16LE(p + 30), commentLen = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42), name = b.toString('utf8', p + 46, p + 46 + nameLen);
    if (b.readUInt32LE(local) !== 0x04034b50) throw new Error('bad zip entry');
    const start = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28);
    const data = b.subarray(start, start + size);
    if (method === 0) out[name] = data.toString('utf8');
    else if (method === 8) out[name] = inflateRawSync(data).toString('utf8');
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** Reports from the CSV, grouped into 0.1° cells. Columns come from the "#longitude,latitude,…" header line. */
export function parseEmscFelt(text: string): EmscFelt {
  const cells = new Map<string, { lat: number; lon: number; n: number; sum: number }>();
  let reports = 0;
  let col = { lon: 0, lat: 1, iraw: 2, icorr: 3 };
  for (const line of text.split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    if (s.startsWith('#')) {
      const names = s.slice(1).split(',').map(x => x.trim().toLowerCase());
      if (names.includes('longitude') && names.includes('latitude')) {
        col = { lon: names.indexOf('longitude'), lat: names.indexOf('latitude'), iraw: names.indexOf('iraw'), icorr: names.indexOf('icorr') };
      }
      continue;
    }
    const f = s.split(',');
    const lon = Number(f[col.lon]), lat = Number(f[col.lat]);
    const icorr = col.icorr >= 0 ? Number(f[col.icorr]) : NaN, iraw = col.iraw >= 0 ? Number(f[col.iraw]) : NaN;
    const mmi = Number.isFinite(icorr) ? icorr : iraw;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !Number.isFinite(mmi) || mmi < 1 || mmi > 12) continue;
    reports++;
    const clat = Math.round(lat * 10) / 10, clon = Math.round(lon * 10) / 10, key = `${clat},${clon}`;
    const c = cells.get(key) ?? { lat: clat, lon: clon, n: 0, sum: 0 };
    c.n++; c.sum += Math.min(10, mmi); cells.set(key, c);
  }
  const out = [...cells.values()].map(c => ({ lat: c.lat, lon: c.lon, n: c.n, mmi: Math.round((c.sum / c.n) * 10) / 10 }));
  return { reports, maxMmi: out.length ? Math.max(...out.map(c => c.mmi)) : null, cells: out };
}

/** Fetches and groups the felt reports of an EMSC event; an empty result when there are none. */
export async function fetchEmscFelt(unid: string, get: typeof fetch = fetch): Promise<EmscFelt> {
  const r = await get(`https://www.seismicportal.eu/testimonies-ws/api/search?unids=[${unid}]&includeTestimonies=true`, { next: { revalidate: 300 } } as RequestInit);
  if (r.status === 204 || r.status === 404) return { reports: 0, maxMmi: null, cells: [] };
  if (!r.ok) throw new Error(`EMSC ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) return { reports: 0, maxMmi: null, cells: [] }; // no archive: no reports
  const files = unzip(buf);
  const name = Object.keys(files).find(k => k === `${unid}.csv` || k === `${unid}.txt`);
  const text = name ? files[name] : '';
  return parseEmscFelt(text);
}
