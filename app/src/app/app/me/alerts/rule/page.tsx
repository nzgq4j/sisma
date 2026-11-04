'use client';
// Me → Alerts → one alert rule (?id=): name, on/off, minimum magnitude (with what each level means), what to watch
// (near the saved places within a distance, and/or countries and world regions), quiet hours in this device's time
// zone (strong quakes can still come through), how many earthquakes in the last 30 days would have sent it, and
// delete. Every change is saved straight away (public.alert_rules; RLS: own rows; the database re-checks sisma+).
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useDistance } from '@/components/Units';
import { Sheet, SheetOptions } from '@/components/Sheet';
import { AreaPicker, countryName } from '@/components/alerts/shared';
import { deviceTimeZone, useAlertRules, type Rule } from '@/components/alerts/useAlerts';
import { minutesToTime, timeToMinutes } from '@/components/alerts/describe';
import { ALERT_RADII, snapRadius } from '@/lib/alert-radius';
import { ruleMatch } from '@/lib/alerts/match';
import { countryAt } from '@/lib/country';
import { worldRegion, type WorldRegion } from '@/lib/world-regions';
import type { Quake } from '@/lib/quakes/types';
import me from '../../me.module.css';
import sub from '../../subscription/subscription.module.css';
import styles from '../alerts.module.css';

/** Minimum magnitude choices; whole steps carry a short description of what such quakes do. */
const MAGS = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];

export default function RulePage() {
  return <Suspense><RuleEditor /></Suspense>;
}

function RuleEditor() {
  const { m, locale } = useT();
  const k = m.rules;
  const id = useSearchParams().get('id');
  const router = useRouter();
  const { plan, places } = useApp();
  const u = useDistance();
  const a = useAlertRules();
  const rule = a.rules.find(r => r.id === id) ?? null;
  const [open, setOpen] = useState<null | 'radius' | 'areas' | 'delete'>(null);
  const [name, setName] = useState<string | null>(null);
  const back = <Link href="/app/me/alerts" className={sub.back}><span className="ms" aria-hidden="true">arrow_back</span>{m.sub.back}</Link>;

  if (a.loading) return <div className={me.page}>{back}</div>;
  if (!rule || plan !== 'plus') {
    return <div className={me.page}>{back}<p className={me.hint}>{plan !== 'plus' ? k.locked_h : k.not_found}</p></div>;
  }
  const save = (patch: Partial<Rule>) => void a.update(rule.id, patch);
  const index = a.rules.indexOf(rule);
  const radius = snapRadius(rule.radiusKm, u.units);
  const areas = [...rule.regions.map(r => m.wr[r as WorldRegion] ?? r), ...rule.countries.map(c => countryName(locale, c))];
  const nf1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className={me.page}>
      {back}
      <h1 className={sub.h1}>{rule.name || k.unnamed.replace('{n}', String(index + 1))}</h1>

      <div className={me.card}>
        <label className={styles.field}>
          <span className={styles.label}>{k.name}</span>
          <input className={styles.input} value={name ?? rule.name} maxLength={40} placeholder={k.name_ph}
            onChange={e => setName(e.target.value)} onBlur={() => { if (name !== null && name.trim() !== rule.name) save({ name: name.trim() }); setName(null); }} />
        </label>
        <button type="button" className={me.row} role="switch" aria-checked={rule.enabled} onClick={() => save({ enabled: !rule.enabled })}>
          <span className="ms" aria-hidden="true">notifications_active</span><span className={me.grow}>{k.enabled}</span>
          <span className={me.switch} aria-hidden="true"><span /></span>
        </button>
      </div>

      <div className={styles.sectionHead}><span>{k.mag_h}</span></div>
      <p className={me.hint}>{k.mag_p}</p>
      <div className={styles.levels} role="radiogroup" aria-label={k.mag_h}>
        {MAGS.map(v => {
          const desc = Number.isInteger(v) ? (k as Record<string, string>)[`mag_${v}`] : null;
          return (
            <button key={v} type="button" role="radio" aria-checked={rule.minMagnitude === v} className={styles.level} onClick={() => save({ minMagnitude: v })}>
              <span className={styles.radio} aria-hidden="true" />
              <span className={styles.levelText}><strong>M{nf1.format(v)}+</strong>{desc && <span>{desc}</span>}</span>
            </button>
          );
        })}
      </div>

      <Last30 rule={rule} />

      <div className={styles.sectionHead}><span>{k.watch_h}</span></div>
      <div className={me.card}>
        <button type="button" className={me.row} role="switch" aria-checked={rule.nearPlaces} onClick={() => save({ nearPlaces: !rule.nearPlaces })}>
          <span className="ms" aria-hidden="true">location_on</span>
          <span className={me.grow}>{k.near_h}<span className={me.rowHint}>{places.length ? places.map(p => p.name).join(' · ') : k.near_none}</span></span>
          <span className={me.switch} aria-hidden="true"><span /></span>
        </button>
        {rule.nearPlaces && (
          <button type="button" className={me.row} aria-haspopup="dialog" onClick={() => setOpen('radius')}>
            <span className="ms" aria-hidden="true">radar</span><span className={me.grow}>{m.alert_radius}</span>
            <span className={me.meta}>{radius ? u.dist(radius) : m.acct.anywhere}</span><span className={`ms ${me.chev}`} aria-hidden="true">chevron_right</span>
          </button>
        )}
        <button type="button" className={me.row} aria-haspopup="dialog" onClick={() => setOpen('areas')}>
          <span className="ms" aria-hidden="true">public</span><span className={me.grow}>{m.notif.areas_label}</span>
          <span className={`${me.meta} ${me.metaClip}`}>{areas.length ? areas.join(', ') : m.notif.areas_none}</span>
          <span className={`ms ${me.chev}`} aria-hidden="true">chevron_right</span>
        </button>
      </div>

      <div className={styles.sectionHead}><span>{k.quiet}</span></div>
      <div className={me.card}>
        <button type="button" className={me.row} role="switch" aria-checked={rule.quiet} onClick={() => save({ quiet: !rule.quiet, quietTz: deviceTimeZone() })}>
          <span className="ms" aria-hidden="true">bedtime</span>
          <span className={me.grow}>{k.quiet}<span className={me.rowHint}>{k.quiet_p.replace('{tz}', rule.quietTz)}</span></span>
          <span className={me.switch} aria-hidden="true"><span /></span>
        </button>
        {rule.quiet && (
          <>
            <div className={styles.times}>
              <label>{k.from}<input type="time" className={styles.input} value={minutesToTime(rule.quietFrom)}
                onChange={e => { const v = timeToMinutes(e.target.value); if (v !== null) save({ quietFrom: v, quietTz: deviceTimeZone() }); }} /></label>
              <label>{k.to}<input type="time" className={styles.input} value={minutesToTime(rule.quietTo)}
                onChange={e => { const v = timeToMinutes(e.target.value); if (v !== null) save({ quietTo: v, quietTz: deviceTimeZone() }); }} /></label>
            </div>
            <button type="button" className={me.row} role="switch" aria-checked={rule.quietMajor} onClick={() => save({ quietMajor: !rule.quietMajor })}>
              <span className="ms" aria-hidden="true">priority_high</span>
              <span className={me.grow}>{k.major_h}<span className={me.rowHint}>{k.major_p}</span></span>
              <span className={me.switch} aria-hidden="true"><span /></span>
            </button>
          </>
        )}
      </div>

      {a.error && <p className={me.errLine} role="alert">{m.acct.error}</p>}
      <button type="button" className={styles.danger} onClick={() => setOpen('delete')}>{k.delete}</button>

      <Sheet open={open === 'radius'} onClose={() => setOpen(null)} title={m.alert_radius}>
        <SheetOptions value={String(radius)} onPick={v => { save({ radiusKm: Number(v) }); setOpen(null); }}
          options={ALERT_RADII[u.units].map(r => ({ value: String(r), label: r ? u.dist(r) : m.acct.anywhere }))} />
      </Sheet>
      <AreaPicker open={open === 'areas'} onClose={() => setOpen(null)} countries={rule.countries} regions={rule.regions}
        onChange={(countries, regions) => save({ countries, regions: regions as WorldRegion[] })} />
      <Sheet open={open === 'delete'} onClose={() => setOpen(null)} title={k.delete_h}>
        <p className={me.hint}>{k.delete_p}</p>
        <div className={styles.sheetActions}>
          <button type="button" className={styles.cancel} onClick={() => setOpen(null)}>{k.cancel}</button>
          <button type="button" className={styles.danger} onClick={async () => { if (await a.remove(rule.id)) router.replace('/app/me/alerts'); setOpen(null); }}>{k.delete}</button>
        </div>
      </Sheet>
    </div>
  );
}

/** How many earthquakes in the last 30 days would have sent this alert, per day (like the polar lights level chart). */
function Last30({ rule }: { rule: Rule }) {
  const { m, nf, locale } = useT();
  const k = m.rules;
  const { places, locations, active } = useApp();
  const [data, setData] = useState<{ quakes: Quake[]; at: number } | null>(null);
  const loc = locations[active];
  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ range: '30d', sort: 'time', lat: String(loc.lat), lon: String(loc.lon) });
    const done = (quakes: Quake[]) => { if (alive) setData({ quakes, at: Date.now() }); };
    fetch('/api/quakes?' + qs).then(r => (r.ok ? r.json() : null)).then(j => done(j?.quakes ?? [])).catch(() => done([]));
    return () => { alive = false; };
  }, [loc.lat, loc.lon]);
  const days = useMemo(() => {
    if (!data) return null;
    const start = data.at - 30 * 864e5, out = new Array<number>(30).fill(0);
    const locs = places.map(p => ({ name: p.name, lat: p.lat, lon: p.lon }));
    for (const q of data.quakes) {
      if (q.time < start) continue;
      const area = () => ({ country: countryAt(q.lat, q.lon)?.code ?? null, region: worldRegion(q.lat, q.lon) });
      if (ruleMatch(rule, q, locs, area, q.time)) out[Math.min(29, Math.floor((q.time - start) / 864e5))]++;
    }
    return out;
  }, [data, places, rule]);
  const total = days?.reduce((s, n) => s + n, 0) ?? 0, max = Math.max(1, ...(days ?? [0]));
  const first = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format((data?.at ?? 0) - 29 * 864e5);
  return (
    <div className={styles.chart}>
      <span className={styles.chartSub}>{k.chart_h}</span>
      {days === null ? <span className={styles.chartSub}>{k.chart_loading}</span> : (
        <>
          <span className={styles.chartBig}><b>{nf.format(total)}</b> {total === 1 ? k.chart_1 : k.chart_n}</span>
          <div className={styles.bars} role="img" aria-label={`${k.chart_h}: ${nf.format(total)} ${total === 1 ? k.chart_1 : k.chart_n}`}>
            {days.map((n, i) => <i key={i} data-zero={n === 0 ? '' : undefined} style={{ height: `${n ? Math.max(8, (n / max) * 100) : 3}%` }} />)}
          </div>
          <div className={styles.axis}><span>{first}</span><span>{k.chart_today}</span></div>
          <span className={me.hint}>{k.chart_note}</span>
        </>
      )}
    </div>
  );
}
