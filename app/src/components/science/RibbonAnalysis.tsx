'use client';
// Science → Pacific Fire Ribbon, analysis (step 7; docs/fire-ribbon.md): statistics of the earthquakes the ribbon
// shows (lib/ribbon/analysis.ts). Along the route: a bar for every 500 km (rate per 100 km per day, or seismic moment
// from moment magnitudes), the stretch on screen highlighted; tapping a bar moves the ribbon there. By region: a table
// of rates, moment, volcano density, reported volcanoes, smallest magnitude and a completeness estimate.
// Distributions: magnitude and depth. Observed values and estimates are labelled; nothing here is a forecast.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useDistance } from '@/components/Units';
import { MC_MIN_EVENTS, alongRoute, byRegion, depthHistogram, isMw, magHistogram, mwOf } from '@/lib/ribbon/analysis';
import type { RibbonQuake, RibbonResponse } from '@/lib/ribbon/shared';
import type { RibbonVolcano } from '@/lib/ribbon/volcanoes';
import data from './data.module.css';
import styles from './ribbon.module.css';

export type AnalysisMode = 'off' | 'route' | 'regions' | 'dist';
const BIN_KM = 500;
const BG = '#0B1220', BAR_RATE = '#F2B33D', BAR_MOMENT = '#FF6A3D', TEXT = 'rgba(214, 224, 240, .82)', GRID = 'rgba(190, 205, 230, .13)';

export function RibbonAnalysis({ mode, d, quakes, volcanoes, days, view, onGoTo, history }: {
  mode: Exclude<AnalysisMode, 'off'>; d: RibbonResponse; quakes: RibbonQuake[]; volcanoes: RibbonVolcano[];
  /** Days the shown earthquakes cover (for rates). */
  days: number; view: { x0: number; x1: number } | null; onGoTo: (x0: number, x1: number) => void; history: boolean;
}) {
  const { m, nf, locale } = useT();
  const k = m.ribbon;
  const f2 = useMemo(() => new Intl.NumberFormat(locale, { maximumSignificantDigits: 2 }), [locale]);
  const mw = quakes.filter(q => q.mag !== null && isMw(q.magType)).length;
  return (
    <section className={styles.analysis} aria-label={k.analysis}>
      <p className={styles.hint3d}>{k.a_period.replace('{days}', f2.format(days))}</p>
      {quakes.length === 0 && <p className={styles.hint3d}>{k.a_none}</p>}
      {quakes.length > 0 && mode === 'route' && <RouteChart d={d} quakes={quakes} days={days} view={view} onGoTo={onGoTo} />}
      {quakes.length > 0 && mode === 'regions' && <RegionTable d={d} quakes={quakes} volcanoes={volcanoes} days={days} onGoTo={onGoTo} history={history} />}
      {quakes.length > 0 && mode === 'dist' && <Distributions quakes={quakes} />}
      {quakes.length > 0 && mode !== 'dist' && (
        <p className={styles.hint3d}>{k.a_moment_note.replace('{n}', nf.format(mw)).replace('{m}', nf.format(quakes.length))}</p>
      )}
      {mode === 'regions' && <p className={styles.hint3d}>{k.a_mc_note.replace('{n}', nf.format(MC_MIN_EVENTS))}</p>}
      <p className={styles.hint3d}>{k.a_observed}</p>
      <p className={styles.hint3d}>{k.a_not}</p>
    </section>
  );
}

/** Moment in N·m as a short number ("3.2 × 10¹⁹ N·m"). */
function momentText(m0: number, f: Intl.NumberFormat) {
  if (m0 <= 0) return '0';
  const e = Math.floor(Math.log10(m0)), sup = String(e).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] ?? c).join('');
  return `${f.format(m0 / 10 ** e)} × 10${sup} N·m`;
}

function RouteChart({ d, quakes, days, view, onGoTo }: {
  d: RibbonResponse; quakes: RibbonQuake[]; days: number; view: { x0: number; x1: number } | null; onGoTo: (x0: number, x1: number) => void;
}) {
  const { m, nf, locale } = useT();
  const k = m.ribbon;
  const dist = useDistance();
  const f2 = useMemo(() => new Intl.NumberFormat(locale, { maximumSignificantDigits: 2 }), [locale]);
  const [metric, setMetric] = useState<'rate' | 'moment'>('rate');
  const [pick, setPick] = useState<number | null>(null);
  const bins = useMemo(() => alongRoute(quakes, d.lengthKm, BIN_KM, days), [quakes, d.lengthKm, days]);
  const vals = useMemo(() => bins.map(b => (metric === 'rate' ? b.perDay100 : b.moment)), [bins, metric]);
  const max = Math.max(...vals, 0);
  const wrap = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(0);
  const H = 140, TOP = 18, BOT = 22;
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = canvas.current;
    if (!c || !w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * dpr); c.height = Math.round(H * dpr);
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = BG; g.fillRect(0, 0, w, H);
    const sx = (x: number) => (x / d.lengthKm) * w;
    // The stretch shown on the ribbon.
    if (view) { g.fillStyle = 'rgba(242, 179, 61, .16)'; g.fillRect(sx(Math.max(0, view.x0)), TOP - 6, Math.max(2, sx(Math.min(d.lengthKm, view.x1)) - sx(Math.max(0, view.x0))), H - TOP - BOT + 6); }
    // Joins between arcs, shaded.
    g.fillStyle = 'rgba(190, 205, 230, .06)';
    for (const gp of d.gaps) g.fillRect(sx(gp.x0), TOP, sx(gp.x1) - sx(gp.x0), H - TOP - BOT);
    g.strokeStyle = GRID; g.lineWidth = 1; g.beginPath(); g.moveTo(0, H - BOT + 0.5); g.lineTo(w, H - BOT + 0.5); g.stroke();
    // Bars: thin, with a 1 px gap, rounded tops.
    const plotH = H - TOP - BOT;
    bins.forEach((b, i) => {
      const v = vals[i];
      if (v <= 0 || max <= 0) return;
      const x0 = sx(b.x0) + 0.5, bw = Math.max(1, sx(b.x1) - sx(b.x0) - 1), bh = Math.max(1.5, (v / max) * plotH);
      g.fillStyle = metric === 'rate' ? BAR_RATE : BAR_MOMENT;
      g.globalAlpha = pick === null || pick === i ? 1 : 0.55;
      g.beginPath(); g.roundRect(x0, H - BOT - bh, bw, bh, [Math.min(2, bw / 2), Math.min(2, bw / 2), 0, 0]); g.fill();
    });
    g.globalAlpha = 1;
    // Distance ticks every 10,000 km.
    g.fillStyle = TEXT; g.font = '600 11px system-ui, sans-serif'; g.textBaseline = 'alphabetic';
    for (let x = 10000; x < d.lengthKm; x += 10000) { g.textAlign = 'center'; g.fillText(dist.dist(x), sx(x), H - 6); }
    g.textAlign = 'left';
    g.fillText(metric === 'rate' ? k.a_max_rate.replace('{v}', f2.format(max)) : k.a_max_moment.replace('{v}', momentText(max, f2)), 6, 13);
  }, [w, bins, vals, metric, max, view, d.lengthKm, d.gaps, pick, dist, k, f2]);

  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.max(0, Math.min(bins.length - 1, Math.floor((((e.clientX - r.left) / r.width) * d.lengthKm) / BIN_KM)));
    setPick(i); onGoTo(bins[i].x0, bins[i].x1);
  };
  const b = pick !== null ? bins[pick] : null;
  return (
    <div className={styles.analysisBlock}>
      <div className={data.seg} role="tablist" aria-label={k.a_metric}>
        <button type="button" role="tab" aria-selected={metric === 'rate'} onClick={() => setMetric('rate')}>{k.a_metric_rate}</button>
        <button type="button" role="tab" aria-selected={metric === 'moment'} onClick={() => setMetric('moment')}>{k.a_metric_moment}</button>
      </div>
      <div ref={wrap} className={styles.mapWrap}>
        <canvas ref={canvas} role="img" style={{ width: '100%', height: H, display: 'block' }} onPointerUp={tap}
          aria-label={k.a_route_label.replace('{metric}', metric === 'rate' ? k.a_metric_rate : k.a_metric_moment).replace('{km}', dist.dist(BIN_KM))} />
      </div>
      <p className={styles.hint3d} aria-live="polite">
        {b ? k.a_bin.replace('{a}', dist.dist(b.x0)).replace('{b}', dist.dist(b.x1)).replace('{n}', nf.format(b.count))
          .replace('{rate}', f2.format(b.perDay100)).replace('{m}', b.moment > 0 ? `${momentText(b.moment, f2)} (Mw ${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(mwOf(b.moment)!)})` : '–')
          : k.a_tap}
      </p>
    </div>
  );
}

function RegionTable({ d, quakes, volcanoes, days, onGoTo, history }: {
  d: RibbonResponse; quakes: RibbonQuake[]; volcanoes: RibbonVolcano[]; days: number; onGoTo: (x0: number, x1: number) => void; history: boolean;
}) {
  const { m, nf, locale } = useT();
  const k = m.ribbon;
  const dist = useDistance();
  const f2 = new Intl.NumberFormat(locale, { maximumSignificantDigits: 2 });
  const f1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rows = useMemo(() => byRegion(quakes, d.regions, d.gaps, volcanoes, days), [quakes, d.regions, d.gaps, volcanoes, days]);
  const dash = '–';
  return (
    <div className={styles.tableWrap} role="region" aria-label={k.a_regions} tabIndex={0}>
      <table className={styles.aTable}>
        <thead>
          <tr>
            <th scope="col">{k.a_h_region}</th>
            <th scope="col">{k.a_h_count}</th>
            <th scope="col">{k.a_h_rate}</th>
            <th scope="col">{k.a_h_moment}</th>
            <th scope="col">{k.a_h_volc}</th>
            <th scope="col">{history ? k.a_h_reported_now : k.a_h_reported}</th>
            <th scope="col">{k.a_h_min}</th>
            <th scope="col">{k.a_h_mc}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const reg = r.group === 'joins' ? null : d.regions.find(x => x.group === r.group)!;
            return (
              <tr key={r.group}>
                <th scope="row">
                  {reg ? <button type="button" onClick={() => onGoTo(reg.x0, reg.x1)}>{k.regions[reg.group]}</button> : k.a_joins}
                  <small>{dist.dist(r.lengthKm)}</small>
                </th>
                <td>{nf.format(r.count)}</td>
                <td>{r.count ? f2.format(r.perDay1000) : dash}</td>
                <td>{r.mwTotal !== null ? `Mw ${f1.format(r.mwTotal)}` : dash}<small>{r.mwCount ? k.a_of_mw.replace('{n}', nf.format(r.mwCount)) : ''}</small></td>
                <td>{r.group === 'joins' ? dash : f2.format(r.volcPer1000)}</td>
                <td>{r.group === 'joins' ? dash : nf.format(r.reported)}</td>
                <td>{r.minMag !== null ? f1.format(r.minMag) : dash}</td>
                <td>{r.mcEstimate !== null ? `≈ ${f1.format(r.mcEstimate)}` : dash}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Distributions({ quakes }: { quakes: RibbonQuake[] }) {
  const { m, nf, locale } = useT();
  const k = m.ribbon;
  const dist = useDistance();
  const f1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const mags = useMemo(() => magHistogram(quakes), [quakes]);
  const depths = useMemo(() => depthHistogram(quakes), [quakes]);
  const mMax = Math.max(1, ...mags.map(b => b.count)), dMax = Math.max(1, ...depths.map(b => b.count));
  return (
    <div className={styles.dists}>
      <div>
        <h3>{k.a_mag_h}</h3>
        <ul className={styles.hbars}>
          {mags.map(b => (
            <li key={b.m0}>
              <span>{f1.format(b.m0)}–{f1.format(b.m0 + 0.5)}</span>
              <i style={{ width: `${(b.count / mMax) * 100}%`, background: '#F2B33D' }} aria-hidden="true" />
              <b>{nf.format(b.count)}</b>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>{k.a_depth_h}</h3>
        <ul className={styles.hbars}>
          {depths.map(b => (
            <li key={b.band}>
              <span>{Number.isFinite(b.max) ? `${b.band === 0 ? '<' : ''} ${b.band === 0 ? dist.depth(b.max) : `${dist.depth(b.min)}–${dist.depth(b.max)}`}` : `≥ ${dist.depth(b.min)}`}</span>
              <i style={{ width: `${(b.count / dMax) * 100}%`, background: b.color }} aria-hidden="true" />
              <b>{nf.format(b.count)}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
