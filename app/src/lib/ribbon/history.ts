// Pacific Fire Ribbon, historical playback (step 5): the date ranges the history API accepts and how it splits them
// into USGS catalogue searches. Pure functions, shared by GET /api/science/ribbon/history and the page.
//
// Source: the USGS ComCat event web service (FDSN event API, https://earthquake.usgs.gov/fdsnws/event/1/), which
// refuses a search matching more than 20,000 events. Measured on 27 November 2026 (worldwide, earthquakes only): about
// 9,600 events of all magnitudes in one month, 1,900 of M2.5+ in one month, 29,500 of M2.5+ in a year and 7,800 of
// M4.5+ in a year; about half fall on the ribbon. So each magnitude filter has a longest range, and each range is
// searched in calendar-month (or calendar-quarter) pieces that stay under the limit; a piece that still matches too
// many is split in two.
import type { MinMag } from './shared';

/** Longest range (days, inclusive) per minimum magnitude. */
export const MAX_SPAN_DAYS: Record<MinMag, number> = { 0: 31, 2.5: 366, 4.5: 1096 };
/** Earliest start date offered (the catalogue goes back further, but is far less complete). */
export const HISTORY_EARLIEST = '1970-01-01';
/** Most earthquakes one history response may carry (keeps the response well under the hosting limit of 4.5 MB). */
export const HISTORY_MAX_ROWS = 17_000;
/** Search piece length in months, per minimum magnitude. */
const PIECE_MONTHS: Record<MinMag, number> = { 0: 1, 2.5: 1, 4.5: 3 };
const DAY = 86_400_000;

export type RangeError = 'bad_date' | 'order' | 'future' | 'too_early' | 'too_long';

/** Parses YYYY-MM-DD as the start of that day, UTC; null when not a real date. */
export function utcDay(s: string | null): number | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === s ? t : null;
}
export const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/**
 * Checks a range of whole UTC days, start to end inclusive, and returns the search pieces: [from, to) in ms, aligned
 * to calendar months (or quarters), the last one ending at the end of the range or now, whichever is earlier.
 */
export function historyPieces(start: string | null, end: string | null, min: MinMag, now: number):
  { ok: true; from: number; to: number; days: number; pieces: [number, number][] } | { ok: false; error: RangeError } {
  const a = utcDay(start), b = utcDay(end);
  if (a === null || b === null) return { ok: false, error: 'bad_date' };
  if (b < a) return { ok: false, error: 'order' };
  if (a > now) return { ok: false, error: 'future' };
  if (a < utcDay(HISTORY_EARLIEST)!) return { ok: false, error: 'too_early' };
  const days = Math.round((b - a) / DAY) + 1;
  if (days > MAX_SPAN_DAYS[min]) return { ok: false, error: 'too_long' };
  // A range reaching today ends at now, rounded up to 10 minutes so the newest piece can be cached briefly.
  const to = Math.min(b + DAY, Math.ceil(now / 600_000) * 600_000);
  const pieces: [number, number][] = [];
  const step = PIECE_MONTHS[min];
  let p = a;
  while (p < to) {
    const d = new Date(p);
    const m0 = Math.floor(d.getUTCMonth() / step) * step;
    const next = Date.UTC(d.getUTCFullYear(), m0 + step, 1);
    pieces.push([p, Math.min(next, to)]);
    p = next;
  }
  return { ok: true, from: a, to, days, pieces };
}

/** A piece that has ended more than two days ago is unlikely to change much; newer ones are checked again hourly. */
export const pieceIsSettled = (to: number, now: number) => to < now - 2 * DAY;

const FDSN = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
/** A time for the search: UTC, whole seconds, no time zone suffix (as the service documents), rounded up. */
const fdsnTime = (t: number) => new Date(Math.ceil(t / 1000) * 1000).toISOString().slice(0, 19);
/** The USGS searches for one piece: GeoJSON for the event fields and CSV for the uncertainties, as for the live feeds. */
export function fdsnUrls(from: number, to: number, min: MinMag) {
  const q = new URLSearchParams({
    starttime: fdsnTime(from), endtime: fdsnTime(to),
    eventtype: 'earthquake', orderby: 'time-asc', ...(min > 0 ? { minmagnitude: String(min) } : {}),
  });
  return { geojson: `${FDSN}?format=geojson&${q}`, csv: `${FDSN}?format=csv&${q}` };
}

/** Event page on the USGS site (history rows leave the link out to keep the response small; the page puts it back). */
export const usgsEventUrl = (id: string) => `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`;

/** Playback speeds: catalogue time shown per second of playback. */
export const SPEEDS_MS = [3_600_000, 6 * 3_600_000, DAY, 7 * DAY, 30 * DAY] as const;
/** The speed that plays a range in about 30 seconds. */
export const defaultSpeed = (rangeMs: number) =>
  SPEEDS_MS.reduce((best, s) => (Math.abs(Math.log(rangeMs / s / 30)) < Math.abs(Math.log(rangeMs / best / 30)) ? s : best), SPEEDS_MS[2] as number);

/** Depth filters for playback (km): all, shallow, intermediate, deep. */
export const DEPTH_FILTERS = { all: [-Infinity, Infinity], shallow: [-Infinity, 70], intermediate: [70, 300], deep: [300, Infinity] } as const;
export type DepthFilter = keyof typeof DEPTH_FILTERS;
export const inDepth = (depth: number, f: DepthFilter) => depth >= DEPTH_FILTERS[f][0] && depth < DEPTH_FILTERS[f][1];
