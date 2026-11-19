// USGS "Did You Feel It?" (DYFI): community intensity for one USGS event, aggregated by USGS into ~10 km boxes.
// Read from the event's dyfi product (fdsnws event detail → products.dyfi[0].contents): the 10 km GeoJSON
// (dyfi_geo_10km.geojson) when published, else the text table (cdi_geo.txt). Used by GET /api/dyfi for the region view.
// USGS data is in the public domain; the app credits USGS where it is shown.

export interface DyfiCell {
  lat: number; lon: number;
  /** Community decimal intensity (CDI, on the MMI scale 1–10). */
  cdi: number;
  /** Responses in this box. */
  n: number;
  /** The box outline [lon, lat][] when USGS gives one. */
  ring?: [number, number][];
}
export interface Dyfi { responses: number; maxCdi: number | null; cells: DyfiCell[] }

/** The USGS event id of a sisma quake (its own id, or another agency's record merged into it), or null. */
export function usgsEventId(q: { id: string; otherIds?: string[] }): string | null {
  const id = [q.id, ...(q.otherIds ?? [])].find(i => i.startsWith('usgs:'));
  return id ? id.slice(5) : null;
}
export const isUsgsEventId = (v: string) => /^[a-z0-9]{4,24}$/i.test(v);

const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);
const ok = (c: DyfiCell) => Number.isFinite(c.lat) && Number.isFinite(c.lon) && Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180
  && Number.isFinite(c.cdi) && c.cdi >= 1 && c.cdi <= 10 && Number.isFinite(c.n) && c.n > 0;

function summary(cells: DyfiCell[], total?: number): Dyfi {
  return {
    responses: total && total > 0 ? total : cells.reduce((s, c) => s + c.n, 0),
    maxCdi: cells.length ? Math.max(...cells.map(c => c.cdi)) : null,
    cells,
  };
}

/** The dyfi_geo_10km.geojson FeatureCollection: one Polygon (the box) or Point per feature, with cdi and nresp. */
export function parseDyfiGeoJson(j: unknown): DyfiCell[] {
  const features = (j as { features?: unknown[] })?.features;
  if (!Array.isArray(features)) return [];
  const out: DyfiCell[] = [];
  for (const f of features as { geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> }[]) {
    const p = f.properties ?? {}, g = f.geometry;
    const cdi = num(p.cdi), n = num(p.nresp ?? p.no_of_responses ?? p.responses ?? p.numResp);
    let lat = num(p.lat ?? p.latitude), lon = num(p.lon ?? p.longitude), ring: [number, number][] | undefined;
    if (g?.type === 'Polygon' && Array.isArray(g.coordinates) && Array.isArray(g.coordinates[0])) {
      ring = (g.coordinates[0] as unknown[]).filter((c): c is [number, number] => Array.isArray(c) && c.length >= 2 && Number.isFinite(num(c[0])) && Number.isFinite(num(c[1])))
        .map(c => [num(c[0]), num(c[1])]);
      if (ring.length < 3) ring = undefined;
      else if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        const pts = ring.length > 3 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1] ? ring.slice(0, -1) : ring;
        lon = pts.reduce((s, c) => s + c[0], 0) / pts.length; lat = pts.reduce((s, c) => s + c[1], 0) / pts.length;
      }
    } else if (g?.type === 'Point' && Array.isArray(g.coordinates)) {
      lon = num(g.coordinates[0]); lat = num(g.coordinates[1]);
    }
    const c: DyfiCell = { lat, lon, cdi, n, ...(ring ? { ring } : {}) };
    if (ok(c)) out.push(c);
  }
  return out;
}

/** The cdi_geo.txt table: a header line, then "box,CDI,responses,distance,lat,lon,suspect?,…" rows. */
export function parseDyfiText(text: string): DyfiCell[] {
  const out: DyfiCell[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#') || /^\s*geocoded box/i.test(line)) continue;
    const f = line.split(',').map(s => s.trim());
    if (f.length < 6) continue;
    const c: DyfiCell = { cdi: num(f[1]), n: num(f[2]), lat: num(f[4]), lon: num(f[5]) };
    if (f[6] === '1') continue; // marked suspect by USGS
    if (ok(c)) out.push(c);
  }
  return out;
}

type Contents = Record<string, { url?: string }>;
/** Fetches and parses the DYFI 10 km data for a USGS event; null when there is none (or USGS can't be reached). */
export async function fetchDyfi(eventId: string, get: typeof fetch = fetch): Promise<Dyfi | null> {
  const detail = await get(`https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=${encodeURIComponent(eventId)}&format=geojson`, { next: { revalidate: 300 } } as RequestInit);
  if (!detail.ok) return null;
  const j = (await detail.json()) as { properties?: { felt?: number | null; products?: { dyfi?: { properties?: Record<string, string>; contents?: Contents }[] } } };
  const product = j.properties?.products?.dyfi?.[0];
  if (!product?.contents) return null;
  const total = num(product.properties?.['num-responses'] ?? product.properties?.numResp ?? j.properties?.felt);
  const geo = product.contents['dyfi_geo_10km.geojson']?.url;
  if (geo) {
    const r = await get(geo, { next: { revalidate: 300 } } as RequestInit);
    if (r.ok) {
      const cells = parseDyfiGeoJson(await r.json());
      if (cells.length) return summary(cells, total);
    }
  }
  const txt = product.contents['cdi_geo.txt']?.url;
  if (txt) {
    const r = await get(txt, { next: { revalidate: 300 } } as RequestInit);
    if (r.ok) return summary(parseDyfiText(await r.text()), total);
  }
  return summary([], total);
}
