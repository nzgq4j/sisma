'use client';
// "I felt it" felt-report flow (design: sheetReport). Quick step (intensity slider + note) → optional details
// (where, duration, what moved, damage) → thanks. Open from anywhere with useFeltReport().open(quake).
// Reports are accepted for quakes up to 6 hours old; the server re-checks (POST /api/reports).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from './AppState';
import { Sheet } from './Sheet';
import { timeAgo } from './QuakeRow';
import { MMI_COLORS, ROMAN } from '@/lib/theme';
import { canReport } from '@/lib/quakes/report-window';
import type { Quake } from '@/lib/quakes/types';
import styles from './felt.module.css';

// ---- clock: re-renders once a minute so buttons disappear when a quake passes 6 hours ----
let nowCache = 0;
const clockSubs = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;
function subscribeClock(cb: () => void) {
  clockSubs.add(cb);
  clockTimer ??= setInterval(() => { nowCache = Date.now(); clockSubs.forEach(f => f()); }, 60_000);
  return () => { clockSubs.delete(cb); if (!clockSubs.size && clockTimer) { clearInterval(clockTimer); clockTimer = null; } };
}
const readClock = () => (nowCache ||= Date.now());
export function useNow() { return useSyncExternalStore(subscribeClock, readClock, () => 0); }

// ---- reports this device has sent (so the button turns into "Your report") ----
// quake id → the report this device sent (MMI and, when the device gave a location, its ~10 km cell)
type MineEntry = { mmi: number; lat?: number; lon?: number };
type Mine = Record<string, MineEntry>;
const MINE_KEY = 'sisma.reports';
const mineSubs = new Set<() => void>();
let mineMemory = '{}';
const readMine = () => { try { return localStorage.getItem(MINE_KEY) ?? mineMemory; } catch { return mineMemory; } };
const writeMine = (v: string) => { mineMemory = v; try { localStorage.setItem(MINE_KEY, v); } catch { /* storage unavailable */ } mineSubs.forEach(f => f()); };
const subscribeMine = (cb: () => void) => { mineSubs.add(cb); return () => { mineSubs.delete(cb); }; };

interface FeltCtx { open: (q: Quake) => void; mine: Mine }
const Ctx = createContext<FeltCtx | null>(null);

export function FeltReportProvider({ children }: { children: ReactNode }) {
  const [quake, setQuake] = useState<Quake | null>(null);
  const raw = useSyncExternalStore(subscribeMine, readMine, () => '{}');
  const mine = useMemo<Mine>(() => {
    try {
      const o = JSON.parse(raw) as Record<string, number | MineEntry>;
      return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? { mmi: v } : v]));
    } catch { return {}; }
  }, [raw]);
  const open = useCallback((q: Quake) => setQuake(q), []);
  const value = useMemo(() => ({ open, mine }), [open, mine]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <Sheet open={!!quake} onClose={() => setQuake(null)}>
        {quake && <ReportForm key={quake.id} q={quake} onClose={() => setQuake(null)}
          onSent={entry => writeMine(JSON.stringify({ ...mine, [quake.id]: entry }))} />}
      </Sheet>
    </Ctx.Provider>
  );
}

export function useFeltReport() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFeltReport outside FeltReportProvider');
  return v;
}

/** "I felt it" for quakes under 6 hours old; "Your report: IV" once this device has reported. */
export function FeltButton({ q, variant = 'pill', fallback = null }: { q: Quake; variant?: 'pill' | 'block'; fallback?: ReactNode }) {
  const { t } = useT();
  const { open, mine } = useFeltReport();
  const now = useNow();
  const sent = mine[q.id]?.mmi;
  if (sent) {
    return (
      <span className={variant === 'block' ? styles.sentBlock : styles.sentPill}>
        <span className="ms" aria-hidden="true">check_circle</span>{variant === 'block' ? `${t('your_report')}: ` : ''}{ROMAN[sent - 1]}
      </span>
    );
  }
  if (!now || !canReport(q.time, now)) return <>{fallback}</>;
  return (
    <button type="button" className={variant === 'block' ? styles.block : styles.pill} onClick={e => { e.stopPropagation(); open(q); }}>
      <span className="ms" aria-hidden="true">vibration</span>{t('felt_it')}
    </button>
  );
}

const DURATIONS = ['< 10 s', '10–30 s', '30–60 s', '> 1 min'];

function ReportForm({ q, onClose, onSent }: { q: Quake; onClose: () => void; onSent: (entry: MineEntry) => void }) {
  const { t, m, locale, nf } = useT();
  const { locations, active } = useApp();
  const [step, setStep] = useState<'quick' | 'details' | 'done'>('quick');
  const [mmi, setMmi] = useState(4);
  const [note, setNote] = useState('');
  const [place, setPlace] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [moved, setMoved] = useState<number[]>([]);
  const [damage, setDamage] = useState<number | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');

  const send = async () => {
    setState('sending');
    const loc = locations[active];
    try {
      const r = await fetch('/api/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quakeId: q.id, mmi, note, locale, ...(step === 'details' ? { place, duration, moved, damage } : {}),
          // Only a real device location is sent (the server coarsens it to ~10 km).
          ...(loc?.fromDevice ? { lat: loc.lat, lon: loc.lon } : {}),
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const cell = loc?.fromDevice ? { lat: Math.round(loc.lat * 10) / 10, lon: Math.round(loc.lon * 10) / 10 } : {};
      onSent({ mmi, ...cell }); setState('idle'); setStep('done');
    } catch { setState('error'); }
  };

  const mmiLabel = m.mmi[mmi - 1];
  const color = MMI_COLORS[mmi - 1], ink = mmi >= 7 ? '#FFFFFF' : '#1B1530';

  if (step === 'done') return (
    <>
      <div className={styles.done}>
        <span className={styles.doneIcon}><span className="ms" aria-hidden="true">check</span></span>
        <h2>{t('thanks')}</h2>
        <p>{t('thanks_sub')}</p>
      </div>
      <button type="button" className={styles.primary} onClick={onClose}>{t('done')}</button>
    </>
  );

  return (
    <form className={styles.form} onSubmit={e => { e.preventDefault(); send(); }}>
      {step === 'quick' ? (
        <>
          <div className={styles.head}>
            <h2>{t('report_title')}</h2>
            <p>M{nf.format(Math.round(q.mag * 10) / 10)} · {q.region} · {timeAgo(t as never, q.time)}</p>
          </div>
          <div className={styles.intensity} aria-live="polite">
            <span className={styles.roman} style={{ background: color, color: ink }}>{ROMAN[mmi - 1]}</span>
            <span><strong>{mmiLabel}</strong><small>MMI {ROMAN[mmi - 1]} / X</small></span>
          </div>
          <input className={styles.slider} type="range" min={1} max={10} step={1} value={mmi} onChange={e => setMmi(+e.target.value)}
            aria-label={t('report_title')} aria-valuetext={`MMI ${ROMAN[mmi - 1]} · ${mmiLabel}`} />
          <textarea className={styles.note} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder={t('note_ph')} maxLength={500} aria-label={t('note_ph')} />
        </>
      ) : (
        <>
          <h2 className={styles.h2}>{t('more_detail')}</h2>
          <fieldset className={styles.group}><legend>{t('where')}</legend>
            <div className={styles.seg}>
              {[t('indoors'), t('outdoors')].map((label, i) => <button key={i} type="button" aria-pressed={place === i} onClick={() => setPlace(i)}>{label}</button>)}
            </div>
          </fieldset>
          <fieldset className={styles.group}><legend>{t('duration')}</legend>
            <div className={styles.chips}>{DURATIONS.map((label, i) => <button key={i} type="button" aria-pressed={duration === i} onClick={() => setDuration(duration === i ? null : i)}>{label}</button>)}</div>
          </fieldset>
          <fieldset className={styles.group}><legend>{t('moved')}</legend>
            <div className={styles.chips}>{m.moved_opts.map((label, i) => (
              <button key={i} type="button" aria-pressed={moved.includes(i)} onClick={() => setMoved(v => (v.includes(i) ? v.filter(x => x !== i) : [...v, i]))}>{label}</button>
            ))}</div>
          </fieldset>
          <fieldset className={styles.group}><legend>{t('damage')}</legend>
            <div className={styles.chips}>{m.damage_opts.map((label, i) => <button key={i} type="button" aria-pressed={damage === i} onClick={() => setDamage(damage === i ? null : i)}>{label}</button>)}</div>
          </fieldset>
        </>
      )}
      {state === 'error' && <p className={styles.error} role="alert">{t('report_error')}</p>}
      <button type="submit" className={styles.primary} disabled={state === 'sending'}>{t('send')}</button>
      {step === 'quick' && <button type="button" className={styles.link} onClick={() => setStep('details')}>{t('more_detail')} ›</button>}
    </form>
  );
}

export interface FeltCell { lat: number; lon: number; n: number; mmi: number }

/**
 * Felt reports for a quake as ~10 km cells (GET /api/reports). In demo mode nothing is stored on the server,
 * so this device's own report (if it had a location) is shown on its own.
 */
export function useFeltCells(quakeId: string | null) {
  const { mine } = useFeltReport();
  const [data, setData] = useState<{ id: string; cells: FeltCell[]; demo: boolean } | null>(null);
  useEffect(() => {
    if (!quakeId) return;
    let alive = true;
    fetch('/api/reports?quakeId=' + encodeURIComponent(quakeId))
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive) setData({ id: quakeId, cells: j?.cells ?? [], demo: !j || !!j.demo }); })
      .catch(() => { if (alive) setData({ id: quakeId, cells: [], demo: true }); });
    return () => { alive = false; };
  }, [quakeId]);
  return useMemo(() => {
    if (!quakeId || data?.id !== quakeId) return { loading: !!quakeId, cells: [] as FeltCell[], total: 0 };
    const own = mine[quakeId];
    const cells = data.demo && own?.lat != null && own.lon != null ? [...data.cells, { lat: own.lat, lon: own.lon, n: 1, mmi: own.mmi }] : data.cells;
    return { loading: false, cells, total: cells.reduce((s, c) => s + c.n, 0) };
  }, [quakeId, data, mine]);
}
