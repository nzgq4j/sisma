// Regional map for the share card (api/share-card), drawn on the server as an SVG string: world-atlas 50m countries,
// optional plate boundaries and lakes, felt cells (lib/share-felt.ts, styled as in the region view), nearby events as
// magnitude-coloured dots, the event in focus as a ringed marker, and a scale bar. Mercator centred on the event, `span` degrees of longitude across the width.
import { geoMercator, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { GeoPermissibleObjects } from 'd3-geo';
import world from 'world-atlas/countries-50m.json';
import { MAG_MARKER_LIGHT, magIndex } from './theme';
import { shareGrid, type ShareFelt } from './share-felt';
import { FELT_CELL_DEG, feltColor } from './felt-grid';
import type { Quake } from './quakes/types';
import { KM_PER_MI, type Units } from './units';
import { placeLabels, type Box, type City, type Label } from './cities';
import { emWidth } from './share-text';

const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const LAND = feature(topo, topo.objects.countries);
const BORDERS = mesh(topo, topo.objects.countries);

export interface ShareMapColors { sea: string; land: string; line: string; plate: string; ink: string; surface: string }

/** A round distance for a scale bar about `target` px long. */
export function niceScale(pxPerUnit: number, target = 200): number {
  const raw = target / pxPerUnit, p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map(f => f * p).reduce((best, v) => (Math.abs(v - raw) < Math.abs(best - raw) ? v : best));
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * The scale bar (Mercator px per km at the event's latitude): its length in units, its width in px, and where it is
 * drawn (bar from (bx, by) to the right; the label sits above it, baseline at by − 16, 22 px bold).
 */
export function shareMapScale({ q, w, h, span, units }: { q: Pick<Quake, 'lat'>; w: number; h: number; span: number; units: Units }) {
  const s = (w * 180) / (Math.PI * span);
  const pxPerKm = (s * Math.PI / 180) / (111.32 * Math.cos((q.lat * Math.PI) / 180));
  const pxPerUnit = units === 'mi' ? pxPerKm * KM_PER_MI : pxPerKm;
  const len = niceScale(pxPerUnit, 180);
  return { len, barW: len * pxPerUnit, bx: 32, by: h - 34, label: `${len} ${units}` };
}

/** The card map's projection: Mercator centred on the event, `span` degrees of longitude across the width. */
function cardProjection(q: Pick<Quake, 'lat' | 'lon'>, w: number, h: number, span: number) {
  const s = (w * 180) / (Math.PI * span);
  return { s, proj: geoMercator().rotate([-q.lon, 0]).center([0, q.lat]).scale(s).translate([w / 2, h / 2]).clipExtent([[-20, -20], [w + 20, h + 20]]) };
}

/** City names on the card: twice the map's size (the card is about twice the size it is seen at). */
export const CARD_CITY = { font: 22, dot: 5, gap: 12, max: 16 } as const;

/** Radius of an event's dot on the card map (the event in focus adds its ring and halo, see shareMapSvg). */
const dotR = (mag: number) => Math.max(7, (mag - 1.6) * 5);

/**
 * The city names to draw on the card map (lib/cities.ts): the places the region view would name at the same scale,
 * in the card's language, clear of the events and of `blocked` (the card's scale bar, legend and pills).
 * `w` of a label is negative when the name sits left of its dot.
 */
export function shareCityLabels(opts: { q: Quake; nearby: Quake[]; w: number; h: number; span: number; cities: City[]; locale: string; blocked?: Box[] }): Label[] {
  const { q, nearby, w, h, span, cities, locale } = opts;
  const { s, proj } = cardProjection(q, w, h, span);
  // Web-map zoom of the card's scale, one step less because the card is seen at about half its pixel size.
  const zw = Math.log2((2 * Math.PI * s) / 256) - 1;
  const blocked: Box[] = [...(opts.blocked ?? [])];
  for (const n of nearby) {
    const p = proj([n.lon, n.lat]); if (!p) continue;
    const r = n.id === q.id ? dotR(n.mag) + 30 : dotR(n.mag) + 4; // the event in focus: its ring and halo
    blocked.push([p[0] - r, p[1] - r, p[0] + r, p[1] + r]);
  }
  if (!nearby.some(n => n.id === q.id)) { const r = dotR(q.mag) + 30; blocked.push([w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r]); }
  const at = (c: City) => { const p = proj([c.lon, c.lat]); return p ? { x: p[0], y: p[1] } : null; };
  // Estimated width (the server has no text measurement), with a little room so names never touch.
  const measure = (t: string) => emWidth(t) * CARD_CITY.font * 1.08;
  return placeLabels(cities, zw, locale, at, measure, { w, h }, CARD_CITY.max, blocked, 2);
}

export function shareMapSvg(opts: {
  q: Quake; nearby: Quake[]; w: number; h: number; span: number; units: Units; colors: ShareMapColors;
  plates?: GeoPermissibleObjects | null; lakes?: GeoPermissibleObjects | null; font?: string;
  /** false: leave the scale bar's text out (the share card draws it itself with its own font, see shareMapScale). */
  scaleText?: boolean;
  /** Felt sources, drawn under the events as one grid of intensity-coloured cells. */
  felt?: ShareFelt | null;
}): string {
  const { q, nearby, w, h, span, units, colors: c } = opts;
  const { proj } = cardProjection(q, w, h, span);
  const path = geoPath(proj);
  const d = (o: GeoPermissibleObjects | null | undefined) => (o ? path(o) ?? '' : '');

  const dots = nearby
    .filter(n => n.id !== q.id)
    .map(n => ({ n, xy: proj([n.lon, n.lat]) }))
    .filter((x): x is { n: Quake; xy: [number, number] } => !!x.xy && x.xy[0] > -10 && x.xy[0] < w + 10 && x.xy[1] > -10 && x.xy[1] < h + 10)
    .sort((a, b) => a.n.mag - b.n.mag)
    .map(({ n, xy }) => `<circle cx="${xy[0].toFixed(1)}" cy="${xy[1].toFixed(1)}" r="${dotR(n.mag).toFixed(1)}" fill="${MAG_MARKER_LIGHT[magIndex(n.mag)]}" fill-opacity="0.9" stroke="${c.surface}" stroke-width="2"/>`)
    .join('');

  const felt = feltSvg(opts.felt, proj, w, h);

  const [fx, fy] = proj([q.lon, q.lat]) ?? [w / 2, h / 2];
  const mc = MAG_MARKER_LIGHT[magIndex(q.mag)]; // the card is light, like the light-mode map
  // Same style as the app: the event's dot with a ring just outside it, scaled with the magnitude, plus a soft halo.
  const fr = dotR(q.mag), ring = fr + 10;
  const marker = `<g transform="translate(${fx.toFixed(1)},${fy.toFixed(1)})">
<circle r="${ring + 14}" fill="none" stroke="${mc}" stroke-opacity="0.35" stroke-width="6"/>
<circle r="${fr}" fill="${mc}" stroke="${c.surface}" stroke-width="2"/>
<circle r="${ring}" fill="none" stroke="${c.ink}" stroke-width="6"/></g>`;

  const { len, barW, bx, by } = shareMapScale({ q, w, h, span, units });
  const font = opts.font ?? 'sans-serif';
  const scale = `<g><rect x="${bx - 14}" y="${by - 42}" width="${barW + 28}" height="62" rx="16" fill="${c.surface}" fill-opacity="0.85"/>
<path d="M${bx} ${by - 8}V${by}H${(bx + barW).toFixed(1)}V${by - 8}" fill="none" stroke="${c.ink}" stroke-width="4" stroke-linejoin="round"/>
${opts.scaleText === false ? '' : `<text x="${bx}" y="${by - 16}" font-family="${esc(font)}" font-size="22" font-weight="700" fill="${c.ink}">${len} ${units}</text>`}</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${c.sea}"/>
<path d="${d(LAND)}" fill="${c.land}"/>
${opts.lakes ? `<path d="${d(opts.lakes)}" fill="${c.sea}" stroke="${c.line}" stroke-width="1.5"/>` : ''}
<path d="${d(BORDERS)}" fill="none" stroke="${c.line}" stroke-width="2.5" stroke-linejoin="round"/>
${opts.plates ? `<path d="${d(opts.plates)}" fill="none" stroke="${c.plate}" stroke-opacity="0.55" stroke-width="3.5" stroke-dasharray="12 9"/>` : ''}
${felt}${dots}${marker}${scale}</svg>`;
}

/** The felt cells as SVG, in card pixels: all sources merged (lib/felt-grid.ts), one style as in the region view. */
function feltSvg(f: ShareFelt | null | undefined, proj: (p: [number, number]) => [number, number] | null, w: number, h: number): string {
  if (!f) return '';
  const n = (v: number) => v.toFixed(1), d = FELT_CELL_DEG / 2, min = 12;
  const cells = shareGrid(f).flatMap(c => {
    const a = proj([c.lon - d, Math.min(89, c.lat + d)]), b = proj([c.lon + d, Math.max(-89, c.lat - d)]), m = proj([c.lon, c.lat]);
    if (!a || !b || !m || m[0] < -40 || m[0] > w + 40 || m[1] < -40 || m[1] > h + 40) return [];
    const cw = Math.max(min, Math.abs(b[0] - a[0])), ch = Math.max(min, Math.abs(b[1] - a[1]));
    return [`<rect x="${n(m[0] - cw / 2)}" y="${n(m[1] - ch / 2)}" width="${n(cw)}" height="${n(ch)}" rx="${n(Math.min(cw, ch) * 0.2)}" fill="${feltColor(c.mmi)}"/>`];
  });
  return cells.length ? `<g opacity="0.72">${cells.join('')}</g>` : '';
}
