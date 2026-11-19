// Regional map for the share card (api/share-card), drawn on the server as an SVG string: world-atlas 50m countries,
// optional plate boundaries and lakes, felt layers (lib/share-felt.ts, styled as in the region view), nearby events as
// magnitude-coloured dots, the event in focus as a ringed marker, and a scale bar. Mercator centred on the event, `span` degrees of longitude across the width.
import { geoMercator, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { GeoPermissibleObjects } from 'd3-geo';
import world from 'world-atlas/countries-50m.json';
import { HEAT_COLORS, MAG_MARKER_LIGHT, MMI_COLORS, magIndex } from './theme';
import type { ShareFelt } from './share-felt';
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

export function shareMapSvg(opts: {
  q: Quake; nearby: Quake[]; w: number; h: number; span: number; units: Units; colors: ShareMapColors;
  plates?: GeoPermissibleObjects | null; lakes?: GeoPermissibleObjects | null; font?: string;
  /** false: leave the scale bar's text out (the share card draws it itself with its own font, see shareMapScale). */
  scaleText?: boolean;
  /** Felt layers drawn under the events: USGS boxes, the automatic felt map, sisma reports and EMSC dots. */
  felt?: ShareFelt | null;
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

  const felt = feltSvg(opts.felt, proj, w, h, c.surface);

  const [fx, fy] = proj([q.lon, q.lat]) ?? [w / 2, h / 2];
  const mc = MAG_MARKER_LIGHT[magIndex(q.mag)]; // the card is light, like the light-mode map
  // Same style as the app: the event's dot with a ring just outside it, scaled with the magnitude, plus a soft halo.
  const fr = Math.max(7, (q.mag - 1.6) * 5), ring = fr + 10;
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

const mmiColor = (v: number) => MMI_COLORS[Math.min(10, Math.max(1, Math.round(v))) - 1];

/** The felt layers as SVG, in card pixels (the region view's styles: see components/dash/WorldMap.tsx). */
function feltSvg(f: ShareFelt | null | undefined, proj: (p: [number, number]) => [number, number] | null, w: number, h: number, surface: string): string {
  if (!f) return '';
  const inside = (p: [number, number] | null): p is [number, number] => !!p && p[0] > -60 && p[0] < w + 60 && p[1] > -60 && p[1] < h + 60;
  // Radius of ~10 km (0.09° of latitude) at a point, in card pixels.
  const geoR = (lat: number, lon: number, p: [number, number]) => { const b = proj([lon, Math.min(89, lat + 0.09)]); return b ? Math.hypot(b[0] - p[0], b[1] - p[1]) : 0; };
  const n = (v: number) => v.toFixed(1);
  const defs: string[] = [], used = new Set<string>();
  const grad = (id: string, color: string, stops: [number, number][]) => {
    if (used.has(id)) return; used.add(id);
    defs.push(`<radialGradient id="${id}">${stops.map(([o, a]) => `<stop offset="${o}%" stop-color="${color}" stop-opacity="${a}"/>`).join('')}</radialGradient>`);
  };

  const dyfi = f.dyfi.flatMap(c => {
    const d = 0.045, dl = d / Math.max(0.2, Math.cos((c.lat * Math.PI) / 180));
    const ring = c.ring ?? [[c.lon - dl, c.lat - d], [c.lon + dl, c.lat - d], [c.lon + dl, c.lat + d], [c.lon - dl, c.lat + d]];
    const pts = ring.map(([lo, la]) => proj([lo, la])).filter((p): p is [number, number] => !!p);
    const mid = proj([c.lon, c.lat]);
    if (pts.length < 3 || !inside(mid)) return [];
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), min = 10;
    return [Math.max(...xs) - Math.min(...xs) < min || Math.max(...ys) - Math.min(...ys) < min
      ? `<rect x="${n(mid[0] - min / 2)}" y="${n(mid[1] - min / 2)}" width="${min}" height="${min}" fill="${mmiColor(c.cdi)}"/>`
      : `<path d="M${pts.map(p => `${n(p[0])},${n(p[1])}`).join('L')}Z" fill="${mmiColor(c.cdi)}"/>`];
  }).join('');

  const heat = f.heat.flatMap(c => {
    const p = proj([c.lon, c.lat]);
    if (!inside(p)) return [];
    const i = Math.min(HEAT_COLORS.length - 1, Math.floor(c.w * HEAT_COLORS.length));
    grad(`fh${i}`, HEAT_COLORS[i], [[0, 0.8], [55, 0.5], [100, 0]]);
    return [`<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(Math.max(geoR(c.lat, c.lon, p) * 1.8, 30) * (0.8 + 0.6 * c.w))}" fill="url(#fh${i})"/>`];
  }).join('');

  const reports = f.reports.flatMap(c => {
    const p = proj([c.lon, c.lat]);
    if (!inside(p)) return [];
    const i = Math.min(10, Math.max(1, Math.round(c.mmi)));
    grad(`fr${i}`, MMI_COLORS[i - 1], [[0, 0.85], [60, 0.45], [100, 0]]);
    return [`<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(Math.max(geoR(c.lat, c.lon, p) * 1.6, 26) * (1 + Math.min(1, (c.n - 1) / 10) * 0.5))}" fill="url(#fr${i})"/>`];
  }).join('');

  const emsc = f.emsc.flatMap(c => {
    const p = proj([c.lon, c.lat]);
    return inside(p) ? [`<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(6 + Math.min(5, Math.sqrt(c.n)))}" fill="${mmiColor(c.mmi)}" fill-opacity="0.85" stroke="${surface}" stroke-width="2"/>`] : [];
  }).join('');

  return `${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${dyfi ? `<g opacity="0.6">${dyfi}</g>` : ''}${heat}${reports}${emsc}`;
}
