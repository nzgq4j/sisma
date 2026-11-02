'use client';
// 2D world map shared by the Map tab and the desktop dashboard.
// Map tab (design drawMap): Mercator rotated to the user's longitude, scale (H/2)/1.9, zoom 1–14, horizontal pan limit,
// user pin, optional plate boundaries, tap empty map to deselect. Dashboard: Equal Earth, zoom 1–12.
// Dots are sized (mag − 1.6) × 2.1 and coloured by MAG_SCALE in both.
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoEqualEarth, geoGraticule10, geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { magColor } from '@/lib/theme';
import { useT } from '@/i18n/I18nProvider';
import { timeAgo } from '@/components/QuakeRow';
import { COUNTRIES, SPHERE, usePlates } from '@/lib/world';
import type { Quake } from '@/lib/quakes/types';
import styles from './dash.module.css';

const GRATICULE = geoGraticule10();
export const dotRadius = (mag: number) => Math.max(2.4, (mag - 1.6) * 2.1);

export function WorldMap({ quakes, center, selectedId, onSelect, projection = 'equalEarth', plates = false, pin = true, controls = true, toolsClassName = '' }: {
  quakes: Quake[]; center: { lat: number; lon: number }; selectedId: string | null; onSelect: (q: Quake | null) => void;
  projection?: 'equalEarth' | 'mercator'; plates?: boolean; pin?: boolean; controls?: boolean; toolsClassName?: string;
}) {
  const { t, m, nf } = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [k, setK] = useState(1);
  const [hover, setHover] = useState<{ q: Quake; x: number; y: number } | null>(null);
  const plateData = usePlates(plates);
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

  useEffect(() => {
    const svg = svgRef.current; if (!svg || !size.w || !size.h) return;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, mercator ? 14 : 12])
      .extent([[0, 0], [size.w, size.h]])
      .translateExtent(mercator ? [[size.w / 2 - Math.PI * sc, 0], [size.w / 2 + Math.PI * sc, size.h]] : [[0, 0], [size.w, size.h]])
      .on('zoom', e => { gRef.current?.setAttribute('transform', e.transform.toString()); setK(e.transform.k); setHover(null); });
    zoomRef.current = z;
    const sel = select(svg).call(z).on('dblclick.zoom', null).call(z.transform, zoomIdentity);
    return () => { sel.on('.zoom', null); };
  }, [size.w, size.h, mercator, sc]);

  // Smallest on top would hide big events, so draw ascending by magnitude.
  const dots = useMemo(() => quakes
    .map(q => ({ q, xy: project(q.lon, q.lat) }))
    .filter((d): d is { q: Quake; xy: [number, number] } => !!d.xy && Number.isFinite(d.xy[0]))
    .sort((a, b) => a.q.mag - b.q.mag), [quakes, project]);
  const selected = dots.find(d => d.q.id === selectedId);
  const me = pin ? project(center.lon, center.lat) : null;
  const rScale = 1 / Math.sqrt(k);

  const zoomBy = (f: number) => { const z = zoomRef.current, s = svgRef.current; if (z && s) select(s).call(z.scaleBy, f); };
  const reset = () => { const z = zoomRef.current, s = svgRef.current; if (z && s) select(s).call(z.transform, zoomIdentity); };

  return (
    <div ref={wrapRef} className={styles.mapWrap} onMouseLeave={() => setHover(null)}>
      {size.w > 0 && (
        <svg ref={svgRef} width={size.w} height={size.h} role="img" aria-label={t('count', { n: quakes.length })} className={styles.mapSvg}
          style={{ background: 'var(--map-sea)' }} onClick={() => selectedId && onSelect(null)}>
          <g ref={gRef}>
            {!mercator && <path d={path(SPHERE) ?? ''} fill="var(--map-sea)" />}
            {!mercator && <path d={path(GRATICULE) ?? ''} fill="none" stroke="var(--map-grat)" vectorEffect="non-scaling-stroke" />}
            <path d={path(COUNTRIES) ?? ''} fill="var(--map-land)" stroke="var(--map-line)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
            {plates && plateData && (
              <path d={path(plateData) ?? ''} fill="none" stroke="var(--map-plate)" strokeWidth={1.4} strokeOpacity={0.6} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            )}
            <g aria-hidden="true">
              {dots.map(({ q, xy }) => (
                <circle key={q.id} cx={xy[0]} cy={xy[1]} r={dotRadius(q.mag) * rScale}
                  fill={magColor(q.mag).fill} fillOpacity={0.88} stroke="var(--surface)" strokeWidth={0.8} vectorEffect="non-scaling-stroke"
                  className={styles.dot}
                  onPointerEnter={e => { if (e.pointerType !== 'mouse') return; const b = wrapRef.current!.getBoundingClientRect(); setHover({ q, x: e.clientX - b.left, y: e.clientY - b.top }); }}
                  onClick={e => { e.stopPropagation(); onSelect(q); }} />
              ))}
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
          <span>{hover.q.title}</span>
          <span>{timeAgo(t as never, hover.q.time)} · ↓ {nf.format(Math.round(hover.q.depthKm))} km</span>
        </div>
      )}
    </div>
  );
}
