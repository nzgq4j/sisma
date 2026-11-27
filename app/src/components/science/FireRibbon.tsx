'use client';
// Science → Pacific Fire Ribbon: the Ring of Fire unrolled into one long depth profile (docs/fire-ribbon.md). Earthquakes
// from GET /api/science/ribbon (sisma+; the API re-checks the plan), placed by distance along the route (across) and
// depth (down). Checked again once an hour; when a check fails the last data stays, marked as such.
// Volcanoes from GET /api/science/ribbon/volcanoes (Smithsonian catalogue; status from this week's Smithsonian / USGS
// Weekly Volcanic Activity Report) are triangles above the surface line.
// The plot is a canvas the width of the screen inside a sideways-scrolling strip (zoom widens the strip), so the page
// still scrolls normally on phones and only the visible part is drawn.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useAccount } from '@/components/Account';
import { useDistance } from '@/components/Units';
import { KM_PER_MI } from '@/lib/units';
import { TRIAL_DAYS } from '@/lib/entitlements';
import dynamic from 'next/dynamic';
import { Sheet, SheetOptions } from '@/components/Sheet';
import type { Camera3D } from './Ribbon3D';
import { RibbonShareSheet } from './RibbonShare';
import {
  HistoryControls, HistoryStatus, Player, presetRange, trailPeriod, useHistory, usePlayback, visibleQuakes,
  type HistoryRange, type Preset, type Trail,
} from './RibbonHistory';
import type { DepthFilter } from '@/lib/ribbon/history';
import type { RibbonVolcano, VolcanoResponse, VolcanoStatus } from '@/lib/ribbon/volcanoes';
import {
  DEPTH_BANDS, GROUPS, MIN_MAGS, PERIODS, POLL_MS, RELIEF, STALE_MS, depthColour, fromRow, markerOpacity, markerRadius,
  type GroupId, type MinMag, type Period, type Relief, type RibbonQuake, type RibbonResponse, type TerrainResponse,
} from '@/lib/ribbon/shared';

const NO_QUAKES: RibbonQuake[] = [];
const NO_IDS = new Set<string>();
import data from './data.module.css';
import styles from './ribbon.module.css';

/** The 3D view (Three.js), loaded only when someone switches to it. */
const Ribbon3D = dynamic(() => import('./Ribbon3D'), { ssr: false });
const SPANS = [800, 1600, 3200];

/** The time, to the minute, for ages and fading (re-renders once a minute). */
function useMinute() {
  return useSyncExternalStore(f => { const id = setInterval(f, 15_000); return () => clearInterval(id); },
    () => Math.floor(Date.now() / 60_000) * 60_000, () => 0);
}

/** Volcano marker colours by status (lib/ribbon/volcanoes.ts), from the brief: white catalogued, amber new unrest,
 * orange new eruptive activity, red continuing eruption, grey status unavailable. Other observations stay white. */
export const VOLCANO_COLOURS: Record<VolcanoStatus, string> = {
  catalogued: '#E9EDF5', other: '#E9EDF5', new_unrest: '#FFC233', new_eruptive: '#FF8A2A', continuing: '#FF4040', unknown: '#7D879B',
};
const STATUS_ORDER: VolcanoStatus[] = ['continuing', 'new_eruptive', 'new_unrest', 'other', 'catalogued', 'unknown'];
const reported = (v: RibbonVolcano) => v.status !== 'catalogued' && v.status !== 'unknown';

type VLoad = { s: 'loading' } | { s: 'error' } | { s: 'ready'; d: VolcanoResponse };
/** Volcanoes, loaded with the person's session and again every hour while the page is open. */
function useVolcanoes(enabled: boolean) {
  const { accessToken } = useAccount();
  const [st, setSt] = useState<VLoad>({ s: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const run = async () => {
      const token = await accessToken().catch(() => null);
      const r = await fetch('/api/science/ribbon/volcanoes', { headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
      const d = r?.ok ? ((await r.json()) as VolcanoResponse) : null;
      if (alive) setSt(s => (d ? { s: 'ready', d } : s.s === 'ready' ? s : { s: 'error' }));
    };
    void run();
    const id = setInterval(run, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [enabled, accessToken]);
  return st;
}

type TLoad = { s: 'loading' } | { s: 'error' } | { s: 'ready'; d: TerrainResponse };
/** The terrain profile: loaded once (it changes only when rebuilt from ETOPO). */
function useTerrain(enabled: boolean) {
  const { accessToken } = useAccount();
  const [st, setSt] = useState<TLoad>({ s: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    void (async () => {
      const token = await accessToken().catch(() => null);
      const r = await fetch('/api/science/ribbon/terrain', { headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
      const d = r?.ok ? ((await r.json()) as TerrainResponse) : null;
      if (alive) setSt(d ? { s: 'ready', d } : { s: 'error' });
    })();
    return () => { alive = false; };
  }, [enabled, accessToken]);
  return st;
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
  const vst = useVolcanoes(plus);
  const tst = useTerrain(plus);
  const [relief, setRelief] = useState<Relief>('enhanced');
  const [sel, setSel] = useState<string | null>(null);
  const [selV, setSelV] = useState<number | null>(null);
  const [show, setShow] = useState({ quakes: true, volcanoes: true, terrain: true });
  const [picker, setPicker] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [region, setRegion] = useState<string | null>(null);
  const pickQuake = (id: string | null) => { setSel(id); if (id) setSelV(null); };
  const pickVolcano = (n: number | null) => { setSelV(n); if (n !== null) setSel(null); };
  const [jump, setJump] = useState<{ x0: number; x1: number; n: number } | null>(null);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [cam, setCam] = useState<Camera3D>('oblique');
  const [win, setWin] = useState<{ centre: number; span: number } | null>(null);
  /** Moves both views to a stretch of the route: the profile zooms to it, the 3D window centres on it. */
  const goTo = (x0: number, x1: number) => {
    setJump({ x0, x1, n: Date.now() });
    const span = SPANS.reduce((a, b) => (Math.abs(b - (x1 - x0) * 1.2) < Math.abs(a - (x1 - x0) * 1.2) ? b : a), SPANS[1]);
    setWin({ centre: (x0 + x1) / 2, span: Math.min(span, SPANS[SPANS.length - 1]) });
  };
  // History mode (step 5): a past range from the USGS catalogue, played back with a moving play head.
  const [mode, setMode] = useState<'live' | 'history'>('live');
  const [preset, setPreset] = useState<Preset>('90d');
  const [hrange, setHrange] = useState<HistoryRange | null>(null);
  const [depthF, setDepthF] = useState<DepthFilter>('all');
  const [hregion, setHregion] = useState<GroupId | null>(null);
  const [trail, setTrail] = useState<Trail>('all');
  const history = mode === 'history';
  const hst = useHistory(plus && history, hrange);
  const hAll = hst.s === 'ready' ? hst.quakes : NO_QUAKES;
  const pb = usePlayback(hst.s === 'ready' ? hst.d.from : 0, hst.s === 'ready' ? hst.d.to : 1);
  const hShown = useMemo(() => visibleQuakes(hAll, { head: pb.head, trail, depth: depthF, region: hregion }), [hAll, pb.head, trail, depthF, hregion]);
  const enterHistory = () => {
    setMode('history'); setSel(null);
    if (!hrange) setHrange({ ...presetRange('90d', Date.now()), min: 2.5 });
  };
  const liveQuakes = useMemo(() => (st.s === 'ready' ? st.quakes : NO_QUAKES), [st]);
  const quakes = history ? hShown : liveQuakes;
  /** Markers fade with age: from now in live mode, from the play head (over the trail) in history mode. */
  const fadePeriod: Period = history ? trailPeriod(trail) : period;
  const selected = quakes.find(q => q.id === sel) ?? null;
  const volcanoes = useMemo(() => (vst.s === 'ready' ? vst.d.volcanoes : []), [vst]);
  // This week's report says nothing about past dates: in history mode every triangle is drawn plain (details still
  // show this week's status, labelled as such).
  const drawnVolcanoes = useMemo(() => (history ? volcanoes.map(v => (reported(v) ? { ...v, status: 'catalogued' as const } : v)) : volcanoes), [history, volcanoes]);
  const selectedV = volcanoes.find(v => v.n === selV) ?? null;
  const active = useMemo(() => volcanoes.filter(reported)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.x - b.x), [volcanoes]);
  const largest = useMemo(() => [...quakes].filter(q => q.mag !== null).sort((a, b) => (b.mag ?? 0) - (a.mag ?? 0)).slice(0, 8), [quakes]);
  const now = useMinute();
  const fadeNow = history ? pb.head : now;
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
          <div className={data.seg} role="tablist" aria-label={k.mode}>
            <button type="button" role="tab" aria-selected={!history} onClick={() => { pb.pause(); setMode('live'); setSel(null); }}>{k.mode_live}</button>
            <button type="button" role="tab" aria-selected={history} onClick={enterHistory}>{k.mode_history}</button>
          </div>
          {history && hrange && (
            <>
              <HistoryControls preset={preset} setPreset={setPreset} range={hrange} setRange={r => { setHrange(r); setSel(null); }}
                depth={depthF} setDepth={setDepthF} region={hregion} setRegion={setHregion} now={now} />
              <HistoryStatus st={hst} range={hrange} when={when} />
              {hst.s === 'ready' && (
                <Player from={hst.d.from} to={hst.d.to} head={pb.head} setHead={pb.setHead} playing={pb.playing} play={pb.play} pause={pb.pause}
                  speed={pb.speed} setSpeed={pb.setSpeed} trail={trail} setTrail={setTrail} shown={hShown.length} when={when} />
              )}
            </>
          )}
          {!history && <div className={styles.controls}>
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
          </div>}
          {st.s === 'loading' && <p className={data.status}>{k.loading}</p>}
          {st.s === 'error' && <p className={data.status} role="alert">{k.error}</p>}
          {st.s === 'ready' && (
            <>
              {!history && <Status d={st.d} okAt={st.okAt} failedAt={st.failedAt} fresh={st.fresh.size} when={when} ago={ago} now={now} vst={vst} tst={tst} />}
              {!history && <button type="button" className={styles.shareBtn} onClick={() => setSharing(true)} aria-haspopup="dialog">
                <span className="ms" aria-hidden="true">ios_share</span>{k.share}
              </button>}
              <RibbonShareSheet open={sharing} onClose={() => setSharing(false)} d={st.d} quakes={quakes} volcanoes={volcanoes}
                terrain={tst.s === 'ready' ? tst.d : null} period={period} min={min} now={now} />
              <button type="button" className={styles.jump} onClick={() => setPicker(true)} aria-haspopup="dialog">
                <span className="ms" aria-hidden="true">travel_explore</span>
                <span>{region === null ? k.go_to : region === 'all' ? k.whole : k.regions[region as keyof typeof k.regions]}</span>
                <span className="ms" aria-hidden="true">expand_more</span>
              </button>
              <Sheet open={picker} onClose={() => setPicker(false)} title={k.go_to}>
                <SheetOptions value={region ?? undefined} onPick={v => {
                  setRegion(v); setPicker(false);
                  if (v === 'all') goTo(-st.d.corridor.endKm, st.d.lengthKm + st.d.corridor.endKm);
                  else { const r = st.d.regions.find(g => g.group === v); if (r) goTo(r.x0, r.x1); }
                }} options={[
                  { value: 'all', label: k.whole, meta: nf.format(quakes.length) },
                  ...st.d.regions.map(r => {
                    const i = GROUPS.indexOf(r.group);
                    return { value: r.group as string, label: k.regions[r.group], meta: nf.format(quakes.filter(q => q.from === i || q.to === i).length) };
                  }),
                ]} />
              </Sheet>
              <div className={styles.layers} role="group" aria-label={k.show}>
                <span>{k.show}</span>
                {(['quakes', 'volcanoes', 'terrain'] as const).map(l => (
                  <button key={l} type="button" aria-pressed={show[l]} onClick={() => setShow(x => ({ ...x, [l]: !x[l] }))}>
                    <span className="ms" aria-hidden="true">{show[l] ? 'check' : 'add'}</span>{k[`layer_${l}`]}
                  </button>
                ))}
              </div>
              {show.terrain && tst.s === 'ready' && (
                <div className={data.seg} role="tablist" aria-label={k.relief}>
                  {(['scientific', 'enhanced'] as const).map(r => (
                    <button key={r} type="button" role="tab" aria-selected={relief === r} onClick={() => setRelief(r)}>
                      {k[`relief_${r}`].replace('{n}', nf.format(RELIEF[r]))}
                    </button>
                  ))}
                </div>
              )}
              <div className={data.seg} role="tablist" aria-label={k.view}>
                {(['2d', '3d'] as const).map(v => (
                  <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}>{k[`view_${v}`]}</button>
                ))}
              </div>
              <div className={history ? styles.historyFrame : undefined}>
              {view === '2d' ? (
                <Plot d={st.d} quakes={show.quakes ? quakes : NO_QUAKES} volcanoes={show.volcanoes ? drawnVolcanoes : []} period={fadePeriod} fresh={history ? NO_IDS : st.fresh}
                  terrain={show.terrain && tst.s === 'ready' ? tst.d : null} relief={RELIEF[relief]}
                  selected={sel} selectedV={selV} onSelect={pickQuake} onSelectV={pickVolcano} jump={jump} now={fadeNow} />
              ) : (
                <View3D d={st.d} win={win ?? { centre: largest[0]?.x ?? (st.d.regions.find(r => r.group === 'japan')?.x0 ?? 23000) + 400, span: SPANS[1] }}
                  setWin={setWin} cam={cam} setCam={setCam} quakes={show.quakes ? quakes : NO_QUAKES} volcanoes={show.volcanoes ? drawnVolcanoes : []}
                  showTerrain={show.terrain} relief={RELIEF[relief]} period={fadePeriod} now={fadeNow} selected={sel} selectedV={selV}
                  onSelect={pickQuake} onSelectV={pickVolcano} />
              )}
              </div>
              <Key volcanoes={vst.s === 'ready'} terrain={show.terrain && tst.s === 'ready' ? tst.d : null} relief={RELIEF[relief]} />
              {quakes.length === 0 && <p className={data.status}>{k.none}</p>}
              {selected && <Detail q={selected} onClose={() => setSel(null)} when={when} />}
              {selectedV && <VolcanoDetail v={selectedV} onClose={() => setSelV(null)} />}
              {active.length > 0 && (
                <div className={styles.largest}>
                  <h2>{k.active_h}</h2>
                  <ul>
                    {active.map(v => (
                      <li key={v.n}>
                        <button type="button" aria-pressed={v.n === selV} onClick={() => { pickVolcano(v.n); setShow(x => ({ ...x, volcanoes: true })); goTo(v.x - 400, v.x + 400); }}>
                          <Tri colour={VOLCANO_COLOURS[v.status]} />
                          <b>{v.name}</b>
                          <span>{k[`st_${v.status}`]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {largest.length > 0 && (
                <div className={styles.largest}>
                  <h2>{k.largest}</h2>
                  <ul>
                    {largest.map(q => (
                      <li key={q.id}>
                        <button type="button" aria-pressed={q.id === sel} onClick={() => { pickQuake(q.id); setShow(x => ({ ...x, quakes: true })); goTo(q.x - 400, q.x + 400); }}>
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
        <ul className={data.notes}>{[k.note_1, k.note_2, k.note_6, k.note_7, k.note_8, k.note_9, k.note_3, k.note_4, k.note_5].map(n => <li key={n}>{n}</li>)}</ul>
        <p className={styles.source}>{k.source}</p>
      </section>
    </div>
  );
}

function Status({ d, okAt, failedAt, fresh, when, ago, now, vst, tst }: {
  d: RibbonResponse; okAt: number; failedAt: number | null; fresh: number; when: Intl.DateTimeFormat; ago: (ms: number) => string; now: number; vst: VLoad; tst: TLoad;
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
      {vst.s === 'error' && <p>{k.v_unavailable}</p>}
      {tst.s === 'error' && <p>{k.t_unavailable}</p>}
      {vst.s === 'ready' && <p>{vst.d.report ? k.v_report.replace('{time}', when.format(vst.d.report.published ?? vst.d.report.retrieved)) : k.v_report_missing}</p>}
    </div>
  );
}

/** A volcano marker for keys and lists. */
function Tri({ colour, size = 12 }: { colour: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" className={styles.tri}><path d="M6 1 11 11H1Z" fill={colour} stroke="#0B1220" strokeWidth="1" /></svg>;
}

function Key({ volcanoes, terrain, relief }: { volcanoes: boolean; terrain: TerrainResponse | null; relief: number }) {
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
      {volcanoes && (
        <p className={styles.keyRow}>
          <b>{k.key_volcano}</b>
          {(['continuing', 'new_eruptive', 'new_unrest', 'catalogued', 'unknown'] as const).map(st => (
            <span key={st}><Tri colour={VOLCANO_COLOURS[st]} />{k[`st_${st}`]}</span>
          ))}
        </p>
      )}
      {terrain && (
        <p className={styles.keyRow}>
          <b>{k.layer_terrain}</b>
          <span><i className={styles.landSwatch} aria-hidden="true" />{k.key_land.replace('{n}', dist.dist(terrain.params.crestBandKm))}</span>
          <span><i className={styles.seaSwatch} aria-hidden="true" />{k.key_sea.replace('{n}', dist.dist(terrain.params.trenchBandKm))}</span>
        </p>
      )}
      <p className={styles.keyNote}>{k.key_age} {k.key_scale}{terrain ? ` ${relief === 1 ? k.key_relief_1 : k.key_relief_n.replace('{n}', nf.format(relief))}` : ''}</p>
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

function VolcanoDetail({ v, onClose }: { v: RibbonVolcano; onClose: () => void }) {
  const { m, nf, locale } = useT();
  const k = m.ribbon;
  const dist = useDistance();
  const f2 = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const na = <span className={styles.na}>{k.d_none}</span>;
  const year = (y: number) => (y < 0 ? k.year_bce.replace('{n}', String(-y)) : String(y));
  const elev = v.elevation === null ? na : dist.units === 'mi' ? `${nf.format(Math.round(v.elevation * 3.28084))} ft` : `${nf.format(v.elevation)} m`;
  const rows: [string, React.ReactNode][] = [
    [k.v_status, k[`st_${v.status}`]],
    [k.v_elevation, elev],
    [k.v_type, v.type ? <span lang="en">{v.type}</span> : na],
    [k.v_last, v.lastEruption === null ? k.v_last_unknown : year(v.lastEruption)],
    [k.v_eruptions, nf.format(v.eruptions)],
    [k.v_latest, v.lastConfirmed === null ? na : year(v.lastConfirmed)],
    [k.v_vei, v.maxVei === null ? na : nf.format(v.maxVei)],
    [k.v_evidence, v.evidence ? <span lang="en">{v.evidence}</span> : na],
    [k.v_tectonic, v.tectonic ? <span lang="en">{v.tectonic}</span> : na],
    [k.v_country, v.country ? <span lang="en">{v.country}</span> : na],
    [k.v_subregion, <span key="s" lang="en">{v.subregion}</span>],
    [k.d_coords, `${f2.format(v.lat)}°, ${f2.format(v.lon)}°`],
    [k.d_route, `${k.regions[GROUPS[v.group]]} · ${k.d_route_v.replace('{x}', dist.dist(v.x)).replace('{y}', dist.dist(Math.abs(v.y))).replace('{side}', v.y >= 0 ? k.d_left : k.d_right)}`],
    [k.v_number, String(v.n)],
  ];
  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <Tri colour={VOLCANO_COLOURS[v.status]} size={14} />
        <h2>{v.name}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label={k.d_close}><span className="ms" aria-hidden="true">close</span></button>
      </div>
      {v.report ? (
        <div className={styles.report}>
          <h3>{k.v_report_h.replace('{period}', v.report.period)}</h3>
          {v.report.text.split('\n\n').map((p, i) => <p key={i} lang="en">{p}</p>)}
          {v.report.sources && <p className={styles.reportSrc}>{k.v_sources.replace('{s}', v.report.sources)}</p>}
        </div>
      ) : <p className={styles.reportNote}>{v.status === 'unknown' ? k.v_unknown_note : k.v_no_report}</p>}
      <dl>
        {rows.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}
      </dl>
      <a href={`https://volcano.si.edu/volcano.cfm?vn=${v.n}`} target="_blank" rel="noopener noreferrer" className={styles.usgs}>{k.v_gvp}<span className="ms" aria-hidden="true">open_in_new</span></a>
    </div>
  );
}

// ——— The 3D view ———

function View3D({ d, win, setWin, cam, setCam, quakes, volcanoes, showTerrain, relief, period, now, selected, selectedV, onSelect, onSelectV }: {
  d: RibbonResponse; win: { centre: number; span: number }; setWin: (w: { centre: number; span: number }) => void;
  cam: Camera3D; setCam: (c: Camera3D) => void; quakes: RibbonQuake[]; volcanoes: RibbonVolcano[]; showTerrain: boolean; relief: number;
  period: Period; now: number; selected: string | null; selectedV: number | null; onSelect: (id: string | null) => void; onSelectV: (n: number | null) => void;
}) {
  const { m, nf } = useT();
  const k = m.ribbon;
  const dist = useDistance();
  const lo = -d.corridor.endKm + win.span / 2, hi = d.lengthKm + d.corridor.endKm - win.span / 2;
  const move = (dir: number) => setWin({ ...win, centre: Math.max(lo, Math.min(hi, win.centre + (dir * win.span) / 2)) });
  const si = SPANS.indexOf(win.span);
  const labels = useMemo(() => ({
    pacific: k.pacific, behind: k.behind, depth: k.depth_axis, km: 'km', loading: k.t3d_loading, unavailable: k.t3d_unavailable, noWebgl: k.no_webgl, north: k.north, compass: k.compass,
    regions: d.regions.map(r => ({ name: k.regions[r.group], x0: r.x0, x1: r.x1 })),
  }), [k, d.regions]);
  const inView = quakes.filter(q => q.x >= win.centre - win.span / 2 && q.x <= win.centre + win.span / 2).length;
  return (
    <div className={styles.plotWrap}>
      <div className={`${data.seg} ${styles.camSeg}`} role="tablist" aria-label={k.camera}>
        {(['oblique', 'section', 'top'] as const).map(c => (
          <button key={c} type="button" role="tab" aria-selected={cam === c} onClick={() => setCam(c)}>{k[`cam_${c}`]}</button>
        ))}
      </div>
      <div role="figure" aria-label={k.chart_label_3d.replace('{n}', nf.format(inView)).replace('{a}', dist.dist(Math.max(0, win.centre - win.span / 2))).replace('{b}', dist.dist(Math.min(d.lengthKm, win.centre + win.span / 2)))}>
        <Ribbon3D centre={win.centre} span={win.span} quakes={quakes} volcanoes={volcanoes} showTerrain={showTerrain} relief={relief} camera={cam}
          period={period} now={now} selected={selected} selectedV={selectedV} onSelect={onSelect} onSelectV={onSelectV} labels={labels} />
      </div>
      <p className={styles.hint3d}>{k.hint_3d}</p>
      <div className={styles.zoom}>
        <button type="button" onClick={() => move(-1)} disabled={win.centre <= lo} aria-label={k.prev}><span className="ms" aria-hidden="true">chevron_left</span></button>
        <span>{k.window.replace('{a}', dist.dist(Math.max(0, win.centre - win.span / 2))).replace('{b}', dist.dist(Math.min(d.lengthKm, win.centre + win.span / 2)))}</span>
        <button type="button" onClick={() => move(1)} disabled={win.centre >= hi} aria-label={k.next}><span className="ms" aria-hidden="true">chevron_right</span></button>
        <button type="button" onClick={() => setWin({ ...win, span: SPANS[Math.min(SPANS.length - 1, si + 1)] })} disabled={si >= SPANS.length - 1} aria-label={k.wider}><span className="ms" aria-hidden="true">zoom_out</span></button>
        <button type="button" onClick={() => setWin({ ...win, span: SPANS[Math.max(0, si - 1)] })} disabled={si <= 0} aria-label={k.narrower}><span className="ms" aria-hidden="true">zoom_in</span></button>
      </div>
    </div>
  );
}

// ——— The plot ———

// TOP is sea level (depth 0); above it: region names, the relief label and room for exaggerated land and volcanoes.
const H = 404, TOP = 74, BOTTOM = 26, GUTTER = 44, RIGHT_PAD = 10;
const LAND = '#7A5C43', LAND_EDGE = '#C29A6B', SHOAL = '#2B5277', SEA = 'rgba(38, 104, 168, .30)', TRENCH = '#5AA9E0';
/** Volcano triangles sit above the surface line: height by status (reported ones larger). */
const triH = (v: RibbonVolcano) => (reported(v) ? 11 : 7);
const BG = '#0B1220', GRID = 'rgba(190, 205, 230, .13)', TEXT = 'rgba(214, 224, 240, .82)', MUTED = 'rgba(190, 205, 230, .55)';
const ZOOMS = [1, 2, 4, 8, 16, 32, 64];

function Plot({ d, quakes, volcanoes, terrain, relief, period, fresh, selected, selectedV, onSelect, onSelectV, jump, now }: {
  d: RibbonResponse; quakes: RibbonQuake[]; volcanoes: RibbonVolcano[]; terrain: TerrainResponse | null; relief: number;
  period: Period; fresh: Set<string>; selected: string | null; selectedV: number | null;
  onSelect: (id: string | null) => void; onSelectV: (n: number | null) => void; jump: { x0: number; x1: number; n: number } | null; now: number;
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
  const [hover, setHover] = useState<{ q?: RibbonQuake; v?: RibbonVolcano; px: number; py: number } | null>(null);
  const [pulse, setPulse] = useState(0);
  const xMin = -d.corridor.endKm, xMax = d.lengthKm + d.corridor.endKm;
  const plotW = Math.max(1, width - GUTTER - RIGHT_PAD) * zoom;
  const maxDepth = Math.max(700, ...quakes.map(q => q.depth));
  const unit = dist.units === 'mi' ? KM_PER_MI : 1;
  const depthMax = Math.ceil(maxDepth / unit / 100) * 100 * unit;
  const sx = useCallback((x: number) => GUTTER + ((x - xMin) / (xMax - xMin)) * plotW - scroll, [xMin, xMax, plotW, scroll]);
  const sy = useCallback((z: number) => TOP + (Math.max(0, z) / depthMax) * (H - TOP - BOTTOM), [depthMax]);
  /** Screen y of a height in metres (negative = below sea level), on the depth axis's scale times the relief factor. */
  const ey = useCallback((m: number) => TOP - (m / 1000) * relief * ((H - TOP - BOTTOM) / depthMax), [relief, depthMax]);
  /** Highest ground (crest profile) at a route position, metres, or null. */
  const crestAt = useCallback((x: number) => {
    if (!terrain) return null;
    const i = Math.floor(x / terrain.params.crestStepKm);
    return terrain.crest[i] ?? null;
  }, [terrain]);
  /** Where a volcano's triangle stands: on its catalogued summit height, else on the crest profile, else at sea level. */
  const volcanoBase = useCallback((v: RibbonVolcano) => Math.max(26, ey(terrain ? (v.elevation ?? crestAt(v.x) ?? 0) : 0) - 1), [ey, terrain, crestAt]);

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
    // Terrain (ETOPO 2022), per screen column: the deepest sea floor within the trench band (sea fill + line) and the
    // highest ground within the crest band (land above sea level, a darker blue where the highest ground is under water).
    if (terrain) {
      const p = terrain.params;
      const cols: { x: number; crest: number | null; trench: number | null }[] = [];
      for (let px = GUTTER; px <= width; px++) {
        const xa = xMin + ((px - GUTTER + scroll) / plotW) * (xMax - xMin), xb = xMin + ((px + 1 - GUTTER + scroll) / plotW) * (xMax - xMin);
        let hi: number | null = null, lo: number | null = null;
        for (let i = Math.max(0, Math.floor(xa / p.crestStepKm)); i <= Math.min(terrain.crest.length - 1, Math.floor(xb / p.crestStepKm)); i++) {
          const v = terrain.crest[i]; if (v != null && (hi === null || v > hi)) hi = v;
        }
        for (let i = Math.max(0, Math.floor(xa / p.trenchStepKm)); i <= Math.min(terrain.trench.length - 1, Math.floor(xb / p.trenchStepKm)); i++) {
          const v = terrain.trench[i]; if (v != null && (lo === null || v < lo)) lo = v;
        }
        cols.push({ x: px, crest: hi, trench: lo });
      }
      const band = (pick: (c: typeof cols[number]) => number | null, fill: string) => {
        g.fillStyle = fill;
        for (const c of cols) { const v = pick(c); if (v == null) continue; const y = ey(v); g.fillRect(c.x, Math.min(TOP, y), 1, Math.abs(y - TOP)); }
      };
      band(c => (c.trench != null && c.trench < 0 ? c.trench : null), SEA);
      band(c => (c.crest != null && c.crest < 0 ? c.crest : null), SHOAL);
      band(c => (c.crest != null && c.crest > 0 ? c.crest : null), LAND);
      const line = (pick: (c: typeof cols[number]) => number | null, colour: string, onlyBelow: boolean) => {
        g.strokeStyle = colour; g.lineWidth = 1.2; g.beginPath(); let on = false;
        for (const c of cols) { const v = pick(c); if (v == null || (onlyBelow && v >= 0)) { on = false; continue; } const y = ey(v); if (on) g.lineTo(c.x + 0.5, y); else { g.moveTo(c.x + 0.5, y); on = true; } }
        g.stroke();
      };
      line(c => c.trench, TRENCH, true);
      line(c => (c.crest != null && c.crest > 0 ? c.crest : null), LAND_EDGE, false);
      g.fillStyle = MUTED; g.font = '600 10px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(k.relief_label.replace('{n}', nf.format(relief)), GUTTER + 6, 30);
    }
    // Sea level (depth 0).
    g.strokeStyle = 'rgba(255, 170, 110, .55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(GUTTER, sy(0)); g.lineTo(width, sy(0)); g.stroke();

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
    // Volcanoes: catalogued first, reported ones on top.
    const tri = (v: RibbonVolcano, ring = false) => {
      const x = sx(v.x), h = triH(v), base = volcanoBase(v), w = h * 0.9;
      g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + w / 2, base); g.lineTo(x - w / 2, base); g.closePath();
      if (ring) { g.lineWidth = 2; g.strokeStyle = '#FFFFFF'; g.stroke(); return; }
      g.fillStyle = VOLCANO_COLOURS[v.status]; g.fill(); g.lineWidth = 1; g.strokeStyle = BG; g.stroke();
    };
    for (const v of [...volcanoes].sort((a, b) => Number(reported(a)) - Number(reported(b)))) {
      const x = sx(v.x);
      if (x < GUTTER - 8 || x > width + 8) continue;
      tri(v);
    }
    for (const n of [hover?.v?.n, selectedV]) { const v = n != null ? volcanoes.find(e => e.n === n) : null; if (v) tri(v, true); }
    for (const id of [hover?.q?.id, selected]) {
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
  }, [width, d, drawn, quakes, volcanoes, terrain, relief, ey, volcanoBase, scroll, sx, sy, zoom, depthMax, unit, hover, selected, selectedV, pulse, fresh, period, now, k, nf, dist, xMin, xMax, plotW]);

  const nearest = (clientX: number, clientY: number) => {
    const c = canvas.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const px = clientX - rect.left, py = clientY - rect.top;
    let best: RibbonQuake | null = null, bestV: RibbonVolcano | null = null, bd = 16;
    for (const q of quakes) {
      const dd = Math.hypot(sx(q.x) - px, sy(q.depth) - py) - markerRadius(q.mag);
      if (dd < bd) { bd = dd; best = q; }
    }
    for (const v of volcanoes) {
      const dd = Math.hypot(sx(v.x) - px, volcanoBase(v) - triH(v) / 2 - py) - triH(v) / 2;
      if (dd < bd) { bd = dd; bestV = v; best = null; }
    }
    return bestV ? { v: bestV, px, py } : best ? { q: best, px, py } : null;
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
            onClick={e => { const n = nearest(e.clientX, e.clientY); if (n?.v) onSelectV(n.v.n); else onSelect(n?.q ? n.q.id : null); }} />
        </div>
      </div>
      {hover?.q && (
        <div className={styles.tip} style={{ left: Math.min(Math.max(8, hover.px + 12), width - 200), top: Math.max(8, hover.py - 60) }}>
          <b>M{hover.q.mag !== null ? mag1.format(hover.q.mag) : '–'}</b> · {dist.depth(hover.q.depth)}
          <span>{hover.q.place ?? k.regions[GROUPS[hover.q.from]]}</span>
        </div>
      )}
      {hover?.v && (
        <div className={styles.tip} style={{ left: Math.min(Math.max(8, hover.px + 12), width - 200), top: Math.max(8, hover.py + 16) }}>
          <b>{hover.v.name}</b>
          <span>{k[`st_${hover.v.status}`]}</span>
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

