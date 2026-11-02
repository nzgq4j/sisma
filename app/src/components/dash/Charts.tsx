'use client';
// Small dashboard charts. Single-series bars (no legend; the card title names the series),
// hover tooltips per bar, and a table view for every chart.
import { useState, type ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import styles from './dash.module.css';

export interface Bar { key: string; label: string; value: number; color?: string; tip?: string }

export function ChartCard({ title, sub, rows, children }: { title: string; sub?: string; rows: Bar[]; children: ReactNode }) {
  const { m, nf } = useT();
  const [table, setTable] = useState(false);
  return (
    <section className={styles.card}>
      <header className={styles.cardHead}>
        <div>
          <h2 className={styles.cardTitle}>{title}</h2>
          {sub && <p className={styles.cardSub}>{sub}</p>}
        </div>
        <button type="button" className={styles.iconBtn} onClick={() => setTable(v => !v)} aria-pressed={table}
          aria-label={table ? m.dash.chart_view : m.dash.table_view} title={table ? m.dash.chart_view : m.dash.table_view}>
          <span className="ms">{table ? 'bar_chart' : 'table_rows'}</span>
        </button>
      </header>
      {table ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>{rows.map(r => <tr key={r.key}><th scope="row">{r.tip ?? r.label}</th><td>{nf.format(r.value)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : children}
    </section>
  );
}

/** Vertical bars anchored to a baseline. `ticks` picks which x labels to print. */
export function ColumnChart({ bars, ticks, color = 'var(--violet)' }: { bars: Bar[]; ticks?: (i: number, n: number) => boolean; color?: string }) {
  const { nf } = useT();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map(b => b.value));
  const show = ticks ?? (() => true);
  return (
    <div className={styles.cols}>
      <div className={styles.colsGrid} aria-hidden="true"><span>{nf.format(max)}</span></div>
      <div className={styles.colsPlot}>
        {bars.map((b, i) => (
          <div key={b.key} className={styles.colHit} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className={styles.col} style={{ height: `${(b.value / max) * 100}%`, background: b.color ?? color, opacity: hover == null || hover === i ? 1 : 0.55 }} />
            {hover === i && <div className={styles.colTip}><strong>{nf.format(b.value)}</strong><span>{b.tip ?? b.label}</span></div>}
          </div>
        ))}
      </div>
      <div className={styles.colsAxis} aria-hidden="true">
        {bars.map((b, i) => <span key={b.key}>{show(i, bars.length) ? b.label : ''}</span>)}
      </div>
    </div>
  );
}

/** Horizontal ranked bars with the label and value as text; clicking a row toggles it as a filter. */
export function RankBars({ bars, active, onPick }: { bars: Bar[]; active: string; onPick: (key: string) => void }) {
  const { nf } = useT();
  const max = Math.max(1, ...bars.map(b => b.value));
  return (
    <ul className={styles.rank}>
      {bars.map(b => (
        <li key={b.key}>
          <button type="button" className={styles.rankRow} aria-pressed={active === b.key} onClick={() => onPick(b.key)}>
            <span className={styles.rankLabel}>{b.label}</span>
            <span className={styles.rankVal}>{nf.format(b.value)}</span>
            <span className={styles.rankTrack}><span className={styles.rankBar} style={{ width: `${(b.value / max) * 100}%` }} /></span>
          </button>
        </li>
      ))}
    </ul>
  );
}
