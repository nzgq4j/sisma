'use client';
// 2D world map shared by the Map tab and the desktop dashboard.
// Map tab (design drawMap): Mercator rotated to the user's longitude, scale (H/2)/1.9, zoom 1–40, endless horizontal
// scrolling (the world is drawn up to three times side by side and the pan is wrapped by one world-width), user pin,
// optional plate boundaries, tap empty map to deselect. The dashboard uses the same wrapping Mercator.
// Equal Earth (zoom 1–12, fixed frame) remains available as a projection option.
// Dots are sized (mag − 1.6) × 2.1 and coloured by MAG_SCALE in both.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { geoEqualEarth, geoGraticule10, geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { HEAT_COLORS, MMI_COLORS, magColor } from '@/lib/theme';
import type { HeatCell } from '@/lib/feltmap';
import type { FeltCell } from '@/components/FeltReport';
import { useT } from '@/i18n/I18nProvider';
import { timeAgo } from '@/components/QuakeRow';
import { BORDERS, COUNTRIES, SPHERE, useLakes, usePlates } from '@/lib/world';
import type { Quake } from '@/lib/quakes/types';
import { useDistance } from '@/components/Units';
import styles from './dash.module.css';

const GRATICULE = geoGraticule10();
export const dotRadius = (mag: number) => Math.max(2.4, (mag - 1.6) * 2.1);

export interface MapFocus { key: string; lat: number; lon: number; zoom: number }

export function WorldMap({ quakes, center, selectedId, onSelect, projection = 'equalEarth', plates = false, pin = true, controls = true, toolsClassName = '', focus = null, cells = [], heat = [], onReset }: {
  quakes: Quake[]; center: { lat: number; lon: number }; selectedId: string | null; onSelect: (q: Quake | null) => void;
  projection?: 'equalEarth' | 'mercator'; plates?: boolean; pin?: boolean; controls?: boolean; toolsClassName?: string;
  /** Zoom to this point (changing `key` re-applies it). */
  focus?: MapFocus | null;
  /** Felt reports as ~10 km cells, drawn as soft, blurred areas so no exact position is implied. */
  cells?: FeltCell[];
  /** Automatic felt map (lib/feltmap.ts): ~10 km cells weighted 0–1 by the surge of app activity after the quake. */
  heat?: HeatCell[];
  /** Called when the reset-view button is pressed (e.g. to leave a focused region). */
  onReset?: () => void;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { t, m } = useT();
  const u = useDistance();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [k, setK] = useState(1);
  // Extra world copies needed to fill the view while scrolling endlessly (bit 1 = left, bit 2 = right).
  const [sides, setSides] = useState(0);
  const [hover, setHover] = useState<{ q: Quake; x: number; y: number } | null>(null);
  const plateData = usePlates(plates);
  const lakes = useLakes();
  const mercator = projection === 'mercator';

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { path, project, sc } = useMemo(() => {
    let p: GeoProjection, sc = 0;
    if (mercator) {
      // Design: scale (H/2)/1.9. On wide screens grow it so the map always fills the width.
      sc = Math.max((size.h / 2) / 1.9, size.w / (2 * Math.PI));
      p = geoMercator().rotate([-center.lon, 0]).scale(sc).translate([size.w / 2, size.h / 2]);
    } else {
      p = geoEqualEarth().rotate([-center.lon, 0]).fitExtent([[6, 6], [Math.max(7, size.w - 6), Math.max(7, size.h - 6)]], SPHERE);
    }
    return { path: geoPath(p), project: (lon: number, lat: number) => p([lon, lat]), sc };
  }, [size.w, size.h, center.lon, mercator]);
  const lakesD = useMemo(() => (lakes ? path(lakes) ?? '' : ''), [lakes, path]);

  // One world-width in map units (Mercator spans 2π·scale horizontally); never narrower than the view.
  const worldW = mercator ? 2 * Math.PI * sc : 0;

  useEffect(() => {
    const svg = svgRef.current; if (!svg || !size.w || !size.h) return;
    const W = worldW, cx = size.w / 2;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, mercator ? 40 : 12])
      .extent([[0, 0], [size.w, size.h]])
      // Mercator: free horizontally (wrapped below), clamped vertically. Equal Earth: stays inside the frame.
      .translateExtent(mercator ? [[-Infinity, 0], [Infinity, size.h]] : [[0, 0], [size.w, size.h]])
      .on('zoom', e => {
        const { k: tk, y } = e.transform; let x = e.transform.x;
        if (W) {
          // d3 keeps the unbounded pan; draw it wrapped to within half a world of the centred position,
          // so the three copies always cover the screen however far the map is dragged.
          const kW = tk * W, x0 = cx * (1 - tk);
          let d = ((x - x0) % kW + kW) % kW; if (d >= kW / 2) d -= kW;
          x = x0 + d;
          const left = -x / tk < cx - W / 2 ? 1 : 0, right = (size.w - x) / tk > cx + W / 2 ? 2 : 0;
          setSides(left | right);
        }
        gRef.current?.setAttribute('transform', `translate(${x},${y}) scale(${tk})`);
        setK(tk); setHover(null);
      });
    zoomRef.current = z;
    let start = zoomIdentity;
    const fp = focus ? project(focus.lon, focus.lat) : null;
    if (focus && fp) start = zoomIdentity.translate(size.w / 2 - focus.zoom * fp[0], size.h / 2 - focus.zoom * fp[1]).scale(focus.zoom);
    const sel = select(svg).call(z).on('dblclick.zoom', null).call(z.transform, start);
    return () => { sel.on('.zoom', null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-apply only when the focus target (key) changes
  }, [size.w, size.h, mercator, sc, worldW, project, focus?.key]);

  // Smallest on top would hide big events, so draw ascending by magnitude.
  const dots = useMemo(() => quakes
    .map(q => ({ q, xy: project(q.lon, q.lat) }))
    .filter((d): d is { q: Quake; xy: [number, number] } => !!d.xy && Number.isFinite(d.xy[0]))
    .sort((a, b) => a.q.mag - b.q.mag), [quakes, project]);
  const selected = dots.find(d => d.q.id === selectedId);
  const me = pin ? project(center.lon, center.lat) : null;
  // ~10 km radius (0.09° of latitude) in map units, never smaller than ~10 screen px so a cell stays visible.
  const blobs = useMemo(() => cells.flatMap(c => {
    const a = project(c.lon, c.lat), b = project(c.lon, Math.min(89, c.lat + 0.09));
    return a && b ? [{ ...c, x: a[0], y: a[1], geoR: Math.hypot(b[0] - a[0], b[1] - a[1]) }] : [];
  }), [cells, project]);
  const heatSpots = useMemo(() => heat.flatMap(c => {
    const a = project(c.lon, c.lat), b = project(c.lon, Math.min(89, c.lat + 0.09));
    return a && b ? [{ ...c, x: a[0], y: a[1], geoR: Math.hypot(b[0] - a[0], b[1] - a[1]) }] : [];
  }), [heat, project]);
  const overlay = blobs.length > 0 || heatSpots.length > 0;
  const rScale = 1 / Math.sqrt(k);

  const zoomBy = (f: number) => { const z = zoomRef.current, s = svgRef.current; if (z && s) select(s).call(z.scaleBy, f); };
  const reset = () => { const z = zoomRef.current, s = svgRef.current; if (z && s) select(s).call(z.transform, zoomIdentity); onReset?.(); };

  // The world layer; on the Mercator map it is repeated one world-width to the left and/or right while scrolling.
  const world = (
    <>
      {!mercator && <path d={path(SPHERE) ?? ''} fill="var(--map-sea)" />}
      {!mercator && <path d={path(GRATICULE) ?? ''} fill="none" stroke="var(--map-grat)" vectorEffect="non-scaling-stroke" />}
      <path d={path(COUNTRIES) ?? ''} fill="var(--map-land)" />
      {lakesD && <path d={lakesD} fill="var(--map-sea)" stroke="var(--map-line)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />}
      <path d={path(BORDERS) ?? ''} fill="none" stroke="var(--map-line)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      {plates && plateData && (
        <path d={path(plateData) ?? ''} fill="none" stroke="var(--map-plate)" strokeWidth={1.4} strokeOpacity={0.6} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
      )}
      {heatSpots.length > 0 && (
        <g aria-hidden="true" pointerEvents="none">
          {heatSpots.map(h => (
            <circle key={`h${h.lat},${h.lon}`} cx={h.x} cy={h.y} r={Math.max(h.geoR * 1.8, 24 / k) * (0.8 + 0.6 * h.w)}
              fill={`url(#${gid}heat${Math.min(HEAT_COLORS.length - 1, Math.floor(h.w * HEAT_COLORS.length))})`} />
          ))}
        </g>
      )}
      <g aria-hidden="true">
        {dots.map(({ q, xy }) => (
          <circle key={q.id} cx={xy[0]} cy={xy[1]} r={dotRadius(q.mag) * rScale}
            fill={magColor(q.mag).fill} fillOpacity={overlay && q.id !== selectedId ? 0.25 : 0.88} stroke="var(--surface)" strokeWidth={0.8} vectorEffect="non-scaling-stroke"
            className={styles.dot}
            onPointerEnter={e => { if (e.pointerType !== 'mouse') return; const b = wrapRef.current!.getBoundingClientRect(); setHover({ q, x: e.clientX - b.left, y: e.clientY - b.top }); }}
            onClick={e => { e.stopPropagation(); onSelect(q); }} />
        ))}
      </g>
      {blobs.length > 0 && (
        <g aria-hidden="true" pointerEvents="none">
          {blobs.map(b => (
            <circle key={`${b.lat},${b.lon}`} cx={b.x} cy={b.y} r={Math.max(b.geoR * 1.6, 18 / k) * (1 + Math.min(1, (b.n - 1) / 10) * 0.5)}
              fill={`url(#${gid}felt${Math.min(10, Math.max(1, Math.round(b.mmi)))})`} />
          ))}
        </g>
      )}
      <g aria-hidden="true">
        {selected && (
          <circle cx={selected.xy[0]} cy={selected.xy[1]} r={(dotRadius(selected.q.mag) + 4) * rScale}
            fill="none" stroke="var(--ink)" strokeWidth={2.4} vectorEffect="non-scaling-stroke" pointerEvents="none" />
        )}
        {me && (
          <g transform={`translate(${me[0]},${me[1]}) scale(${1 / k})`} pointerEvents="none">
            <circle r={14} fill="var(--violet)" fillOpacity={0.2} />
            <circle r={5.5} fill="var(--violet)" stroke="#fff" strokeWidth={2} />
          </g>
        )}
      </g>
    </>
  );
  const offsets = worldW ? [0, ...(sides & 1 ? [-worldW] : []), ...(sides & 2 ? [worldW] : [])] : [0];

  return (
    <div ref={wrapRef} className={styles.mapWrap} onMouseLeave={() => setHover(null)}>
      {size.w > 0 && (
        <svg ref={svgRef} width={size.w} height={size.h} role="img" aria-label={t('count', { n: quakes.length })} className={styles.mapSvg}
          style={{ background: 'var(--map-sea)' }} onClick={() => selectedId && onSelect(null)}>
          {overlay && (
            <defs>
              {HEAT_COLORS.map((c, i) => (
                <radialGradient key={`h${i}`} id={`${gid}heat${i}`}>
                  <stop offset="0%" stopColor={c} stopOpacity={0.8} />
                  <stop offset="55%" stopColor={c} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={c} stopOpacity={0} />
                </radialGradient>
              ))}
              {MMI_COLORS.map((c, i) => (
                <radialGradient key={i} id={`${gid}felt${i + 1}`}>
                  <stop offset="0%" stopColor={c} stopOpacity={0.75} />
                  <stop offset="60%" stopColor={c} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={c} stopOpacity={0} />
                </radialGradient>
              ))}
            </defs>
          )}
          <g ref={gRef}>
            {offsets.map(off => (
              <g key={off} transform={off ? `translate(${off},0)` : undefined}>{world}</g>
            ))}
          </g>
        </svg>
      )}
      {controls && (
        <div className={`${styles.mapTools} ${toolsClassName}`}>
          <button type="button" onClick={() => zoomBy(1.6)} aria-label={m.dash.zoom_in} title={m.dash.zoom_in}><span className="ms">add</span></button>
          <button type="button" onClick={() => zoomBy(1 / 1.6)} aria-label={m.dash.zoom_out} title={m.dash.zoom_out}><span className="ms">remove</span></button>
          <button type="button" onClick={reset} aria-label={m.dash.reset_view} title={m.dash.reset_view}><span className="ms">fit_screen</span></button>
        </div>
      )}
      {hover && (
        <div className={styles.tooltip} style={{ left: Math.min(hover.x + 14, size.w - 230), top: Math.max(hover.y - 12, 8) }}>
          <strong>M{hover.q.mag.toFixed(1)} · {hover.q.region}</strong>
          <span>{u.text(hover.q.title)}</span>
          <span>{timeAgo(t as never, hover.q.time)} · ↓ {u.depth(hover.q.depthKm)}</span>
        </div>
      )}
    </div>
  );
}
