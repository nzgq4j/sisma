'use client';
// Science → Pacific Fire Ribbon, linked map (step 6; docs/fire-ribbon.md). A Pacific-centred map (Equal Earth, centred
// on 170° W) with the ribbon's route, the stretch the profile or 3D view is showing (its corridor, 400 km on the
// Pacific side and 700 km behind the arc), the earthquakes the views show (by depth colour, at their catalogue
// position) and the volcanoes in this week's report. Selecting on the map selects the same earthquake or volcano on
// the ribbon and moves the ribbon to it; a selection on the ribbon is ringed here.
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoEqualEarth, geoGraticule10, geoPath, type GeoProjection } from 'd3-geo';
import type { Feature, LineString, Polygon } from 'geojson';
import { LAND, SPHERE } from '@/lib/world-data';
import { corridorRing, routeLine } from '@/lib/ribbon/geo';
import { depthColour, markerRadius, type RibbonQuake } from '@/lib/ribbon/shared';
import type { RibbonVolcano } from '@/lib/ribbon/volcanoes';
import styles from './ribbon.module.css';

const GRAT = geoGraticule10();
const ROUTE_LINE: Feature<LineString> = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeLine() } };
const SEA = '#0E1A2E', LAND_FILL = '#2A3346', COAST = 'rgba(190, 205, 230, .35)', GRATC = 'rgba(190, 205, 230, .08)';
const ROUTE_C = 'rgba(255, 170, 110, .9)';
const VOLC: Record<string, string> = { new_unrest: '#FFC233', new_eruptive: '#FF8A2A', continuing: '#FF4040', other: '#E9EDF5' };

export default function RibbonMap({ view, corridor, quakes, volcanoes, selected, selectedV, onPickQuake, onPickVolcano, label, height }: {
  /** The stretch of route the ribbon is showing, km. */
  view: { x0: number; x1: number } | null;
  corridor: { leftKm: number; rightKm: number };
  quakes: RibbonQuake[]; volcanoes: RibbonVolcano[];
  selected: string | null; selectedV: number | null;
  onPickQuake: (q: RibbonQuake) => void; onPickVolcano: (v: RibbonVolcano) => void;
  label: string; height?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(0);
  const h = height ?? Math.round(Math.min(360, Math.max(220, w * 0.62)));
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Pacific-centred, fitted to the route with a margin (the whole ring stays in view on a phone).
  const projection = useMemo<GeoProjection | null>(() => {
    if (!w) return null;
    return geoEqualEarth().rotate([170, 0]).fitExtent([[10, 10], [w - 10, h - 10]], ROUTE_LINE);
  }, [w, h]);
  const reported = useMemo(() => volcanoes.filter(v => VOLC[v.status]), [volcanoes]);

  useEffect(() => {
    const c = canvas.current, p = projection;
    if (!c || !p || !w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const path = geoPath(p, g);
    g.clearRect(0, 0, w, h);
    g.beginPath(); path(SPHERE); g.fillStyle = SEA; g.fill();
    g.beginPath(); path(GRAT); g.strokeStyle = GRATC; g.lineWidth = 1; g.stroke();
    g.beginPath(); path(LAND); g.fillStyle = LAND_FILL; g.fill(); g.strokeStyle = COAST; g.lineWidth = 0.6; g.stroke();
    // The stretch shown on the ribbon: its corridor, and the route through it.
    if (view) {
      const ring: Feature<Polygon> = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [corridorRing(view.x0, view.x1, corridor.leftKm, corridor.rightKm)] } };
      g.beginPath(); path(ring); g.fillStyle = 'rgba(242, 179, 61, .16)'; g.fill(); g.strokeStyle = 'rgba(242, 179, 61, .9)'; g.lineWidth = 1.5; g.stroke();
    }
    g.beginPath(); path(ROUTE_LINE); g.strokeStyle = ROUTE_C; g.lineWidth = 1.6; g.stroke();
    if (view) {
      g.beginPath(); path({ type: 'LineString', coordinates: routeLine(view.x0, view.x1) }); g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; g.stroke();
    }
    // Earthquakes, small first; then reported volcanoes; then the selection, ringed.
    const order = [...quakes].sort((a, b) => (a.mag ?? 0) - (b.mag ?? 0));
    for (const q of order) {
      const xy = p([q.lon, q.lat]);
      if (!xy) continue;
      g.beginPath(); g.arc(xy[0], xy[1], Math.max(1.4, markerRadius(q.mag) * 0.55), 0, Math.PI * 2);
      g.fillStyle = depthColour(q.depth); g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
    }
    for (const v of reported) {
      const xy = p([v.lon, v.lat]);
      if (!xy) continue;
      const s = 6;
      g.beginPath(); g.moveTo(xy[0], xy[1] - s); g.lineTo(xy[0] + s * 0.8, xy[1] + s * 0.6); g.lineTo(xy[0] - s * 0.8, xy[1] + s * 0.6); g.closePath();
      g.fillStyle = VOLC[v.status]; g.fill(); g.strokeStyle = SEA; g.lineWidth = 1; g.stroke();
    }
    const sq = selected ? quakes.find(q => q.id === selected) : null;
    const sv = selectedV !== null ? volcanoes.find(v => v.n === selectedV) : null;
    for (const pt of [sq ? [sq.lon, sq.lat] : null, sv ? [sv.lon, sv.lat] : null]) {
      const xy = pt && p(pt as [number, number]);
      if (!xy) continue;
      g.beginPath(); g.arc(xy[0], xy[1], 9, 0, Math.PI * 2); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.5; g.stroke();
    }
  }, [projection, w, h, view, corridor.leftKm, corridor.rightKm, quakes, reported, volcanoes, selected, selectedV]);

  // A tap picks the nearest earthquake or reported volcano within 16 px (volcanoes first: they are fewer and larger).
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = projection;
    if (!p) return;
    const r = e.currentTarget.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const near = <T extends { lat: number; lon: number }>(list: T[]) => {
      let best: T | null = null, bd = 16 * 16;
      for (const it of list) { const xy = p([it.lon, it.lat]); if (!xy) continue; const d = (xy[0] - px) ** 2 + (xy[1] - py) ** 2; if (d < bd) { bd = d; best = it; } }
      return best;
    };
    const v = near(reported);
    if (v) { onPickVolcano(v); return; }
    const q = near(quakes);
    if (q) onPickQuake(q);
  };

  return (
    <div ref={wrap} className={styles.mapWrap}>
      <canvas ref={canvas} role="img" aria-label={label} style={{ width: '100%', height: h, display: 'block' }} onPointerUp={tap} />
    </div>
  );
}
