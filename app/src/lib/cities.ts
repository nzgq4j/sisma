// City names on the Mercator map once zoomed in to a region (components/dash/WorldMap.tsx), to help people place an
// earthquake. Data: Natural Earth 1:10m populated places (public domain), reduced by scripts/build-cities.mjs to
// public/data/cities.json — position, Natural Earth's MIN_ZOOM (the web-map zoom a place is first labelled at),
// population and the name in the app's 10 languages. Labels are placed most important first and never overlap.
// Also used on the server for the share card (lib/share-map.ts); the fetching hook is lib/use-cities.ts.

/** Web-map zoom from which city names are shown (a region, not the whole world). */
export const CITIES_FROM = 4;
/** A place is labelled from this much before Natural Earth's MIN_ZOOM. */
export const CITY_EARLY = 0.5;
/** At most this many names at once. */
export const MAX_LABELS = 40;

export interface CityData { langs: string[]; rows: (string | number)[][] }
export interface City { lon: number; lat: number; minZoom: number; pop: number; names: string[] }

export function parseCities(d: CityData): City[] {
  return d.rows.map(r => ({ lon: +r[0], lat: +r[1], minZoom: +r[2], pop: +r[3], names: r.slice(4).map(String) }));
}

const LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'id', 'tr'];
/** The name in the app's language, or the English one. */
export function cityName(c: City, locale: string): string {
  const i = LANGS.indexOf(locale);
  return (i > 0 && c.names[i]) || c.names[0];
}

export interface Label { x: number; y: number; text: string; w: number }
/** A screen rectangle: left, top, right, bottom. */
export type Box = [number, number, number, number];

/**
 * Which names to draw: cities already labelled at web-map zoom `zw` (MIN_ZOOM ≤ zw + CITY_EARLY), on screen, in order of
 * importance, each skipped if its dot and name would overlap one already placed. `at` gives a city's screen position
 * (or null when off screen); `measure` the width of a name in px; `blocked`: screen areas already taken (event markers).
 * The name goes right of the dot, or left of it when the right is taken or off screen. `k` scales the room around a
 * label (1: the map's 11 px names; 2: the share card's 22 px names).
 */
export function placeLabels(cities: City[], zw: number, locale: string, at: (c: City) => { x: number; y: number } | null,
  measure: (text: string) => number, view: { w: number; h: number }, max = MAX_LABELS, blocked: Box[] = [], k = 1): Label[] {
  const out: Label[] = [], boxes: Box[] = [...blocked];
  if (zw < CITIES_FROM) return out;
  for (const c of cities) {
    if (c.minZoom > zw + CITY_EARLY) break; // sorted by MIN_ZOOM
    const p = at(c);
    if (!p || p.x < 0 || p.y < 8 * k || p.x > view.w || p.y > view.h - 8 * k) continue;
    const text = cityName(c, locale), w = measure(text);
    const hits = (b: Box) => boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
    const rightBox: Box = [p.x - 4 * k, p.y - 8 * k, p.x + 7 * k + w, p.y + 8 * k], leftBox: Box = [p.x - 7 * k - w, p.y - 8 * k, p.x + 4 * k, p.y + 8 * k];
    const rightOk = rightBox[2] <= view.w - 2 * k && !hits(rightBox), leftOk = leftBox[0] >= 2 * k && !hits(leftBox);
    if (!rightOk && !leftOk) continue;
    boxes.push(rightOk ? rightBox : leftBox);
    out.push({ x: p.x, y: p.y, text, w: rightOk ? w : -w });
    if (out.length >= max) break;
  }
  return out;
}
