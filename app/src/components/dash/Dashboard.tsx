'use client';
// Desktop /app: overview dashboard. Filters sit in one row above everything they affect;
// map, charts, list and detail panel all read the same filtered set and share one selection.
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { MagBadge } from '@/components/MagBadge';
import { timeAgo } from '@/components/QuakeRow';
import { MAG_SCALE, magColor } from '@/lib/theme';
import type { Quake, RangeKey, SortKey } from '@/lib/quakes/types';
import { WorldMap } from './WorldMap';
import { ChartCard, ColumnChart, RankBars, type Bar } from './Charts';
import styles from './dash.module.css';

type Row = Quake & { distanceKm: number | null };
type DashRange = Extract<RangeKey, '24h' | '7d' | '30d' | '1y'>;
const RANGES: DashRange[] = ['24h', '7d', '30d', '1y'];
const RANGE_LABEL = { '24h': 'r24', '7d': 'r7', '30d': 'r30', '1y': 'r1y' } as const;
const SORT_LABEL = { time: 'sort_time', distance: 'sort_distance', mag: 'sort_mag' } as const;
const MAG_BINS = [...MAG_SCALE].reverse().map(([min], i, a) => ({ min: i === 0 ? -99 : min, max: a[i + 1]?.[0] ?? 99 }));
const REFRESH_MS = 120_000;

export function Dashboard() {
  const { t, m, nf, locale } = useT();
  const { locations, active, plan } = useApp();
  const loc = locations[active];
  const [range, setRange] = useState<DashRange>('7d');
  const [region, setRegion] = useState('all');
  const [sort, setSort] = useState<SortKey>('time');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [now, setNow] = useState(0); // time of the last successful load; keeps render pure
  const [selId, setSelId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      const qs = new URLSearchParams({ range, sort: 'time', lat: String(loc.lat), lon: String(loc.lon) });
      fetch('/api/quakes?' + qs).then(r => (r.ok ? r.json() : null)).then(j => { if (alive && j) { setNow(Date.now()); setRows(j.quakes); } }).catch(() => {});
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(id); };
  }, [range, loc.lat, loc.lon]);

  // Defensive: one row per id and only plottable coordinates, so map keys stay unique.
  const all = useMemo(() => {
    const seen = new Set<string>();
    return (rows ?? []).filter(q => !seen.has(q.id) && seen.add(q.id) && Math.abs(q.lat) <= 90 && Math.abs(q.lon) <= 180);
  }, [rows]);
  const list = useMemo(() => (region === 'all' ? all : all.filter(q => q.region === region)), [all, region]);
  const sorted = useMemo(() => {
    const s = [...list];
    if (sort === 'mag') s.sort((a, b) => b.mag - a.mag);
    else if (sort === 'distance') s.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    else s.sort((a, b) => b.time - a.time);
    return s;
  }, [list, sort]);
  const sel = list.find(q => q.id === selId) ?? null;

  const regions = useMemo(() => {
    const c = new Map<string, number>();
    all.forEach(q => c.set(q.region, (c.get(q.region) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const strongest = useMemo(() => list.reduce<Row | null>((a, q) => (!a || q.mag > a.mag ? q : a), null), [list]);
  const nearest = useMemo(() => {
    const recent = list.filter(q => now - q.time <= 7 * 864e5 && q.distanceKm != null);
    return recent.reduce<Row | null>((a, q) => (!a || q.distanceKm! < a.distanceKm! ? q : a), null);
  }, [list, now]);
  const tsunamis = useMemo(() => list.filter(q => q.tsunami).length, [list]);

  const activity: Bar[] = useMemo(() => {
    const hourly = range === '24h', step = hourly ? 36e5 : 864e5;
    const n = hourly ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 52;
    const width = range === '1y' ? 7 * 864e5 : step;
    const end = hourly ? Math.ceil(now / step) * step : new Date(now).setHours(24, 0, 0, 0);
    const fmt = new Intl.DateTimeFormat(locale, hourly ? { hour: 'numeric' } : range === '7d' ? { weekday: 'short' } : { day: 'numeric', month: 'short' });
    const tipFmt = new Intl.DateTimeFormat(locale, hourly ? { weekday: 'short', hour: 'numeric', minute: '2-digit' } : { weekday: 'short', day: 'numeric', month: 'short' });
    const bins = Array.from({ length: n }, (_, i) => { const start = end - (n - i) * width; return { key: String(start), label: fmt.format(start), tip: tipFmt.format(start), value: 0 }; });
    list.forEach(q => { const i = n - 1 - Math.floor((end - q.time - 1) / width); if (i >= 0 && i < n) bins[i].value++; });
    return bins;
  }, [list, range, locale, now]);

  const magBars: Bar[] = useMemo(() => MAG_BINS.map(b => ({
    key: String(b.min), label: b.min < 0 ? `<${b.max}` : b.max >= 99 ? `${b.min}+` : `${b.min}–${b.max}`,
    tip: `M ${b.min < 0 ? `< ${b.max}` : b.max >= 99 ? `${b.min}+` : `${b.min}–${b.max}`}`,
    value: list.filter(q => q.mag >= b.min && q.mag < b.max).length, color: magColor(b.min < 0 ? 0 : b.min).fill,
  })), [list]);

  const regionBars: Bar[] = regions.slice(0, 7).map(([r, n]) => ({ key: r, label: r, value: n }));
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className={styles.dash}>
      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <h1 className={styles.h1}>{m.dash.overview}</h1>
          <span className={styles.live}><span className={styles.liveDot} />{t('live')}</span>
        </div>
        <div className={styles.filters}>
          <div className={styles.seg} role="group" aria-label={t('time')}>
            {RANGES.map(r => {
              const locked = r === '1y' && plan === 'free';
              return locked
                ? <Link key={r} href="/app/me" className={styles.segBtn}>{t(RANGE_LABEL[r])} <span className="ms" aria-hidden="true">lock</span></Link>
                : <button key={r} type="button" className={styles.segBtn} aria-pressed={range === r} onClick={() => setRange(r)}>{t(RANGE_LABEL[r])}</button>;
            })}
          </div>
          <label className={styles.selectWrap}>
            <span className="ms" aria-hidden="true">location_on</span>
            <select value={region} onChange={e => { setRegion(e.target.value); setSelId(null); }} aria-label={t('regions')}>
              <option value="all">{t('all_regions')}</option>
              {regions.map(([r, n]) => <option key={r} value={r}>{r} ({nf.format(n)})</option>)}
            </select>
          </label>
        </div>
      </header>

      <section className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>{m.dash.quakes}</span>
          <span className={styles.kpiValue}>{rows ? nf.format(list.length) : '—'}</span>
          <span className={styles.kpiSub}>{t(RANGE_LABEL[range])}</span>
        </div>
        <button type="button" className={styles.kpi} disabled={!strongest} onClick={() => strongest && setSelId(strongest.id)}>
          <span className={styles.kpiLabel}>{m.dash.strongest}</span>
          <span className={styles.kpiValue}>{strongest ? `M${strongest.mag.toFixed(1)}` : '—'}</span>
          <span className={styles.kpiSub}>{strongest ? `${strongest.region} · ${timeAgo(t as never, strongest.time)}` : ''}</span>
        </button>
        <button type="button" className={styles.kpi} disabled={!nearest} onClick={() => nearest && setSelId(nearest.id)}>
          <span className={styles.kpiLabel}>{t('nearest')}</span>
          <span className={styles.kpiValue}>{nearest ? `${nf.format(Math.round(nearest.distanceKm!))} km` : '—'}</span>
          <span className={styles.kpiSub}>{nearest ? `M${nearest.mag.toFixed(1)} · ${nearest.region}` : loc.name}</span>
        </button>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>{m.dash.tsunami_n}</span>
          <span className={styles.kpiValue}>{rows ? nf.format(tsunamis) : '—'}</span>
          <span className={styles.kpiSub}>{t(RANGE_LABEL[range])}</span>
        </div>
      </section>

      <div className={styles.main}>
        <div className={styles.leftCol}>
          <section className={`${styles.card} ${styles.mapCard}`}>
            <WorldMap quakes={list} centerLon={loc.lon} selectedId={selId} onSelect={q => setSelId(q.id)} />
            <div className={styles.mapLegend} aria-hidden="true">
              <span>M</span>
              {[...MAG_SCALE].reverse().map(([min, fill]) => <i key={min} style={{ background: fill }} />)}
              <span>7+</span>
            </div>
            {!rows && <div className={styles.mapLoading}>{m.dash.loading}</div>}
          </section>
          <div className={styles.charts}>
            <ChartCard title={m.dash.activity} sub={range === '24h' ? m.dash.per_hour : m.dash.per_day} rows={activity}>
              <ColumnChart bars={activity} ticks={(i, n) => n <= 8 || i % Math.ceil(n / 6) === 0} />
            </ChartCard>
            <ChartCard title={m.dash.mag_dist} rows={magBars}>
              <ColumnChart bars={magBars} />
            </ChartCard>
            <ChartCard title={m.dash.top_regions} rows={regionBars}>
              <RankBars bars={regionBars} active={region} onPick={r => { setRegion(region === r ? 'all' : r); setSelId(null); }} />
            </ChartCard>
          </div>
        </div>

        <aside className={styles.rightCol}>
          <section className={`${styles.card} ${styles.detail}`} aria-live="polite">
            {sel ? (
              <>
                <div className={styles.detailHead}>
                  <MagBadge mag={sel.mag} size={56} />
                  <div className={styles.detailTitle}>
                    <strong>{sel.region}</strong>
                    <span>{sel.title}</span>
                  </div>
                  <button type="button" className={styles.iconBtn} onClick={() => setSelId(null)} aria-label={t('done')}><span className="ms">close</span></button>
                </div>
                {sel.tsunami && <div className={styles.banner}><span className="ms" aria-hidden="true">tsunami</span>{t('tsunami')}</div>}
                <dl className={styles.stats}>
                  <div><dt>{t('magnitude')}</dt><dd>{sel.mag.toFixed(1)}{sel.magType ? ` ${sel.magType}` : ''}</dd></div>
                  <div><dt>{t('depth')}</dt><dd>{nf.format(Math.round(sel.depthKm))} km</dd></div>
                  <div><dt>{t('time')}</dt><dd>{dateFmt.format(sel.time)}</dd></div>
                  <div><dt>{m.dash.distance}</dt><dd>{sel.distanceKm != null ? `${nf.format(Math.round(sel.distanceKm))} km` : '—'}</dd></div>
                  <div><dt>{t('coords')}</dt><dd>{sel.lat.toFixed(2)}°, {sel.lon.toFixed(2)}°</dd></div>
                  <div><dt>{t('source')}</dt><dd>{[sel.source, ...(sel.alsoIn ?? [])].map(s => s.toUpperCase()).join(' · ')}</dd></div>
                </dl>
                {!!sel.felt && <p className={styles.felt}><span className="ms" aria-hidden="true">vibration</span>{t('felt_by', { n: nf.format(sel.felt) })}</p>}
                {sel.url && <a href={sel.url} target="_blank" rel="noreferrer" className={styles.extLink}>{m.dash.open_source}<span className="ms" aria-hidden="true">open_in_new</span></a>}
              </>
            ) : (
              <div className={styles.empty}><span className="ms" aria-hidden="true">touch_app</span>{m.dash.select_hint}</div>
            )}
          </section>

          <section className={`${styles.card} ${styles.listCard}`}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{m.dash.count_label.replace('{n}', nf.format(list.length))}</h2>
              <div className={styles.segSmall} role="group" aria-label={t('filters')}>
                {(['time', 'distance', 'mag'] as SortKey[]).map(k => (
                  <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{t(SORT_LABEL[k])}</button>
                ))}
              </div>
            </header>
            <ul className={styles.list}>
              {sorted.slice(0, 250).map(q => (
                <li key={q.id}>
                  <button type="button" className={styles.row} aria-pressed={q.id === selId} onClick={() => setSelId(q.id)}>
                    <MagBadge mag={q.mag} size={38} />
                    <span className={styles.rowText}>
                      <strong>{q.region}</strong>
                      <span>{q.title}</span>
                    </span>
                    <span className={styles.rowMeta}>
                      <span>{timeAgo(t as never, q.time)}</span>
                      {q.distanceKm != null && <span>{nf.format(Math.round(q.distanceKm))} km</span>}
                    </span>
                  </button>
                </li>
              ))}
              {rows && !list.length && <li className={styles.empty}>{m.dash.none}</li>}
            </ul>
          </section>
        </aside>
      </div>
      <p className={styles.disclaimer}>{m.web.footer}</p>
    </div>
  );
}
