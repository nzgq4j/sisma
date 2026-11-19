'use client';
// Science → Data: live worldwide charts from GET /api/science/data (lib/seismic-stats.ts), sisma+ only (the API
// re-checks the plan). Each chart has a short explanation (free to read), a value on tap / hover and a hidden data
// table for screen readers. Values have their own colours (data.module.css): above-average bars and days in coral,
// magnitudes in the pin colours, depths as in the globe's Depth mode, regions warm on the Ring of Fire; text in the ink tokens.
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useAccount } from '@/components/Account';
import { TRIAL_DAYS } from '@/lib/entitlements';
import { MAG_BINS } from '@/lib/seismic-stats';
import { depthColor, magVar } from '@/lib/theme';
import type { WorldRegion } from '@/lib/world-regions';
import styles from './data.module.css';

interface Series { start: number; step: number; counts: number[] }
export interface DataStats {
  updated: number; total30: number;
  activity: { h24: Series; d7: Series; d30: Series };
  magnitudes: number[];
  depths: { shallow: number; intermediate: number; deep: number };
  regions: { list: { region: WorldRegion; count: number; ring: number }[]; ring: number; total: number };
  energy: { start: number; step: number; cumulative: number[]; total: number; largest: { mag: number; time: number; share: number } | null };
  history: { fromYear: number; counts: number[]; average: number } | null;
}

/** Loads the statistics with the person's session (the API answers 403 without sisma+). */
function useDataStats(enabled: boolean) {
  const { accessToken } = useAccount();
  const [state, setState] = useState<{ s: 'loading' } | { s: 'error' } | { s: 'ready'; d: DataStats }>({ s: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    void (async () => {
      const token = await accessToken().catch(() => null);
      const r = await fetch('/api/science/data', { headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
      const d = r?.ok ? ((await r.json()) as DataStats) : null;
      if (alive) setState(d ? { s: 'ready', d } : { s: 'error' });
    })();
    return () => { alive = false; };
  }, [enabled, accessToken]);
  return state;
}

export function DataPage() {
  const { m, t, locale } = useT();
  const k = m.data;
  const { plan, setSheet } = useApp();
  const { user } = useAccount();
  const plus = plan === 'plus';
  const st = useDataStats(plus);
  const d = st.s === 'ready' ? st.d : null;
  const when = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });

  const locked = (
    <div className={styles.locked}>
      <span className="ms" aria-hidden="true">lock</span>
      <div>
        <strong>{k.locked_h}</strong>
        <p>{user ? k.locked_p : k.signin_p}</p>
        <button type="button" className={styles.lockedBtn} onClick={() => setSheet('paywall')}>{t('trial', { n: TRIAL_DAYS })}</button>
      </div>
    </div>
  );
  const body = (chart: (d: DataStats) => React.ReactNode) =>
    !plus ? null : st.s === 'loading' ? <p className={styles.status}>{k.loading}</p>
      : st.s === 'error' ? <p className={styles.status} role="alert">{k.error}</p> : chart(st.d);

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>{k.h1} <span className={styles.badge}>{k.plus}</span></h1>
      <p className={styles.lead}>{k.lead}</p>
      {!plus && locked}
      {d && <p className={styles.updated}>{k.updated.replace('{time}', when.format(d.updated))}</p>}

      <Section title={k.activity_h} text={k.activity_p}>{body(x => <Activity d={x} />)}</Section>
      <Section title={k.mag_h} text={k.mag_p}>{body(x => <Magnitudes d={x} />)}</Section>
      <Section title={k.depth_h} text={k.depth_p}>{body(x => <Depths d={x} />)}</Section>
      <Section title={k.region_h} text={k.region_p}>{body(x => <Regions d={x} />)}</Section>
      <Section title={k.energy_h} text={k.energy_p}>{body(x => <Energy d={x} />)}</Section>
      <Section title={k.history_h} text={k.history_p}>{body(x => <History d={x} />)}</Section>

      <section className={styles.card}>
        <h2>{k.notes_h}</h2>
        <ul className={styles.notes}>{[k.note_1, k.note_2, k.note_3, k.note_4, k.note_5].map(n => <li key={n}>{n}</li>)}</ul>
      </section>
    </div>
  );
}

function Section({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className={styles.card}>
      <h2>{title}</h2>
      <p className={styles.text}>{text}</p>
      {children}
    </section>
  );
}

/** Colour key: a swatch (or the dashed average line) per entry. */
function Keys({ items }: { items: { color?: string; dashed?: boolean; label: string }[] }) {
  return (
    <p className={styles.keys}>
      {items.map(it => (
        <span key={it.label}>{it.dashed ? <i className={styles.avgKey} aria-hidden="true" /> : <i className={styles.swatch} style={{ background: it.color }} aria-hidden="true" />}{it.label}</span>
      ))}
    </p>
  );
}

/** Vertical bars with a value on tap or hover, a sparse axis and a dashed average line; bars above the average are coral. */
function Bars({ values, label, axis, avg, avgLabel, highlightLast }: {
  values: number[]; label: (i: number) => string; axis: [string, string, string]; avg: number; avgLabel: string; highlightLast?: boolean;
}) {
  const { m, nf } = useT();
  const [sel, setSel] = useState<number | null>(null);
  const W = 340, H = 140, max = Math.max(1, ...values, avg);
  const bw = W / values.length, gap = values.length > 60 ? 0.5 : 2;
  const y = (v: number) => H - (v / max) * H;
  const i = sel ?? values.length - 1;
  return (
    <div className={styles.chart}>
      <p className={styles.readout} aria-live="polite"><b>{nf.format(values[i] ?? 0)}</b> {label(i)}</p>
      <svg viewBox={`0 0 ${W} ${H + 2}`} className={styles.svg} role="img" aria-label={`${label(0)} – ${label(values.length - 1)}`}
        onPointerLeave={() => setSel(null)}>
        <line x1={0} x2={W} y1={H + 1} y2={H + 1} className={styles.base} />
        <line x1={0} x2={W} y1={y(max / 2)} y2={y(max / 2)} className={styles.grid} />
        {values.map((v, j) => {
          const h = Math.max(v > 0 ? 2 : 0, (v / max) * H);
          return (
            <g key={j} onPointerEnter={() => setSel(j)} onClick={() => setSel(j)}>
              <rect x={j * bw} y={0} width={bw} height={H + 2} fill="transparent" />
              <rect x={j * bw + gap / 2} y={H - h} width={Math.max(0.5, bw - gap)} height={h} rx={Math.min(4, (bw - gap) / 2)}
                className={[v > avg ? styles.hot : styles.bar, highlightLast && j === values.length - 1 ? styles.barMuted : '', j === i ? styles.barOn : ''].join(' ')} />
            </g>
          );
        })}
        <line x1={0} x2={W} y1={y(avg)} y2={y(avg)} className={styles.avg} />
      </svg>
      <div className={styles.axis}><span>{axis[0]}</span><span>{axis[1]}</span><span>{axis[2]}</span></div>
      <Keys items={[{ color: 'var(--chart-hot)', label: m.data.above_avg }, { color: 'var(--chart)', label: m.data.below_avg }, { dashed: true, label: avgLabel }]} />
      <table className="sr-only">
        <caption>{m.data.table}</caption>
        <tbody>{values.map((v, j) => <tr key={j}><th scope="row">{label(j)}</th><td>{v}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

/** Horizontal bars: label, bar and value on one row each. */
function HBars({ rows }: { rows: { label: string; value: number; note?: string; color?: string }[] }) {
  const { nf } = useT();
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className={styles.hbars}>
      {rows.map(r => (
        <div key={r.label} className={styles.hrow}>
          <span className={styles.hlabel}>{r.label}</span>
          <span className={styles.htrack}><i style={{ width: `${(r.value / max) * 100}%`, background: r.color }} /></span>
          <span className={styles.hvalue}>{nf.format(r.value)}{r.note && <small> · {r.note}</small>}</span>
        </div>
      ))}
    </div>
  );
}

function Activity({ d }: { d: DataStats }) {
  const { m, locale } = useT();
  const k = m.data;
  const [range, setRange] = useState<'h24' | 'd7' | 'd30'>('d7');
  const s = d.activity[range];
  const fmt = useMemo(() => range === 'h24'
    ? new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
    : new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }), [range, locale]);
  const at = (i: number) => fmt.format(s.start + i * s.step);
  const total = s.counts.reduce((a, b) => a + b, 0);
  const avg = total / Math.max(1, s.counts.length);
  const avgText = (range === 'h24' ? k.avg_hour : k.avg_day).replace('{n}', new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(avg));
  return (
    <>
      <div className={styles.seg} role="tablist">
        {(['h24', 'd7', 'd30'] as const).map(r => (
          <button key={r} type="button" role="tab" aria-selected={range === r} onClick={() => setRange(r)}>{k[r === 'h24' ? 'r24' : r === 'd7' ? 'r7' : 'r30']}</button>
        ))}
      </div>
      <p className={styles.big}>{total === 1 ? k.total_1 : k.total_n.replace('{n}', new Intl.NumberFormat(locale).format(total))}</p>
      <Bars values={s.counts} label={i => `${range === 'h24' ? k.per_hour : k.per_day} · ${at(i)}`}
        axis={[at(0), at(Math.floor(s.counts.length / 2)), at(s.counts.length - 1)]} avg={avg} avgLabel={avgText} />
    </>
  );
}

function Magnitudes({ d }: { d: DataStats }) {
  const { nf, locale } = useT();
  const f = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const bin = (i: number) => (i === MAG_BINS.length - 1 ? `M${nf.format(MAG_BINS[i])}+` : `M${f.format(MAG_BINS[i])}–${f.format(MAG_BINS[i] + 0.4)}`);
  return <HBars rows={d.magnitudes.map((v, i) => ({ label: bin(i), value: v, color: magVar(MAG_BINS[i]) }))} />;
}

/** A depth inside each class, for the globe's Depth mode colours (lib/theme.ts depthColor). */
const DEPTH_KM = { shallow: 10, intermediate: 150, deep: 400 } as const;

function Depths({ d }: { d: DataStats }) {
  const { m } = useT();
  const total = d.depths.shallow + d.depths.intermediate + d.depths.deep || 1;
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;
  return (
    <HBars rows={(['shallow', 'intermediate', 'deep'] as const).map(c => ({ label: m.sci.depth[c], value: d.depths[c], note: pct(d.depths[c]), color: depthColor(DEPTH_KM[c]) }))} />
  );
}

/** As in the Ring of Fire widget: warm on the Ring, muted elsewhere. A region takes the Ring colour when most of its events are on it. */
const RING_ON = 'var(--mag-2)', RING_OFF = 'var(--ink2)';

function Regions({ d }: { d: DataStats }) {
  const { m, nf } = useT();
  const pct = d.regions.total ? Math.round((d.regions.ring / d.regions.total) * 100) : 0;
  return (
    <>
      <p className={styles.big}>{m.data.ring.replace('{pct}', nf.format(pct))}</p>
      <HBars rows={d.regions.list.map(r => ({ label: (m.wr as Record<string, string>)[r.region] ?? r.region, value: r.count, color: r.ring * 2 > r.count ? RING_ON : RING_OFF }))} />
      <Keys items={[{ color: RING_ON, label: m.data.ring_on }, { color: RING_OFF, label: m.data.ring_off }]} />
    </>
  );
}

function Energy({ d }: { d: DataStats }) {
  const { m, locale, nf } = useT();
  const k = m.data;
  const [sel, setSel] = useState<number | null>(null);
  const e = d.energy, n = e.cumulative.length, W = 340, H = 140;
  const share = e.cumulative.map(v => (e.total ? v / e.total : 0));
  const pts = share.map((v, i) => [(i / Math.max(1, n - 1)) * W, H - v * H] as const);
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const at = (i: number) => fmt.format(e.start + i * e.step);
  const i = sel ?? n - 1;
  const line = pts.map(([x, y], j) => `${j ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  // Days that released more than the average daily energy, drawn over the line in coral.
  const daily = e.cumulative.map((v, j) => v - (j ? e.cumulative[j - 1] : 0)), mean = e.total / Math.max(1, n);
  const hot = pts.map(([x, y], j) => (j && daily[j] > mean ? `M${pts[j - 1][0].toFixed(1)},${pts[j - 1][1].toFixed(1)}L${x.toFixed(1)},${y.toFixed(1)}` : '')).join('');
  return (
    <>
      {e.largest && <p className={styles.big}>{k.energy_top.replace('{mag}', nf.format(e.largest.mag)).replace('{pct}', nf.format(Math.round(e.largest.share * 100)))}</p>}
      <div className={styles.chart}>
        <p className={styles.readout} aria-live="polite"><b>{nf.format(Math.round(share[i] * 100))}%</b> {k.energy_axis} · {at(i)}</p>
        <svg viewBox={`0 0 ${W} ${H + 2}`} className={styles.svg} role="img" aria-label={k.energy_h}
          onPointerMove={ev => { const r = (ev.currentTarget as SVGSVGElement).getBoundingClientRect(); setSel(Math.max(0, Math.min(n - 1, Math.round(((ev.clientX - r.left) / r.width) * (n - 1))))); }}
          onPointerLeave={() => setSel(null)}>
          <line x1={0} x2={W} y1={H + 1} y2={H + 1} className={styles.base} />
          <line x1={0} x2={W} y1={H / 2} y2={H / 2} className={styles.grid} />
          <path d={`${line}L${W},${H}L0,${H}Z`} className={styles.area} />
          <path d={line} className={styles.line} />
          {hot && <path d={hot} className={styles.lineHot} />}
          <line x1={pts[i][0]} x2={pts[i][0]} y1={0} y2={H} className={styles.cross} />
          <circle cx={pts[i][0]} cy={pts[i][1]} r={4} className={styles.dot} />
        </svg>
        <div className={styles.axis}><span>{at(0)}</span><span>{at(Math.floor(n / 2))}</span><span>{at(n - 1)}</span></div>
        <Keys items={[{ color: 'var(--chart-hot)', label: k.energy_hot }, { color: 'var(--chart)', label: k.energy_other }]} />
        <table className="sr-only">
          <caption>{k.table}</caption>
          <tbody>{share.map((v, j) => <tr key={j}><th scope="row">{at(j)}</th><td>{Math.round(v * 100)}%</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}

function History({ d }: { d: DataStats }) {
  const { m, nf } = useT();
  const k = m.data;
  if (!d.history) return <p className={styles.status} role="alert">{k.error}</p>;
  const h = d.history, last = h.fromYear + h.counts.length - 1;
  const year = (i: number) => h.fromYear + i;
  return (
    <Bars values={h.counts} highlightLast
      label={i => (year(i) === last ? k.this_year.replace('{year}', String(last)) : String(year(i)))}
      axis={[String(h.fromYear), String(year(Math.floor(h.counts.length / 2))), String(last)]}
      avg={h.average} avgLabel={k.avg.replace('{n}', nf.format(Math.round(h.average * 10) / 10))} />
  );
}
