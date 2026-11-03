// Regional map for the share card (api/share-card), drawn on the server as an SVG string: world-atlas 50m countries,
// optional plate boundaries and lakes, nearby events as magnitude-coloured dots, the event in focus as a ringed
// marker, and a scale bar. Mercator centred on the event, `span` degrees of longitude across the width.
import { geoMercator, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { GeoPermissibleObjects } from 'd3-geo';
import world from 'world-atlas/countries-50m.json';
import { MAG_MARKER_LIGHT, magIndex } from './theme';
import type { Quake } from './quakes/types';
import { KM_PER_MI, type Units } from './units';

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

export function shareMapSvg(opts: {
  q: Quake; nearby: Quake[]; w: number; h: number; span: number; units: Units; colors: ShareMapColors;
  plates?: GeoPermissibleObjects | null; lakes?: GeoPermissibleObjects | null; font?: string;
}): string {
  const { q, nearby, w, h, span, units, colors: c } = opts;
  const s = (w * 180) / (Math.PI * span);
  const proj = geoMercator().rotate([-q.lon, 0]).center([0, q.lat]).scale(s).translate([w / 2, h / 2]).clipExtent([[-20, -20], [w + 20, h + 20]]);
  const path = geoPath(proj);
  const d = (o: GeoPermissibleObjects | null | undefined) => (o ? path(o) ?? '' : '');

  const dots = nearby
    .filter(n => n.id !== q.id)
    .map(n => ({ n, xy: proj([n.lon, n.lat]) }))
    .filter((x): x is { n: Quake; xy: [number, number] } => !!x.xy && x.xy[0] > -10 && x.xy[0] < w + 10 && x.xy[1] > -10 && x.xy[1] < h + 10)
    .sort((a, b) => a.n.mag - b.n.mag)
    .map(({ n, xy }) => `<circle cx="${xy[0].toFixed(1)}" cy="${xy[1].toFixed(1)}" r="${Math.max(7, (n.mag - 1.6) * 5).toFixed(1)}" fill="${MAG_MARKER_LIGHT[magIndex(n.mag)]}" fill-opacity="0.9" stroke="${c.surface}" stroke-width="2"/>`)
    .join('');

  const [fx, fy] = proj([q.lon, q.lat]) ?? [w / 2, h / 2];
  const mc = MAG_MARKER_LIGHT[magIndex(q.mag)]; // the card is light, like the light-mode map
  // Same style as the app: the event's dot with a ring just outside it, scaled with the magnitude, plus a soft halo.
  const fr = Math.max(7, (q.mag - 1.6) * 5), ring = fr + 10;
  const marker = `<g transform="translate(${fx.toFixed(1)},${fy.toFixed(1)})">
<circle r="${ring + 14}" fill="none" stroke="${mc}" stroke-opacity="0.35" stroke-width="6"/>
<circle r="${fr}" fill="${mc}" stroke="${c.surface}" stroke-width="2"/>
<circle r="${ring}" fill="none" stroke="${c.ink}" stroke-width="6"/></g>`;

  // Scale bar: Mercator px per km at this latitude.
  const pxPerKm = (s * Math.PI / 180) / (111.32 * Math.cos((q.lat * Math.PI) / 180));
  const pxPerUnit = units === 'mi' ? pxPerKm * KM_PER_MI : pxPerKm;
  const len = niceScale(pxPerUnit, 180), barW = len * pxPerUnit;
  const bx = 32, by = h - 34;
  const font = opts.font ?? 'sans-serif';
  const scale = `<g><rect x="${bx - 14}" y="${by - 42}" width="${barW + 28}" height="62" rx="16" fill="${c.surface}" fill-opacity="0.85"/>
<path d="M${bx} ${by - 8}V${by}H${(bx + barW).toFixed(1)}V${by - 8}" fill="none" stroke="${c.ink}" stroke-width="4" stroke-linejoin="round"/>
<text x="${bx}" y="${by - 16}" font-family="${esc(font)}" font-size="22" font-weight="700" fill="${c.ink}">${len} ${units}</text></g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${c.sea}"/>
<path d="${d(LAND)}" fill="${c.land}"/>
${opts.lakes ? `<path d="${d(opts.lakes)}" fill="${c.sea}" stroke="${c.line}" stroke-width="1.5"/>` : ''}
<path d="${d(BORDERS)}" fill="none" stroke="${c.line}" stroke-width="2.5" stroke-linejoin="round"/>
${opts.plates ? `<path d="${d(opts.plates)}" fill="none" stroke="${c.plate}" stroke-opacity="0.55" stroke-width="3.5" stroke-dasharray="12 9"/>` : ''}
${dots}${marker}${scale}</svg>`;
}
