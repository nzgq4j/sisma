'use client';
// Desktop /app: overview dashboard. Filters sit in one row above everything they affect;
// map, charts, list and detail panel all read the same filtered set and share one selection.
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { MagBadge } from '@/components/MagBadge';
import { timeAgo } from '@/components/QuakeRow';
import { MAG_SCALE, magColor } from '@/lib/theme';
import type { SortKey } from '@/lib/quakes/types';
import { useQuakeData, VIEW_RANGES, RANGE_LABEL, type Row } from '@/components/QuakeData';
import { QuakeDetail } from '@/components/QuakeDetail';
import { FeltButton } from '@/components/FeltReport';
import { Sheet, SheetOptions } from '@/components/Sheet';
import { WorldMap } from './WorldMap';
import { MagFilterChip } from '@/components/stage/StageParts';
import { ChartCard, ColumnChart, RankBars, type Bar } from './Charts';
import styles from './dash.module.css';

const SORT_LABEL = { time: 'sort_time', distance: 'sort_distance', mag: 'sort_mag' } as const;
const MAG_BINS = [...MAG_SCALE].reverse().map(([min], i, a) => ({ min: i === 0 ? -99 : min, max: a[i + 1]?.[0] ?? 99 }));

export function Dashboard() {
  const { t, m, nf, locale } = useT();
  const { locations, active, plan } = useApp();
  const loc = locations[active];
  const { range, setRange, region, setRegion, loaded, list, mapList, regions, loadedAt: now } = useQuakeData();
  const [sort, setSort] = useState<SortKey>('time');
  const [selId, setSelId] = useState<string | null>(null);
  const [regionSheet, setRegionSheet] = useState(false);

  const sorted = useMemo(() => {
    const s = [...list];
    if (sort === 'mag') s.sort((a, b) => b.mag - a.mag);
    else if (sort === 'distance') s.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    else s.sort((a, b) => b.time - a.time);
    return s;
  }, [list, sort]);
  const sel = list.find(q => q.id === selId) ?? null;

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

  return (
    <div className={styles.dash}>
      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <h1 className={styles.h1}>{m.dash.overview}</h1>
          <span className={styles.live}><span className={styles.liveDot} />{t('live')}</span>
        </div>
        <div className={styles.filters}>
          <div className={styles.seg} role="group" aria-label={t('time')}>
            {VIEW_RANGES.map(r => {
              const locked = r === '1y' && plan === 'free';
              return locked
                ? <Link key={r} href="/app/me" className={styles.segBtn}>{t(RANGE_LABEL[r])} <span className="ms" aria-hidden="true">lock</span></Link>
                : <button key={r} type="button" className={styles.segBtn} aria-pressed={range === r} onClick={() => setRange(r)}>{t(RANGE_LABEL[r])}</button>;
            })}
          </div>
          <button type="button" className={styles.selectWrap} onClick={() => setRegionSheet(true)} aria-haspopup="dialog" aria-label={`${t('regions')}: ${region === 'all' ? t('all_regions') : region}`}>
            <span className="ms" aria-hidden="true">location_on</span>
            <span className={styles.selectLabel}>{region === 'all' ? t('all_regions') : `${region} (${nf.format(list.length)})`}</span>
            <span className="ms" aria-hidden="true">expand_more</span>
          </button>
          <Sheet open={regionSheet} onClose={() => setRegionSheet(false)} title={t('regions')}>
            <SheetOptions value={region} onPick={r => { setRegion(r); setSelId(null); setRegionSheet(false); }}
              options={[{ value: 'all', label: t('all_regions') }, ...regions.map(([r, n]) => ({ value: r, label: r, meta: nf.format(n) }))]} />
          </Sheet>
        </div>
      </header>

      <section className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>{m.dash.quakes}</span>
          <span className={styles.kpiValue}>{loaded ? nf.format(list.length) : '—'}</span>
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
          <span className={styles.kpiValue}>{loaded ? nf.format(tsunamis) : '—'}</span>
          <span className={styles.kpiSub}>{t(RANGE_LABEL[range])}</span>
        </div>
      </section>

      <div className={styles.main}>
        <div className={styles.leftCol}>
          <section className={`${styles.card} ${styles.mapCard}`}>
            <WorldMap projection="mercator" quakes={mapList} center={loc} selectedId={selId} onSelect={q => setSelId(q?.id ?? null)} />
            <div className={styles.mapFilter}><MagFilterChip /></div>
            <div className={styles.mapLegend} aria-hidden="true">
              <span>M</span>
              {[...MAG_SCALE].reverse().map(([min, fill]) => <i key={min} style={{ background: fill }} />)}
              <span>7+</span>
            </div>
            {!loaded && <div className={styles.mapLoading}>{m.dash.loading}</div>}
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
              <QuakeDetail q={sel} onClose={() => setSelId(null)} />
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
                <li key={q.id} className={styles.rowItem}>
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
                  <FeltButton q={q} />
                </li>
              ))}
              {loaded && !list.length && <li className={styles.empty}>{m.dash.none}</li>}
            </ul>
          </section>
        </aside>
      </div>
      <p className={styles.disclaimer}>{m.web.footer}</p>
    </div>
  );
}
