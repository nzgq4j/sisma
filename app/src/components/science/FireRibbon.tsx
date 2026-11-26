'use client';
// Science → Pacific Fire Ribbon: the Ring of Fire unrolled into one long depth profile (docs/fire-ribbon.md). Earthquakes
// from GET /api/science/ribbon (sisma+; the API re-checks the plan), placed by distance along the route (across) and
// depth (down). Checked again once an hour; when a check fails the last data stays, marked as such.
// The plot is a canvas the width of the screen inside a sideways-scrolling strip (zoom widens the strip), so the page
// still scrolls normally on phones and only the visible part is drawn.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useAccount } from '@/components/Account';
import { useDistance } from '@/components/Units';
import { KM_PER_MI } from '@/lib/units';
import { TRIAL_DAYS } from '@/lib/entitlements';
import {
  DEPTH_BANDS, GROUPS, MIN_MAGS, PERIODS, POLL_MS, STALE_MS, depthColour, fromRow, markerOpacity, markerRadius,
  type MinMag, type Period, type RibbonQuake, type RibbonResponse,
} from '@/lib/ribbon/shared';
import data from './data.module.css';
import styles from './ribbon.module.css';

/** The time, to the minute, for ages and fading (re-renders once a minute). */
function useMinute() {
  return useSyncExternalStore(f => { const id = setInterval(f, 15_000); return () => clearInterval(id); },
    () => Math.floor(Date.now() / 60_000) * 60_000, () => 0);
}

type Load = { s: 'loading' } | { s: 'error' } | { s: 'ready'; d: RibbonResponse; quakes: RibbonQuake[]; okAt: number; failedAt: number | null; fresh: Set<string> };

/** Loads the ribbon with the person's session, again every hour while the page is open (and on return to the tab
 * when an hour has passed). A failed check keeps the last data. New earthquakes since the previous check are flagged. */
function useRibbon(enabled: boolean, period: Period, min: MinMag) {
  const { accessToken } = useAccount();
  const [st, setSt] = useState<Load>({ s: 'loading' });
  const prev = useRef<{ key: string; ids: Set<string> } | null>(null);
  const load = useCallback(async (signal: { alive: boolean }) => {
    const token = await accessToken().catch(() => null);
    const r = await fetch(`/api/science/ribbon?period=${period}&min=${min}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
    const d = r?.ok ? ((await r.json()) as RibbonResponse) : null;
    if (!signal.alive) return;
    const key = `${period}:${min}`;
    if (!d) { setSt(s => (s.s === 'ready' && prev.current?.key === key ? { ...s, failedAt: Date.now() } : { s: 'error' })); return; }
    const quakes = d.rows.map(fromRow);
    const ids = new Set(quakes.map(q => q.id));
    const before = prev.current?.key === key ? prev.current.ids : null;
    prev.current = { key, ids };
    setSt({ s: 'ready', d, quakes, okAt: Date.now(), failedAt: null, fresh: before ? new Set([...ids].filter(i => !before.has(i))) : new Set() });
  }, [accessToken, period, min]);
  useEffect(() => {
    if (!enabled) return;
    const signal = { alive: true };
    let last = Date.now();
    const run = () => { last = Date.now(); void load(signal); };
    run();
    const id = setInterval(run, POLL_MS);
    const vis = () => { if (document.visibilityState === 'visible' && Date.now() - last >= POLL_MS) run(); };
    document.addEventListener('visibilitychange', vis);
    return () => { signal.alive = false; clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, [enabled, load]);
  return st;
}

export function FireRibbonPage() {
  const { m, t, nf, locale } = useT();
  const k = m.ribbon;
  const { plan, setSheet } = useApp();
  const { user } = useAccount();
  const plus = plan === 'plus';
  const [period, setPeriod] = useState<Period>('month');
  const [min, setMin] = useState<MinMag>(2.5);
  const st = useRibbon(plus, period, min);
  const [sel, setSel] = useState<string | null>(null);
  const [jump, setJump] = useState<{ x0: number; x1: number; n: number } | null>(null);
  const quakes = useMemo(() => (st.s === 'ready' ? st.quakes : []), [st]);
  const selected = quakes.find(q => q.id === sel) ?? null;
  const largest = useMemo(() => [...quakes].filter(q => q.mag !== null).sort((a, b) => (b.mag ?? 0) - (a.mag ?? 0)).slice(0, 8), [quakes]);
  const now = useMinute();
  const when = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const mag1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rel = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const ago = (ms: number) => { const mins = Math.max(0, Math.round((now - ms) / 60_000)); return mins < 90 ? rel.format(-mins, 'minute') : rel.format(-Math.round(mins / 60), 'hour'); };

  const locked = (
    <div className={data.locked}>
      <span className="ms" aria-hidden="true">lock</span>
      <div>
        <strong>{k.locked_h}</strong>
        <p>{user ? k.locked_p : k.signin_p}</p>
        <button type="button" className={data.lockedBtn} onClick={() => setSheet('paywall')}>{t('trial', { n: TRIAL_DAYS })}</button>
      </div>
    </div>
  );

  return (
    <div className={data.page}>
      <h1 className={data.h1}>{k.h1} <span className={data.badge}>{k.plus}</span></h1>
      <p className={data.lead}>{k.lead}</p>
      {!plus && locked}
      {plus && (
        <section className={`${data.card} ${styles.card}`}>
          <div className={styles.controls}>
            <div className={data.seg} role="tablist" aria-label={k.period}>
              {PERIODS.map(p => (
                <button key={p} type="button" role="tab" aria-selected={period === p} onClick={() => { setPeriod(p); setSel(null); }}>
                  {k[`period_${p}`]}
                </button>
              ))}
            </div>
            <div className={data.seg} role="tablist" aria-label={k.min}>
              {MIN_MAGS.map(v => (
                <button key={v} type="button" role="tab" aria-selected={min === v} onClick={() => { setMin(v); setSel(null); }}>
                  {v === 0 ? k.min_all : `M${nf.format(v)}+`}
                </button>
              ))}
            </div>
          </div>
          {st.s === 'loading' && <p className={data.status}>{k.loading}</p>}
          {st.s === 'error' && <p className={data.status} role="alert">{k.error}</p>}
          {st.s === 'ready' && (
            <>
              <Status d={st.d} okAt={st.okAt} failedAt={st.failedAt} fresh={st.fresh.size} when={when} ago={ago} now={now} />
              <label className={styles.jump}>
                <span>{k.go_to}</span>
                <select value="" onChange={e => {
                  const v = e.target.value;
                  if (v === 'all') setJump({ x0: -st.d.corridor.endKm, x1: st.d.lengthKm + st.d.corridor.endKm, n: Date.now() });
                  else { const r = st.d.regions.find(g => g.group === v); if (r) setJump({ x0: r.x0, x1: r.x1, n: Date.now() }); }
                }}>
                  <option value="" disabled>{k.go_to}</option>
                  <option value="all">{k.whole}</option>
                  {st.d.regions.map(r => <option key={r.group} value={r.group}>{k.regions[r.group]}</option>)}
                </select>
              </label>
              <Plot d={st.d} quakes={quakes} period={period} fresh={st.fresh} selected={sel} onSelect={setSel} jump={jump} now={now} />
              <Key />
              {quakes.length === 0 && <p className={data.status}>{k.none}</p>}
              {selected && <Detail q={selected} onClose={() => setSel(null)} when={when} />}
              {largest.length > 0 && (
                <div className={styles.largest}>
                  <h2>{k.largest}</h2>
                  <ul>
                    {largest.map(q => (
                      <li key={q.id}>
                        <button type="button" aria-pressed={q.id === sel} onClick={() => { setSel(q.id); setJump({ x0: q.x - 400, x1: q.x + 400, n: Date.now() }); }}>
                          <i style={{ background: depthColour(q.depth) }} aria-hidden="true" />
                          <b>M{q.mag !== null ? mag1.format(q.mag) : '–'}</b>
                          <span>{q.place ?? k.regions[GROUPS[q.from]]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      )}
      <section className={data.card}>
        <h2>{k.notes_h}</h2>
        <ul className={data.notes}>{[k.note_1, k.note_2, k.note_3, k.note_4, k.note_5].map(n => <li key={n}>{n}</li>)}</ul>
        <p className={styles.source}>{k.source}</p>
      </section>
    </div>
  );
}

function Status({ d, okAt, failedAt, fresh, when, ago, now }: {
  d: RibbonResponse; okAt: number; failedAt: number | null; fresh: number; when: Intl.DateTimeFormat; ago: (ms: number) => string; now: number;
}) {
  const { m, nf } = useT();
  const k = m.ribbon;
  const published = d.generated ?? d.retrieved;
  const stale = failedAt !== null || now - published > STALE_MS;
  return (
    <div className={styles.status} aria-live="polite">
      <p>
        <span className={stale ? styles.stale : styles.fresh}><i aria-hidden="true" />{stale ? k.stale : k.fresh}</span>
        {' · '}{k.published.replace('{time}', when.format(published)).replace('{age}', ago(published))}
        {' · '}{k.checked.replace('{time}', when.format(okAt))}
      </p>
      {failedAt !== null && <p role="alert">{k.refresh_failed}</p>}
      <p>
        {k.count.replace('{n}', nf.format(d.rows.length)).replace('{m}', nf.format(d.counts.feed))}
        {fresh > 0 && <> · {k.new.replace('{n}', nf.format(fresh))}</>}
        {' · '}{k.hourly}
      </p>
    </div>
  );
}

function Key() {
  const { m, nf } = useT();
  const k = m.ribbon;
  const dist = useDistance();
  const edges = [0, ...DEPTH_BANDS.map(b => b.max)];
  return (
    <div className={styles.key}>
      <p className={styles.keyRow}>
        <b>{k.key_depth}</b>
        {DEPTH_BANDS.map((b, i) => (
          <span key={b.color}>
            <i style={{ background: b.color }} aria-hidden="true" />
            {b.max === Infinity ? `> ${dist.depth(edges[i])}` : `${nf.format(Math.round(dist.units === 'mi' ? edges[i] / KM_PER_MI : edges[i]))}–${dist.depth(b.max)}`}
          </span>
        ))}
      </p>
      <p className={styles.keyRow}>
        <b>{k.key_size}</b>
        {[3, 5, 7].map(mg => (
          <span key={mg}><svg width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r={markerRadius(mg)} className={styles.keyDot} /></svg>M{mg}</span>
        ))}
        <span><i className={styles.gapSwatch} aria-hidden="true" />{k.no_arc}</span>
      </p>
      <p className={styles.keyNote}>{k.key_age} {k.key_scale}</p>
    </div>
  );
}

function Detail({ q, onClose, when }: { q: RibbonQuake; onClose: () => void; when: Intl.DateTimeFormat }) {
  const { m, nf, locale } = useT();
  const k = m.ribbon;
  const dist = useDistance();
  const f1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const f2 = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const na = <span className={styles.na}>{k.d_none}</span>;
  const region = q.from === q.to ? k.regions[GROUPS[q.from]] : k.d_between.replace('{a}', k.regions[GROUPS[q.from]]).replace('{b}', k.regions[GROUPS[q.to]]);
  const rows: [string, React.ReactNode][] = [
    [k.d_mag, q.mag === null ? na : `${f1.format(q.mag)}${q.magType ? ` ${q.magType}` : ''}${q.magErr !== null ? ` ± ${f2.format(q.magErr)}` : ''}`],
    [k.d_time, when.format(q.time)],
    [k.d_updated, when.format(q.updated)],
    [k.d_depth, `${dist.depth(q.depth)}${q.dErr !== null ? ` ± ${dist.depth(q.dErr)}` : ''}`],
    [k.d_coords, `${f2.format(q.lat)}°, ${f2.format(q.lon)}°`],
    [k.d_loc_err, q.hErr === null ? na : `± ${dist.depth(q.hErr)}`],
    [k.d_status, q.status === 'reviewed' ? k.d_reviewed : q.status === 'automatic' ? k.d_automatic : (q.status ?? na)],
    [k.d_route, `${region} · ${k.d_route_v.replace('{x}', dist.dist(q.x)).replace('{y}', dist.dist(Math.abs(q.y))).replace('{side}', q.y >= 0 ? k.d_left : k.d_right)}`],
    [k.d_sig, q.sig === null ? na : nf.format(q.sig)],
    [k.d_felt, q.felt === null ? na : nf.format(q.felt)],
    [k.d_cdi, q.cdi === null ? na : f1.format(q.cdi)],
    [k.d_mmi, q.mmi === null ? na : f1.format(q.mmi)],
    [k.d_alert, q.alert ?? na],
    [k.d_tsunami, q.tsunami ? k.d_tsunami_yes : k.d_tsunami_no],
    [k.d_network, q.net ?? na],
    [k.d_stations, q.nst === null ? na : nf.format(q.nst)],
    [k.d_gap, q.gap === null ? na : `${f1.format(q.gap)}°`],
    [k.d_rms, q.rms === null ? na : `${f2.format(q.rms)} s`],
  ];
  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <i style={{ background: depthColour(q.depth) }} aria-hidden="true" />
        <h2>{q.place ?? region}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label={k.d_close}><span className="ms" aria-hidden="true">close</span></button>
      </div>
      <dl>
        {rows.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}
      </dl>
      <a href={q.url} target="_blank" rel="noopener noreferrer" className={styles.usgs}>{k.d_usgs}<span className="ms" aria-hidden="true">open_in_new</span></a>
    </div>
  );
}

// ——— The plot ———

const H = 360, TOP = 34, BOTTOM = 26, GUTTER = 44, RIGHT_PAD = 10;
const BG = '#0B1220', GRID = 'rgba(190, 205, 230, .13)', TEXT = 'rgba(214, 224, 240, .82)', MUTED = 'rgba(190, 205, 230, .55)';
const ZOOMS = [1, 2, 4, 8, 16, 32, 64];

function Plot({ d, quakes, period, fresh, selected, onSelect, jump, now }: {
  d: RibbonResponse; quakes: RibbonQuake[]; period: Period; fresh: Set<string>; selected: string | null;
  onSelect: (id: string | null) => void; jump: { x0: number; x1: number; n: number } | null; now: number;
}) {
  const { m, nf, locale } = useT();
  const k = m.ribbon;
  const dist = useDistance();
  const mag1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [scroll, setScroll] = useState(0);
  const [hover, setHover] = useState<{ q: RibbonQuake; px: number; py: number } | null>(null);
  const [pulse, setPulse] = useState(0);
  const xMin = -d.corridor.endKm, xMax = d.lengthKm + d.corridor.endKm;
  const plotW = Math.max(1, width - GUTTER - RIGHT_PAD) * zoom;
  const maxDepth = Math.max(700, ...quakes.map(q => q.depth));
  const unit = dist.units === 'mi' ? KM_PER_MI : 1;
  const depthMax = Math.ceil(maxDepth / unit / 100) * 100 * unit;
  const sx = useCallback((x: number) => GUTTER + ((x - xMin) / (xMax - xMin)) * plotW - scroll, [xMin, xMax, plotW, scroll]);
  const sy = useCallback((z: number) => TOP + (Math.max(0, z) / depthMax) * (H - TOP - BOTTOM), [depthMax]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Zoom keeping the middle of the view (or a given place) in the middle. The scroll position is applied after the
  // wider strip has rendered, so the browser doesn't clamp it to the old width.
  const pending = useRef<number | null>(null);
  const zoomTo = useCallback((z: number, centreKm?: number) => {
    const el = wrap.current;
    if (!el || !width) return;
    const w = Math.max(1, width - GUTTER - RIGHT_PAD);
    pending.current = centreKm ?? xMin + ((el.scrollLeft + w / 2) / (w * zoom)) * (xMax - xMin);
    if (z === zoom) { const mid = pending.current; pending.current = null; el.scrollLeft = Math.max(0, ((mid - xMin) / (xMax - xMin)) * w * z - w / 2); setScroll(el.scrollLeft); }
    else setZoom(z);
  }, [width, zoom, xMin, xMax]);
  useLayoutEffect(() => {
    const el = wrap.current, mid = pending.current;
    if (!el || mid === null || !width) return;
    pending.current = null;
    const w = Math.max(1, width - GUTTER - RIGHT_PAD);
    el.scrollLeft = Math.max(0, ((mid - xMin) / (xMax - xMin)) * w * zoom - w / 2);
    setScroll(el.scrollLeft);
  }, [zoom, width, xMin, xMax]);

  useEffect(() => {
    if (!jump || !width) return;
    const want = (xMax - xMin) / Math.max(1, (jump.x1 - jump.x0) * 1.3 + 300);
    const z = ZOOMS.reduce((a, b) => (b <= want ? b : a), 1);
    zoomTo(z, (jump.x0 + jump.x1) / 2);
  }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps

  // A short, restrained glow on earthquakes that arrived with the latest check.
  useEffect(() => {
    if (!fresh.size) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => { const p = Math.min(1, (now - start) / 2400); setPulse(1 - p); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fresh]);

  const drawn = useMemo(() => [...quakes].sort((a, b) => (a.mag ?? 0) - (b.mag ?? 0)), [quakes]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(width * dpr); c.height = Math.round(H * dpr);
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = BG; g.fillRect(0, 0, width, H);
    g.save();
    g.beginPath(); g.rect(GUTTER, 0, width - GUTTER, H); g.clip();

    // Stretches with no volcanic arc: hatched.
    for (const gp of d.gaps) {
      const a = sx(gp.x0), b = sx(gp.x1);
      if (b < GUTTER || a > width) continue;
      g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(a, TOP, b - a, H - TOP - BOTTOM);
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
      g.beginPath();
      for (let x = a - (H - TOP - BOTTOM); x < b; x += 10) { g.moveTo(Math.max(a, x), TOP + Math.max(0, a - x)); g.lineTo(Math.min(b, x + (H - TOP - BOTTOM)), TOP + Math.min(H - TOP - BOTTOM, b - x)); }
      g.stroke();
      if (b - a > 90) { g.fillStyle = MUTED; g.font = '600 10px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(k.no_arc, (a + b) / 2, H - BOTTOM - 8); }
    }
    // Region boundaries and names.
    g.font = '600 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let labelEnd = -Infinity; // names that would touch the previous one are left out
    for (const r of d.regions) {
      const a = sx(r.x0), b = sx(r.x1);
      if (b < GUTTER - 200 || a > width + 200) continue;
      g.strokeStyle = GRID; g.lineWidth = 1; g.setLineDash([]);
      g.beginPath(); g.moveTo(Math.round(a) + 0.5, TOP - 6); g.lineTo(Math.round(a) + 0.5, H - BOTTOM); g.stroke();
      const name = k.regions[r.group];
      const w = g.measureText(name).width;
      const mid = Math.min(Math.max((a + b) / 2, GUTTER + w / 2 + 4), width - w / 2 - 4);
      if (Math.max(b - a, 0) + 40 > w || zoom >= 8) {
        if (mid > a - 20 && mid < b + 20 && mid - w / 2 > labelEnd + 8) { g.fillStyle = TEXT; g.fillText(name, mid, 14); labelEnd = mid + w / 2; }
      }
    }
    // Depth grid.
    g.setLineDash([3, 5]); g.strokeStyle = GRID;
    for (let z = 100 * unit; z <= depthMax + 1e-6; z += 100 * unit) { const y = Math.round(sy(z)) + 0.5; g.beginPath(); g.moveTo(GUTTER, y); g.lineTo(width, y); g.stroke(); }
    g.setLineDash([]);
    // Surface (depth 0): the route itself; terrain comes in a later step.
    g.strokeStyle = 'rgba(255, 170, 110, .55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(GUTTER, sy(0)); g.lineTo(width, sy(0)); g.stroke();

    // Earthquakes, smallest first so the largest sit on top; a surface-coloured ring separates overlapping dots.
    for (const q of drawn) {
      const x = sx(q.x);
      if (x < GUTTER - 12 || x > width + 12) continue;
      const y = sy(q.depth), r = markerRadius(q.mag);
      g.globalAlpha = markerOpacity(now - q.time, period);
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = depthColour(q.depth); g.fill();
      if (r >= 3) { g.lineWidth = 1.5; g.strokeStyle = BG; g.stroke(); }
      if (pulse > 0 && fresh.has(q.id)) {
        g.globalAlpha = 0.6 * pulse; g.lineWidth = 1.5; g.strokeStyle = depthColour(q.depth);
        g.beginPath(); g.arc(x, y, r + 3 + (1 - pulse) * 8, 0, Math.PI * 2); g.stroke();
      }
    }
    g.globalAlpha = 1;
    for (const id of [hover?.q.id, selected]) {
      const q = id ? quakes.find(e => e.id === id) : null;
      if (!q) continue;
      const x = sx(q.x), y = sy(q.depth);
      g.lineWidth = 2; g.strokeStyle = '#FFFFFF';
      g.beginPath(); g.arc(x, y, markerRadius(q.mag) + 4, 0, Math.PI * 2); g.stroke();
    }
    g.restore();

    // Depth axis (fixed on the left) and distance along the route (bottom).
    g.fillStyle = BG; g.fillRect(0, 0, GUTTER, H);
    g.fillStyle = MUTED; g.font = '600 10px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let z = 0; z <= depthMax + 1e-6; z += 100 * unit) g.fillText(nf.format(Math.round(z / unit)), GUTTER - 6, sy(z));
    g.save(); g.translate(11, (TOP + H - BOTTOM) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center';
    g.fillText(`${k.depth_axis} (${dist.unit})`, 0, 0); g.restore();
    const kmPerPx = (xMax - xMin) / plotW;
    const step = [250, 500, 1000, 2000, 5000, 10000].find(s => (s * unit) / kmPerPx >= 80) ?? 10000;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (let v = 0; v * unit <= d.lengthKm; v += step) {
      const x = sx(v * unit);
      if (x < GUTTER + 12 || x > width - 12) continue;
      g.fillText(`${nf.format(v)} ${dist.unit}`, x, H - 8);
    }
  }, [width, d, drawn, quakes, sx, sy, zoom, depthMax, unit, hover, selected, pulse, fresh, period, now, k, nf, dist, xMin, xMax, plotW]);

  const nearest = (clientX: number, clientY: number) => {
    const c = canvas.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const px = clientX - rect.left, py = clientY - rect.top;
    let best: RibbonQuake | null = null, bd = 16;
    for (const q of quakes) {
      const dd = Math.hypot(sx(q.x) - px, sy(q.depth) - py) - markerRadius(q.mag);
      if (dd < bd) { bd = dd; best = q; }
    }
    return best ? { q: best, px, py } : null;
  };

  const zi = ZOOMS.indexOf(zoom);
  return (
    <div className={styles.plotWrap}>
      <div ref={wrap} className={styles.scroller} tabIndex={0} role="region" aria-label={k.chart_label.replace('{n}', nf.format(quakes.length))}
        onScroll={e => setScroll(e.currentTarget.scrollLeft)}>
        <div style={{ width: GUTTER + plotW + RIGHT_PAD, height: H }} className={styles.track}>
          <canvas ref={canvas} className={styles.canvas} style={{ width, height: H }}
            onPointerMove={e => { if (e.pointerType === 'mouse') setHover(nearest(e.clientX, e.clientY)); }}
            onPointerLeave={() => setHover(null)}
            onClick={e => { const n = nearest(e.clientX, e.clientY); onSelect(n ? n.q.id : null); }} />
        </div>
      </div>
      {hover && (
        <div className={styles.tip} style={{ left: Math.min(Math.max(8, hover.px + 12), width - 200), top: Math.max(8, hover.py - 60) }}>
          <b>M{hover.q.mag !== null ? mag1.format(hover.q.mag) : '–'}</b> · {dist.depth(hover.q.depth)}
          <span>{hover.q.place ?? k.regions[GROUPS[hover.q.from]]}</span>
        </div>
      )}
      <div className={styles.zoom}>
        <button type="button" onClick={() => zoomTo(ZOOMS[Math.max(0, zi - 1)])} disabled={zi <= 0} aria-label={k.zoom_out}><span className="ms" aria-hidden="true">remove</span></button>
        <span>{k.zoom.replace('{n}', nf.format(zoom))}</span>
        <button type="button" onClick={() => zoomTo(ZOOMS[Math.min(ZOOMS.length - 1, zi + 1)])} disabled={zi >= ZOOMS.length - 1} aria-label={k.zoom_in}><span className="ms" aria-hidden="true">add</span></button>
      </div>
    </div>
  );
}

