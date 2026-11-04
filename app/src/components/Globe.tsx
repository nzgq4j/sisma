'use client';
// 3D globe (design: initGlobe). Canvas d3.geoOrthographic; d3-zoom drives drag-rotate and pinch/wheel zoom
// (0.8–10×: scale changes only zoom, pans only rotate); auto-spin 0.12°/frame ÷ zoom; Depth mode draws radial
// lines scaled 1 − depth/700 × 0.4 coloured by depthColor; plate boundaries. Events use the same markers as the 2D
// maps, in the style chosen in Me → Map markers (lib/pin.ts, lib/marker-sprite.ts): numbered pins or circles sized by
// magnitude, magnitude colour (Depth mode: depth colour); a tap picks the nearest marker.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { depthColor, depthInk, magIndex } from '@/lib/theme';
import { markerHit } from '@/lib/pin';
import { markerSprite, stampSprite } from '@/lib/marker-sprite';
import { useMarkerStyle } from '@/components/MarkerStyle';
import { LAND, SPHERE, useLakes, usePlates } from '@/lib/world';
import type { Quake } from '@/lib/quakes/types';

export interface GlobeHandle { zoomBy: (f: number) => void }
interface Props {
  quakes: Quake[]; center: { lat: number; lon: number }; selectedId: string | null; onSelect: (q: Quake | null) => void;
  depthMode: boolean; plates: boolean; spin: boolean; label: string;
  /** Turns the globe to face this point (e.g. a chosen world region) whenever `key` changes. */
  focus?: { key: string; lat: number; lon: number } | null;
}
/** How long (ms) the turn to a new focus takes. */
const TURN_MS = 700;

const GRATICULE = geoGraticule10();
// Remember the view between visits to the tab, like the design (globeRot / globeK).
const memo: { rot: [number, number, number] | null; k: number } = { rot: null, k: 1 };

function readTheme() {
  const cs = getComputedStyle(document.documentElement), v = (n: string) => cs.getPropertyValue(n).trim();
  return { sea: v('--map-sea'), land: v('--map-land'), line: v('--map-line'), grat: v('--map-grat'), plate: v('--map-plate'), glow: v('--map-glow'), ink: v('--ink'), violet: v('--violet'),
    // Marker colours by magnitude band, following light/dark mode (globals.css --mag-0 … --mag-5).
    mags: [0, 1, 2, 3, 4, 5].map(i => v(`--mag-${i}`)), magInks: [0, 1, 2, 3, 4, 5].map(i => v(`--mag-ink-${i}`)),
    surface: v('--surface'), font: getComputedStyle(document.body).fontFamily };
}

export const Globe = forwardRef<GlobeHandle, Props>(function Globe(props, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  const markerStyle = useMarkerStyle();
  const styleRef = useRef(markerStyle);
  const sorted = useRef<{ src: Quake[] | null; list: Quake[] }>({ src: null, list: [] });
  const plateData = usePlates(props.plates);
  const platesRef = useRef(plateData);
  const lakeData = useLakes();
  const lakesRef = useRef(lakeData);
  const zoomRef = useRef<{ z: ZoomBehavior<HTMLCanvasElement, unknown>; el: HTMLCanvasElement } | null>(null);
  useEffect(() => {
    live.current = props; platesRef.current = plateData; lakesRef.current = lakeData; styleRef.current = markerStyle;
    // Ascending magnitude so the strongest events are drawn last (on top); recomputed only when the data changes.
    if (sorted.current.src !== props.quakes) sorted.current = { src: props.quakes, list: [...props.quakes].sort((a, b) => a.mag - b.mag) };
  });

  useImperativeHandle(ref, () => ({
    zoomBy: f => { const h = zoomRef.current; if (h) select(h.el).call(h.z.scaleBy, f); },
  }), []);

  useEffect(() => {
    const wrap = wrapRef.current, cv = canvasRef.current; if (!wrap || !cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let W = 0, H = 0, R = 1, cx = 0, cy = 0, raf = 0, frameNo = 0;
    let theme = readTheme();
    const { center } = live.current;
    const proj = geoOrthographic().clipAngle(90).precision(0.6)
      .rotate(memo.rot ?? [-center.lon, -Math.max(-40, Math.min(40, center.lat)) * 0.7, 0]);
    const path = geoPath(proj, ctx);
    const st = { drag: false, moved: false, px: 0, py: 0, pk: memo.k, pts: [] as [number, number, Quake][],
      focusKey: null as string | null, turn: null as { from: [number, number]; to: [number, number]; t0: number } | null };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = wrap.clientWidth; H = wrap.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2 - 6; R = Math.max(60, Math.min(W * 0.45, (H - 140) / 2));
      proj.translate([cx, cy]).scale(R * memo.k);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    // Nearest marker (pin head, or circle centre) within reach of a fingertip.
    const hit = (x: number, y: number, touch: boolean) => {
      let best: Quake | null = null, bd = Infinity;
      for (const [px, py, q] of st.pts) {
        const { dy, reach } = markerHit(styleRef.current, q.mag, touch), d = (px - x) ** 2 + (py + dy - y) ** 2;
        if (d <= reach * reach && d < bd) { bd = d; best = q; }
      }
      return best;
    };
    const pick = (x: number, y: number, touch: boolean) => live.current.onSelect(hit(x, y, touch));

    // Mouse cursor: an arrow over the globe, a pointer over a marker, a closed hand while dragging. Re-checked every
    // frame (the spin moves markers under a still mouse).
    let mouse: { x: number; y: number } | null = null, cursor = '';
    const setCursor = (c: string) => { if (c !== cursor) { cursor = c; cv.style.cursor = c; } };
    const hover = () => { if (!st.drag) setCursor(mouse && hit(mouse.x, mouse.y, false) ? 'pointer' : 'default'); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const b = cv.getBoundingClientRect(); mouse = { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const onLeave = () => { mouse = null; };

    const z = zoom<HTMLCanvasElement, unknown>().scaleExtent([0.8, 10])
      .on('start', e => {
        st.drag = true; st.moved = false; st.turn = null;
        if ((e.sourceEvent as Event | null)?.type === 'mousedown') setCursor('grabbing');
      })
      .on('zoom', e => {
        const tr = e.transform, dx = tr.x - st.px, dy = tr.y - st.py, scaled = Math.abs(tr.k / st.pk - 1) > 1e-4;
        st.px = tr.x; st.py = tr.y; st.pk = tr.k;
        if (scaled) { proj.scale(R * tr.k); memo.k = tr.k; st.moved = true; }
        else if (dx || dy) {
          st.moved = true;
          const r = proj.rotate(), f = 70 / proj.scale();
          proj.rotate([r[0] + dx * f, Math.max(-85, Math.min(85, r[1] - dy * f)), 0]);
        }
      })
      .on('end', () => { st.drag = false; hover(); });

    // Taps and clicks select the nearest marker. Detected with pointer events rather than the zoom gesture's end:
    // a touchend carries no coordinates, and the slightest mouse jitter registers as a drag.
    let down: { x: number; y: number; t: number; id: number } | null = null;
    const onDown = (e: PointerEvent) => { if (e.isPrimary) down = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId }; };
    const onUp = (e: PointerEvent) => {
      const d = down; down = null;
      if (!d || d.id !== e.pointerId || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || e.timeStamp - d.t > 500) return;
      const b = cv.getBoundingClientRect();
      pick(e.clientX - b.left, e.clientY - b.top, e.pointerType !== 'mouse');
    };
    const onCancel = () => { down = null; };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onCancel);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerleave', onLeave);
    const sel = select(cv).call(z).on('dblclick.zoom', null).call(z.transform, zoomIdentity.scale(memo.k));
    st.px = 0; st.py = 0; st.pk = memo.k;
    zoomRef.current = { z, el: cv };

    const frame = () => {
      const p = live.current;
      if (++frameNo % 30 === 0) theme = readTheme();
      const fk = p.focus?.key ?? null;
      if (fk !== st.focusKey) {
        st.focusKey = fk;
        if (p.focus) {
          const r = proj.rotate(), to: [number, number] = [-p.focus.lon, -Math.max(-60, Math.min(60, p.focus.lat))];
          to[0] = r[0] + ((((to[0] - r[0]) % 360) + 540) % 360) - 180; // the short way round
          st.turn = { from: [r[0], r[1]], to, t0: performance.now() };
        }
      }
      if (st.turn) {
        const { from, to, t0 } = st.turn, u = Math.min(1, (performance.now() - t0) / TURN_MS), e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
        proj.rotate([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e, 0]);
        if (u >= 1) st.turn = null;
      } else if (p.spin && !st.drag) { const r = proj.rotate(); proj.rotate([r[0] + 0.12 / memo.k, r[1], 0]); }
      memo.rot = proj.rotate();
      ctx.clearRect(0, 0, W, H);
      const Rs = proj.scale(), grd = ctx.createRadialGradient(cx, cy, Rs * 0.92, cx, cy, Rs * 1.3);
      grd.addColorStop(0, theme.glow); grd.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      ctx.beginPath(); path(SPHERE); ctx.fillStyle = theme.sea; ctx.fill();
      ctx.beginPath(); path(GRATICULE); ctx.strokeStyle = theme.grat; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.beginPath(); path(LAND); ctx.fillStyle = theme.land; ctx.fill(); ctx.strokeStyle = theme.line; ctx.lineWidth = 0.6; ctx.stroke();
      const lakes = lakesRef.current;
      if (lakes) { ctx.beginPath(); path(lakes); ctx.fillStyle = theme.sea; ctx.fill(); ctx.strokeStyle = theme.line; ctx.lineWidth = 0.5; ctx.stroke(); }
      const plates = platesRef.current;
      if (p.plates && plates) { ctx.beginPath(); path(plates); ctx.strokeStyle = theme.plate; ctx.globalAlpha = 0.65; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }

      const r = proj.rotate(), c: [number, number] = [-r[0], -r[1]], pts: [number, number, Quake][] = [];
      let selPt: [number, number, Quake] | null = null;
      const look = (q: Quake) => p.depthMode
        ? { fill: depthColor(q.depthKm), ink: depthInk(q.depthKm) }
        : { fill: theme.mags[magIndex(q.mag)], ink: theme.magInks[magIndex(q.mag)] };
      const stamp = (x: number, y: number, q: Quake, selected: boolean) => {
        const { fill, ink } = look(q);
        stampSprite(ctx, markerSprite({ style: styleRef.current, mag: q.mag, fill, ink, edge: theme.surface, font: theme.font,
          outline: selected ? theme.ink : null, scale: selected ? 1.15 : 1 }), x, y);
      };
      for (const q of sorted.current.list) {
        if (geoDistance([q.lon, q.lat], c) > 1.55) continue;
        const xy = proj([q.lon, q.lat]); if (!xy) continue;
        let [x, y] = xy;
        if (p.depthMode) {
          const f = 1 - (Math.min(q.depthKm, 700) / 700) * 0.4, xi = cx + (x - cx) * f, yi = cy + (y - cy) * f;
          ctx.strokeStyle = depthColor(q.depthKm); ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xi, yi); ctx.stroke(); ctx.globalAlpha = 1;
          x = xi; y = yi;
        }
        if (q.id === p.selectedId) selPt = [x, y, q]; else stamp(x, y, q, false);
        pts.push([x, y, q]);
      }
      // The selected event on top, larger, with an ink outline (as on the 2D maps).
      if (selPt) stamp(selPt[0], selPt[1], selPt[2], true);
      const L = p.center;
      if (geoDistance([L.lon, L.lat], c) < 1.55) {
        const xy = proj([L.lon, L.lat]);
        if (xy) {
          ctx.fillStyle = theme.violet; ctx.globalAlpha = 0.22; ctx.beginPath(); ctx.arc(xy[0], xy[1], 12, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 5, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        }
      }
      st.pts = pts;
      hover();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); sel.on('.zoom', null); zoomRef.current = null;
      cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onCancel);
      cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} role="img" aria-label={props.label} style={{ display: 'block', touchAction: 'none', cursor: 'default' }} />
    </div>
  );
});
