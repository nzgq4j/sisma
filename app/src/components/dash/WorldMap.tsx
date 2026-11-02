'use client';
// World map for the desktop dashboard: Equal Earth projection centred on the user's longitude,
// wheel/drag zoom (1–12×), dots sized like the design's map tab ((mag − 1.6) × 2.1) and coloured by MAG_SCALE.
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoEqualEarth, geoGraticule10, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { magColor } from '@/lib/theme';
import { useT } from '@/i18n/I18nProvider';
import { timeAgo } from '@/components/QuakeRow';
import type { Quake } from '@/lib/quakes/types';
import styles from './dash.module.css';

const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const LAND = feature(topo, topo.objects.countries);
const SPHERE = { type: 'Sphere' } as const;
const GRATICULE = geoGraticule10();

export const dotRadius = (mag: number) => Math.max(2.5, (mag - 1.6) * 2.1);

export function WorldMap({ quakes, centerLon, selectedId, onSelect }: {
  quakes: Quake[]; centerLon: number; selectedId: string | null; onSelect: (q: Quake) => void;
}) {
  const { t, m, nf } = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ w: 800, h: 420 });
  const [k, setK] = useState(1);
  const [hover, setHover] = useState<{ q: Quake; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { path, project } = useMemo(() => {
    const p = geoEqualEarth().rotate([-centerLon, 0]).fitExtent([[6, 6], [size.w - 6, size.h - 6]], SPHERE);
    return { path: geoPath(p), project: (lon: number, lat: number) => p([lon, lat]) };
  }, [size.w, size.h, centerLon]);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .extent([[0, 0], [size.w, size.h]])
      .translateExtent([[0, 0], [size.w, size.h]])
      .on('zoom', e => { gRef.current?.setAttribute('transform', e.transform.toString()); setK(e.transform.k); setHover(null); });
    zoomRef.current = z;
    const sel = select(svg).call(z).call(z.transform, zoomIdentity);
    return () => { sel.on('.zoom', null); };
  }, [size.w, size.h]);

  // Smallest on top would hide big events, so draw ascending by magnitude.
  const dots = useMemo(() => quakes
    .map(q => ({ q, xy: project(q.lon, q.lat) }))
    .filter((d): d is { q: Quake; xy: [number, number] } => !!d.xy)
    .sort((a, b) => a.q.mag - b.q.mag), [quakes, project]);
  const selected = dots.find(d => d.q.id === selectedId);
  const rScale = 1 / Math.sqrt(k);

  const zoomBy = (f: number) => { const z = zoomRef.current, s = svgRef.current; if (z && s) select(s).call(z.scaleBy, f); };
  const reset = () => { const z = zoomRef.current, s = svgRef.current; if (z && s) select(s).call(z.transform, zoomIdentity); };

  return (
    <div ref={wrapRef} className={styles.mapWrap} onMouseLeave={() => setHover(null)}>
      <svg ref={svgRef} width={size.w} height={size.h} role="img" aria-label={t('count', { n: quakes.length })} className={styles.mapSvg}>
        <g ref={gRef}>
          <path d={path(SPHERE) ?? ''} fill="var(--map-sea)" />
          <path d={path(GRATICULE) ?? ''} fill="none" stroke="var(--map-grat)" vectorEffect="non-scaling-stroke" />
          <path d={path(LAND) ?? ''} fill="var(--map-land)" stroke="var(--map-line)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          <g aria-hidden="true">
            {dots.map(({ q, xy }) => (
              <circle key={q.id} cx={xy[0]} cy={xy[1]} r={dotRadius(q.mag) * rScale}
                fill={magColor(q.mag).fill} fillOpacity={0.88} stroke="var(--surface)" strokeWidth={1} vectorEffect="non-scaling-stroke"
                className={styles.dot}
                onMouseEnter={e => { const b = wrapRef.current!.getBoundingClientRect(); setHover({ q, x: e.clientX - b.left, y: e.clientY - b.top }); }}
                onClick={() => onSelect(q)} />
            ))}
            {selected && (
              <circle cx={selected.xy[0]} cy={selected.xy[1]} r={(dotRadius(selected.q.mag) + 4) * rScale}
                fill="none" stroke="var(--ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" />
            )}
          </g>
        </g>
      </svg>
      <div className={styles.mapTools}>
        <button type="button" onClick={() => zoomBy(1.6)} aria-label={m.dash.zoom_in} title={m.dash.zoom_in}><span className="ms">add</span></button>
        <button type="button" onClick={() => zoomBy(1 / 1.6)} aria-label={m.dash.zoom_out} title={m.dash.zoom_out}><span className="ms">remove</span></button>
        <button type="button" onClick={reset} aria-label={m.dash.reset_view} title={m.dash.reset_view}><span className="ms">fit_screen</span></button>
      </div>
      {hover && (
        <div className={styles.tooltip} style={{ left: Math.min(hover.x + 14, size.w - 230), top: Math.max(hover.y - 12, 8) }}>
          <strong>M{hover.q.mag.toFixed(1)} · {hover.q.region}</strong>
          <span>{hover.q.title}</span>
          <span>{timeAgo(t as never, hover.q.time)} · ↓ {nf.format(Math.round(hover.q.depthKm))} km</span>
        </div>
      )}
    </div>
  );
}
