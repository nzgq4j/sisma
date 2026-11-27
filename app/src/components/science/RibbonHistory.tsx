'use client';
// Science → Pacific Fire Ribbon, historical playback (step 5; docs/fire-ribbon.md). Loads a range of past earthquakes
// from GET /api/science/ribbon/history (USGS ComCat; sisma+) and plays them back on the same profile and 3D views as
// the live data: a play head moves through the range and the views show the earthquakes up to it, fading with age.
// The controls, status and frame are drawn in amber so a historical view is never mistaken for live monitoring.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useAccount } from '@/components/Account';
import { Sheet, SheetOptions } from '@/components/Sheet';
import {
  DEPTH_FILTERS, HISTORY_EARLIEST, MAX_SPAN_DAYS, SPEEDS_MS, defaultSpeed, isoDay, usgsEventUrl, utcDay, type DepthFilter,
} from '@/lib/ribbon/history';
import { GROUPS, MIN_MAGS, fromRow, type GroupId, type HistoryResponse, type MinMag, type Period, type RibbonQuake } from '@/lib/ribbon/shared';
import data from './data.module.css';
import styles from './ribbon.module.css';

const DAY = 86_400_000;
export type Preset = '90d' | 'year' | 'custom';
export interface HistoryRange { start: string; end: string; min: MinMag }
export type Trail = 'day' | 'week' | 'month' | 'all';
const TRAIL_MS: Record<Trail, number> = { day: DAY, week: 7 * DAY, month: 30 * DAY, all: Infinity };
/** Fading for the markers: the trail's length (the whole range fades over 30 days). */
export const trailPeriod = (t: Trail): Period => (t === 'all' ? 'month' : t);

/** The smallest minimum magnitude allowed for a range of `days` (all magnitudes only up to 31 days, and so on). */
export const minFor = (days: number, want: MinMag): MinMag =>
  MAX_SPAN_DAYS[want] >= days ? want : (MIN_MAGS.find(m => MAX_SPAN_DAYS[m] >= days) ?? 4.5);

export function presetRange(p: Exclude<Preset, 'custom'>, now: number): { start: string; end: string } {
  const end = isoDay(now);
  return { start: isoDay(now - (p === '90d' ? 89 : 365) * DAY), end };
}

type HLoad = { s: 'idle' } | { s: 'loading'; key: string } | { s: 'error'; key: string; error: string; ribbon?: number; max?: number }
  | { s: 'ready'; key: string; d: HistoryResponse; quakes: RibbonQuake[] };

/** Loads one history range (again only when the range changes). */
export function useHistory(enabled: boolean, r: HistoryRange | null) {
  const { accessToken } = useAccount();
  const [st, setSt] = useState<HLoad>({ s: 'idle' });
  const key = r ? `${r.start}|${r.end}|${r.min}` : '';
  useEffect(() => {
    if (!enabled || !r) return;
    let alive = true;
    void (async () => {
      setSt({ s: 'loading', key });
      const token = await accessToken().catch(() => null);
      const res = await fetch(`/api/science/ribbon/history?start=${r.start}&end=${r.end}&min=${r.min}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
      const body = res ? await res.json().catch(() => null) : null;
      if (!alive) return;
      if (!res?.ok || !body?.rows) { setSt({ s: 'error', key, error: body?.error ?? 'unavailable', ribbon: body?.ribbon, max: body?.max }); return; }
      const d = body as HistoryResponse;
      const quakes = d.rows.map(fromRow).map(q => (q.url ? q : { ...q, url: usgsEventUrl(q.id) }));
      setSt({ s: 'ready', key, d, quakes });
    })();
    return () => { alive = false; };
    // r is described completely by key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, accessToken]);
  return st.s !== 'idle' && st.key !== key ? ({ s: 'loading', key } as HLoad) : st;
}

/** The play head: moves through [from, to] while playing, `speed` ms of catalogue time per second, about 12 updates a
 * second (the views redraw on each). Reaching the end stops it there. */
export function usePlayback(from: number, to: number) {
  // State belongs to one range: a new range starts again at its end (everything shown), paused, at a speed that plays
  // it in about 30 seconds.
  const key = `${from}:${to}`;
  const fresh = { key, head: to, playing: false, speed: defaultSpeed(to - from) };
  const [raw, setRaw] = useState(fresh);
  const st = raw.key === key ? raw : fresh;
  const range = useRef({ from, to, key });
  useEffect(() => { range.current = { from, to, key }; }, [from, to, key]);
  const update = useCallback((f: (s: typeof fresh) => typeof fresh) => setRaw(s => {
    const r = range.current;
    const base = s.key === r.key ? s : { key: r.key, head: r.to, playing: false, speed: defaultSpeed(r.to - r.from) };
    return f(base);
  }), []);
  const { playing, speed } = st;
  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now(), acc = 0;
    const tick = (t: number) => {
      acc += t - last; last = t;
      if (acc >= 80) {
        const step = (acc / 1000) * speed; acc = 0;
        update(s => { const head = Math.min(range.current.to, s.head + step); return { ...s, head, playing: head < range.current.to }; });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, update]);
  return {
    head: st.head, playing, speed,
    setHead: (head: number) => update(s => ({ ...s, head })),
    setSpeed: (v: number) => update(s => ({ ...s, speed: v })),
    // From the end, playing starts again from the beginning.
    play: () => update(s => ({ ...s, playing: true, head: s.head >= range.current.to ? range.current.from : s.head })),
    pause: () => update(s => ({ ...s, playing: false })),
  };
}

/** Which of the loaded earthquakes the views show: in the depth band and region, up to the play head, within the trail. */
export function visibleQuakes(all: RibbonQuake[], o: { head: number; trail: Trail; depth: DepthFilter; region: GroupId | null }) {
  const lo = o.head - TRAIL_MS[o.trail], [d0, d1] = DEPTH_FILTERS[o.depth], gi = o.region ? GROUPS.indexOf(o.region) : -1;
  return all.filter(q => q.time <= o.head && q.time >= lo && q.depth >= d0 && q.depth < d1 && (gi < 0 || q.from === gi || q.to === gi));
}

const SPEED_KEYS = ['h_speed_hour', 'h_speed_6h', 'h_speed_day', 'h_speed_week', 'h_speed_month'] as const;

/** Range, magnitude, depth and region choices for history mode. */
export function HistoryControls({ preset, setPreset, range, setRange, depth, setDepth, region, setRegion, now }: {
  preset: Preset; setPreset: (p: Preset) => void; range: HistoryRange; setRange: (r: HistoryRange) => void;
  depth: DepthFilter; setDepth: (d: DepthFilter) => void; region: GroupId | null; setRegion: (g: GroupId | null) => void; now: number;
}) {
  const { m, nf } = useT();
  const k = m.ribbon;
  const [draft, setDraft] = useState({ start: range.start, end: range.end });
  const [picker, setPicker] = useState(false);
  const days = (s: string, e: string) => { const a = utcDay(s), b = utcDay(e); return a !== null && b !== null ? Math.round((b - a) / DAY) + 1 : 0; };
  const span = days(range.start, range.end);
  const today = isoDay(now);
  const choose = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') { const r = presetRange(p, now); setRange({ ...r, min: minFor(days(r.start, r.end), range.min) }); }
    else setDraft({ start: range.start, end: range.end });
  };
  const dDays = days(draft.start, draft.end);
  const draftOk = dDays > 0 && draft.end <= today && draft.start >= HISTORY_EARLIEST && dDays <= MAX_SPAN_DAYS[4.5];
  return (
    <div className={styles.historyControls}>
      <div className={data.seg} role="tablist" aria-label={k.h_range}>
        {(['90d', 'year', 'custom'] as const).map(p => (
          <button key={p} type="button" role="tab" aria-selected={preset === p} onClick={() => choose(p)}>{k[`h_${p}`]}</button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className={styles.dates}>
          <label><span>{k.h_from}</span><input type="date" value={draft.start} min={HISTORY_EARLIEST} max={draft.end || today} onChange={e => setDraft(x => ({ ...x, start: e.target.value }))} /></label>
          <label><span>{k.h_to}</span><input type="date" value={draft.end} min={draft.start || HISTORY_EARLIEST} max={today} onChange={e => setDraft(x => ({ ...x, end: e.target.value }))} /></label>
          <button type="button" className={styles.apply} disabled={!draftOk}
            onClick={() => setRange({ start: draft.start, end: draft.end, min: minFor(dDays, range.min) })}>{k.h_apply}</button>
          {!draftOk && dDays > MAX_SPAN_DAYS[4.5] && <p className={styles.hint3d} role="alert">{k.h_err_too_long.replace('{n}', nf.format(MAX_SPAN_DAYS[4.5]))}</p>}
        </div>
      )}
      <div className={data.seg} role="tablist" aria-label={k.min}>
        {MIN_MAGS.map(v => (
          <button key={v} type="button" role="tab" aria-selected={range.min === v} disabled={MAX_SPAN_DAYS[v] < span}
            title={MAX_SPAN_DAYS[v] < span ? k.h_mag_limit.replace('{n}', nf.format(MAX_SPAN_DAYS[v])) : undefined}
            onClick={() => setRange({ ...range, min: v })}>
            {v === 0 ? k.min_all : `M${nf.format(v)}+`}
          </button>
        ))}
      </div>
      <p className={styles.hint3d}>{k.h_limits.replace('{a}', nf.format(MAX_SPAN_DAYS[0])).replace('{b}', nf.format(MAX_SPAN_DAYS[2.5])).replace('{c}', nf.format(MAX_SPAN_DAYS[4.5]))}</p>
      <div className={data.seg} role="tablist" aria-label={k.h_depth}>
        {(Object.keys(DEPTH_FILTERS) as DepthFilter[]).map(d => (
          <button key={d} type="button" role="tab" aria-selected={depth === d} onClick={() => setDepth(d)}>{k[`h_depth_${d}`]}</button>
        ))}
      </div>
      <button type="button" className={styles.jump} onClick={() => setPicker(true)} aria-haspopup="dialog">
        <span className="ms" aria-hidden="true">filter_alt</span>
        <span>{region ? k.regions[region] : k.h_all_regions}</span>
        <span className="ms" aria-hidden="true">expand_more</span>
      </button>
      <Sheet open={picker} onClose={() => setPicker(false)} title={k.h_region}>
        <SheetOptions value={region ?? 'all'} onPick={v => { setRegion(v === 'all' ? null : (v as GroupId)); setPicker(false); }}
          options={[{ value: 'all', label: k.h_all_regions }, ...GROUPS.map(g => ({ value: g as string, label: k.regions[g] }))]} />
      </Sheet>
    </div>
  );
}

/** Play / pause, the timeline, the time shown, speed and trail. */
export function Player({ from, to, head, setHead, playing, play, pause, speed, setSpeed, trail, setTrail, shown, when }: {
  from: number; to: number; head: number; setHead: (t: number) => void; playing: boolean; play: () => void; pause: () => void;
  speed: number; setSpeed: (s: number) => void; trail: Trail; setTrail: (t: Trail) => void; shown: number; when: Intl.DateTimeFormat;
}) {
  const { m, nf } = useT();
  const k = m.ribbon;
  const [open, setOpen] = useState<null | 'speed' | 'trail'>(null);
  // The slider runs 0…1000 over the range (raw times in ms are too large for a range input to step through reliably).
  const span = Math.max(1, to - from), pos = Math.round(((head - from) / span) * 1000);
  return (
    <div className={styles.player}>
      <div className={styles.playRow}>
        <button type="button" className={styles.playBtn} onClick={playing ? pause : play} aria-label={playing ? k.h_pause : k.h_play}>
          <span className="ms" aria-hidden="true">{playing ? 'pause' : 'play_arrow'}</span>
        </button>
        <div className={styles.clock} aria-live={playing ? 'off' : 'polite'}>
          <b>{when.format(head)}</b>
          <span>{k.h_shown.replace('{n}', nf.format(shown))}</span>
        </div>
      </div>
      <input className={styles.scrub} type="range" min={0} max={1000} step={1} value={pos} aria-label={k.h_timeline}
        aria-valuetext={when.format(head)} onChange={e => { pause(); setHead(from + (Number(e.target.value) / 1000) * span); }} />
      <div className={styles.scrubEnds} aria-hidden="true"><span>{when.format(from)}</span><span>{when.format(to)}</span></div>
      {/* Speed and trail: two selectors side by side, each opening the app's choice sheet. */}
      <div className={styles.pickPair}>
        <button type="button" className={styles.jump} onClick={() => setOpen('speed')} aria-haspopup="dialog" aria-label={`${k.h_speed}: ${k[SPEED_KEYS[Math.max(0, SPEEDS_MS.indexOf(speed as (typeof SPEEDS_MS)[number]))]]}`}>
          <span className="ms" aria-hidden="true">speed</span>
          <span>{k[SPEED_KEYS[Math.max(0, SPEEDS_MS.indexOf(speed as (typeof SPEEDS_MS)[number]))]]}</span>
          <span className="ms" aria-hidden="true">expand_more</span>
        </button>
        <button type="button" className={styles.jump} onClick={() => setOpen('trail')} aria-haspopup="dialog" aria-label={`${k.h_trail}: ${k[`h_trail_${trail}`]}`}>
          <span className="ms" aria-hidden="true">timeline</span>
          <span>{k.h_trail}: {k[`h_trail_${trail}`]}</span>
          <span className="ms" aria-hidden="true">expand_more</span>
        </button>
      </div>
      <Sheet open={open === 'speed'} onClose={() => setOpen(null)} title={k.h_speed}>
        <SheetOptions value={String(speed)} onPick={v => { setSpeed(Number(v)); setOpen(null); }}
          options={SPEEDS_MS.map((s, i) => ({ value: String(s), label: k[SPEED_KEYS[i]] }))} />
      </Sheet>
      <Sheet open={open === 'trail'} onClose={() => setOpen(null)} title={k.h_trail}>
        <SheetOptions value={trail} onPick={v => { setTrail(v as Trail); setOpen(null); }}
          options={(['day', 'week', 'month', 'all'] as const).map(t => ({ value: t, label: k[`h_trail_${t}`] }))} />
      </Sheet>
    </div>
  );
}

/** The history status: what was searched, what was found, and the catalogue's limits. */
export function HistoryStatus({ st, range, when }: { st: ReturnType<typeof useHistory>; range: HistoryRange; when: Intl.DateTimeFormat }) {
  const { m, nf, locale } = useT();
  const k = m.ribbon;
  const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const label = `${day.format(utcDay(range.start)!)} – ${day.format(utcDay(range.end)!)} (UTC) · ${range.min === 0 ? k.min_all : `M${nf.format(range.min)}+`}`;
  return (
    <div className={styles.historyStatus} aria-live="polite">
      <p><span className={styles.historyTag}><span className="ms" aria-hidden="true">history</span>{k.h_tag}</span> {label}</p>
      {st.s === 'loading' && <p>{k.h_loading}</p>}
      {st.s === 'error' && (
        <p role="alert">{st.error === 'too_many'
          ? k.h_err_too_many.replace('{n}', nf.format(st.ribbon ?? 0)).replace('{max}', nf.format(st.max ?? 0))
          : st.error === 'too_long' ? k.h_err_too_long.replace('{n}', nf.format(MAX_SPAN_DAYS[range.min])) : k.h_error}</p>
      )}
      {st.s === 'ready' && (
        <p>{k.h_found.replace('{n}', nf.format(st.d.counts.ribbon)).replace('{m}', nf.format(st.d.counts.earthquakes))} · {k.h_retrieved.replace('{time}', when.format(st.d.retrieved))}</p>
      )}
      <p>{k.h_coverage}</p>
    </div>
  );
}
