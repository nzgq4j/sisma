// Japan Meteorological Agency tsunami warnings, advisories and forecasts: www.jma.go.jp/bosai/tsunami/data/list.json lists
// the bulletins (eid = the earthquake's JMA event id, the same id as sisma's jma: quakes; json = the detail file). The detail
// gives a level per coastal area (Body.Tsunami.Forecast.Item[].Category.Kind, with English names) and the earthquake.
// Formats checked against the live files in November 2026.
import { worse, type TsunamiArea, type TsunamiLevel, type TsunamiMessage } from './types';

export const JMA_LIST = 'https://www.jma.go.jp/bosai/tsunami/data/list.json';
export const jmaDetailUrl = (file: string) => `https://www.jma.go.jp/bosai/tsunami/data/${file}`;
/** The public tsunami page linked from the app (the bulletins themselves are JSON). */
export const JMA_PAGE = 'https://www.jma.go.jp/bosai/map.html#contents=tsunami&lang=en';

export interface JmaListEntry { eid: string; json: string; ift?: string; rdt?: string; en_ttl?: string; ttl?: string }

/** Entries of list.json with a detail file, newest first as published. */
export function parseJmaList(data: unknown): JmaListEntry[] {
  if (!Array.isArray(data)) return [];
  return data.filter((e): e is JmaListEntry => !!e && typeof e === 'object' && typeof (e as JmaListEntry).eid === 'string'
    && typeof (e as JmaListEntry).json === 'string' && /^[\w.-]+\.json$/.test((e as JmaListEntry).json));
}

/** A JMA kind (English name, e.g. "Major Tsunami Warning", "Tsunami Advisory", "No Tsunami risk") to a level. */
export function jmaLevel(enName: string): TsunamiLevel {
  const n = enName.toLowerCase();
  if (n.includes('major')) return 'major_warning';
  if (n.includes('warning')) return 'warning';
  if (n.includes('advisory')) return 'advisory';
  if (n.includes('forecast')) return 'forecast';
  return 'none';
}

/** ISO 6709 coordinate as JMA writes it ("+35.0+142.2-10000/": latitude, longitude, depth in metres). */
export function jmaCoordinate(s: string): { lat: number; lon: number } | null {
  const m = s.match(/^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)/);
  return m ? { lat: +m[1], lon: +m[2] } : null;
}

interface JmaDetail {
  Head?: { Title?: string; enTitle?: string; ReportDateTime?: string; ValidDateTime?: string; EventID?: string; InfoType?: string };
  Body?: {
    Tsunami?: { Forecast?: { Item?: { Area?: { Name?: string; enName?: string }; Category?: { Kind?: { Name?: string; enName?: string } } }[] } };
    Earthquake?: { OriginTime?: string; Hypocenter?: { Area?: { Name?: string; enName?: string; Coordinate?: string } }; Magnitude?: string }[];
  };
}

/** One detail file. InfoType 取消 ("cancellation") withdraws the bulletin. */
export function parseJmaDetail(data: unknown, file: string): TsunamiMessage | null {
  const d = data as JmaDetail;
  const head = d?.Head, eid = head?.EventID;
  const issued = Date.parse(head?.ReportDateTime ?? '');
  if (!eid || !Number.isFinite(issued)) return null;
  const areas: TsunamiArea[] = (d.Body?.Tsunami?.Forecast?.Item ?? []).map(it => ({
    name: it.Area?.enName || it.Area?.Name || '', level: jmaLevel(it.Category?.Kind?.enName ?? ''),
  })).filter(a => a.name);
  const level = areas.reduce<TsunamiLevel>((w, a) => worse(w, a.level), 'none');
  const eq = d.Body?.Earthquake?.[0];
  const pos = jmaCoordinate(eq?.Hypocenter?.Area?.Coordinate ?? '');
  const origin = Date.parse(eq?.OriginTime ?? ''), valid = Date.parse(head?.ValidDateTime ?? ''), mag = Number(eq?.Magnitude);
  return {
    id: `jma:${file.replace(/\.json$/, '')}`, center: 'JMA', incident: `jma:${eid}`, level, cancelled: head?.InfoType === '取消',
    title: head?.enTitle || head?.Title || '', issued, expires: Number.isFinite(valid) ? valid : null,
    origin: Number.isFinite(origin) ? origin : null, lat: pos?.lat ?? null, lon: pos?.lon ?? null, mag: Number.isFinite(mag) && mag > 0 ? mag : null,
    place: eq?.Hypocenter?.Area?.enName || eq?.Hypocenter?.Area?.Name || '', areas, url: JMA_PAGE,
  };
}
