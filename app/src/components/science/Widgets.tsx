'use client';
// Interactive article widgets from design/SismaApp.dc.html: magnitude slider (visMag),
// live depth histogram + Omori aftershock decay (visDepth), Drop/Cover/Hold + 3-day kit (visPrep), and the live
// Ring of Fire map (the M4.5+ earthquakes of the selected period around the Pacific, lib/ring-of-fire.ts).
import { useMemo, useState, useSyncExternalStore } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { geoEqualEarth, geoPath } from 'd3-geo';
import { useQuakeData, RANGE_LABEL } from '@/components/QuakeData';
import { LAND, SPHERE, usePlates } from '@/lib/world';
import { onRingOfFire } from '@/lib/ring-of-fire';
import styles from './science.module.css';

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

// Reference events for the "Comparable" line; the last three are generic descriptions (translated).
const EXAMPLES: [number, string][] = [
  [9.1, 'Tōhoku, Japan (2011)'], [8.8, 'Maule, Chile (2010)'], [7.8, 'Kahramanmaraş, Türkiye (2023)'], [7.0, 'Haiti (2010)'],
  [6.7, 'Northridge, USA (1994)'], [6.3, 'L’Aquila, Italy (2009)'], [5.8, 'Virginia, USA (2011)'], [4.5, 'ex_45'], [3.0, 'ex_30'], [2.0, 'ex_20'],
];

export function MagnitudeWidget() {
  const { t, m, nf } = useT();
  const L = m.sci.mag;
  const [M, setM] = useState(6);
  const E = Math.pow(10, 1.5 * M + 4.8), tons = E / 4.184e9, freq = Math.pow(10, 8.2 - M);
  const tnt = tons < 1e3 ? fill(L.tnt_t, { n: nf.format(Math.round(tons)) })
    : tons < 1e6 ? fill(L.tnt_kt, { n: nf.format(Math.round(tons / 1e3)) }) : fill(L.tnt_mt, { n: nf.format(Math.round(tons / 1e6)) });
  const per = freq >= 1 ? fill(L.per_year, { n: nf.format(Math.round(freq)) }) : fill(L.every_years, { n: nf.format(Math.round(1 / freq)) });
  const mmi = M < 3 ? 'I–II' : M < 4 ? 'II–IV' : M < 5 ? 'IV–VI' : M < 6 ? 'VI–VII' : M < 7 ? 'VII–IX' : 'IX+';
  const ex = EXAMPLES.reduce((b, e) => (Math.abs(e[0] - M) < Math.abs(b[0] - M) ? e : b), EXAMPLES[0]);
  const exLabel = ex[1].startsWith('ex_') ? L[ex[1] as 'ex_45' | 'ex_30' | 'ex_20'] : ex[1];
  const d1 = 128 / Math.sqrt(31.6), d2 = Math.max(3, 128 / 31.6);
  const f1 = (n: number) => n.toFixed(1);
  return (
    <section className={styles.card}>
      <div className={styles.magHead}>
        <output className={styles.magValue} htmlFor="mag-slider">M{f1(M)}</output>
        <span className={styles.muted}>MMI {mmi}</span>
      </div>
      <input id="mag-slider" className={styles.slider} type="range" min={2} max={9.5} step={0.1} value={M}
        onChange={e => setM(+e.target.value)} aria-label={t('magnitude')} aria-valuetext={`M${f1(M)}`} />
      <div className={styles.circles} aria-hidden="true">
        <div><i style={{ width: d2, height: d2, background: 'var(--mint)' }} /><span>M{f1(M - 2)}</span></div>
        <div><i style={{ width: d1, height: d1, background: '#FFA94D' }} /><span>M{f1(M - 1)}</span></div>
        <div><i style={{ width: 128, height: 128, background: 'var(--violet)' }} /><span>M{f1(M)}</span></div>
      </div>
      <p className={styles.note}>{L.area_note}</p>
      <div className={styles.facts}>
        <div><span>{L.energy}</span><strong>{tnt}</strong></div>
        <div><span>{L.worldwide}</span><strong>{per}</strong></div>
      </div>
      <p className={styles.muted} style={{ margin: 0 }}>{L.comparable} <strong className={styles.ink}>{exLabel}</strong></p>
    </section>
  );
}

const DEPTH_BANDS = [['shallow', '#2CCB9A'], ['intermediate', '#7B61FF'], ['deep', '#B5179E']] as const;

export function DepthWidget() {
  const { t, m, nf } = useT();
  const L = m.sci.depth;
  const { all, range, loaded } = useQuakeData();
  const counts = [0, 0, 0];
  all.forEach(q => { counts[q.depthKm < 70 ? 0 : q.depthKm < 300 ? 1 : 2]++; });
  const max = Math.max(1, ...counts);
  const omori = Array.from({ length: 10 }, (_, i) => 1 / Math.pow(i + 1, 1.1));
  return (
    <section className={styles.card}>
      <p className={styles.cardLabel}>{fill(L.live, { n: loaded ? nf.format(all.length) : '…', range: t(RANGE_LABEL[range]) })}</p>
      {DEPTH_BANDS.map(([key, c], i) => (
        <div key={key} className={styles.band}>
          <div className={styles.bandHead}><span>{L[key]}</span><span className={styles.muted}>{nf.format(counts[i])}</span></div>
          <div className={styles.track}><div style={{ width: `${Math.max(1.5, (counts[i] / max) * 100)}%`, background: c }} /></div>
        </div>
      ))}
      <hr className={styles.rule} />
      <p className={styles.cardLabel}>{L.omori}</p>
      <div className={styles.omori} role="img" aria-label={L.omori}>
        {omori.map((v, i) => (
          <div key={i} title={`${fill(L.day, { n: String(i + 1) })}: ${Math.round(v * 100)}%`}>
            <i style={{ height: v * 88 + 4, opacity: 0.4 + 0.6 * v }} /><span>{i + 1}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const KIT_KEY = 'sisma.kit';
// Per-device convenience only (localStorage); the checklist still works when storage is unavailable.
const kitListeners = new Set<() => void>();
let kitMemory = '{}';
const readKit = () => { try { return localStorage.getItem(KIT_KEY) ?? kitMemory; } catch { return kitMemory; } };
const writeKit = (v: string) => { kitMemory = v; try { localStorage.setItem(KIT_KEY, v); } catch { /* storage unavailable */ } kitListeners.forEach(l => l()); };
const subscribeKit = (l: () => void) => { kitListeners.add(l); return () => { kitListeners.delete(l); }; };

export function PrepWidget({ kit }: { kit: string[] }) {
  const { m } = useT();
  const L = m.sci.prep;
  const raw = useSyncExternalStore(subscribeKit, readKit, () => '{}');
  const done = useMemo<Record<number, boolean>>(() => { try { return JSON.parse(raw); } catch { return {}; } }, [raw]);
  const toggle = (i: number) => writeKit(JSON.stringify({ ...done, [i]: !done[i] }));
  const n = kit.filter((_, i) => done[i]).length;
  return (
    <div className={styles.prep}>
      <div className={styles.dch}>
        {([['south', L.drop], ['table_restaurant', L.cover], ['pan_tool', L.hold]] as const).map(([icon, label]) => (
          <div key={icon}><span className="ms" aria-hidden="true">{icon}</span><strong>{label}</strong></div>
        ))}
      </div>
      <section className={styles.card} style={{ gap: 4 }}>
        <div className={styles.kitHead}><strong>{L.kit_title}</strong><span>{n} / {kit.length}</span></div>
        {kit.map((item, i) => (
          <button key={item} type="button" role="checkbox" aria-checked={!!done[i]} className={styles.kitItem} onClick={() => toggle(i)}>
            <span className={styles.box} data-on={!!done[i]}><span className="ms" aria-hidden="true">check</span></span>{item}
          </button>
        ))}
      </section>
    </div>
  );
}

// Equal Earth centred on 170° W and cropped to the Pacific (90° E to 60° W, 62° S to 68° N), so the rim fills the card.
const RW = 640, RH = 400;
const PACIFIC = { type: 'MultiPoint' as const, coordinates: [90, 130, 170, 210, 250, 300].flatMap(lon => [[lon, -62], [lon, 0], [lon, 68]]) };
const ringProj = geoEqualEarth().rotate([170, 0]).fitExtent([[6, 6], [RW - 6, RH - 6]], PACIFIC);
const ringPath = geoPath(ringProj);
const RING_SPHERE = ringPath(SPHERE) ?? '';
const RING_LAND = ringPath(LAND) ?? '';

/** Live map of the selected period's M4.5+ earthquakes: on the Ring of Fire (warm) and elsewhere (muted), with counts. */
export function RingWidget() {
  const { t, m, nf } = useT();
  const L = m.sci.ring;
  const { all, range, loaded } = useQuakeData();
  const plates = usePlates(true);
  const platePath = useMemo(() => (plates ? ringPath(plates) ?? '' : ''), [plates]);
  const dots = useMemo(() => all.filter(q => q.mag >= 4.5).map(q => ({ q, on: onRingOfFire(q.lat, q.lon), xy: ringProj([q.lon, q.lat]) }))
    .filter(d => d.xy).sort((a, b) => Number(a.on) - Number(b.on) || a.q.mag - b.q.mag), [all]);
  const on = dots.filter(d => d.on).length, total = dots.length;
  const pct = total ? Math.round((on / total) * 100) : 0;
  return (
    <section className={styles.card}>
      <p className={styles.cardLabel}>{loaded ? fill(L.live, { n: nf.format(on), total: nf.format(total), pct: String(pct), range: t(RANGE_LABEL[range]) }) : '…'}</p>
      <svg viewBox={`0 0 ${RW} ${RH}`} className={styles.ringMap} role="img" aria-label={L.map}>
        <path d={RING_SPHERE} fill="var(--map-sea)" />
        <path d={RING_LAND} fill="var(--map-land)" stroke="var(--map-line)" strokeWidth={0.5} />
        {platePath && <path d={platePath} fill="none" stroke="var(--map-plate)" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />}
        {dots.map(({ q, on: o, xy }) => (
          <circle key={q.id} cx={xy![0]} cy={xy![1]} r={2.6 + (q.mag - 4.5) * 1.8} fill={o ? 'var(--mag-2)' : 'var(--ink2)'} fillOpacity={o ? 0.85 : 0.45}
            stroke={o ? 'var(--bg)' : 'none'} strokeWidth={0.5} />
        ))}
      </svg>
      <div className={styles.ringLegend}>
        <span><i style={{ background: 'var(--mag-2)' }} />{L.on}<b>{nf.format(on)}</b></span>
        <span><i style={{ background: 'var(--ink2)', opacity: 0.6 }} />{L.off}<b>{nf.format(total - on)}</b></span>
      </div>
      <p className={styles.ringNote}>{L.note}</p>
    </section>
  );
}
