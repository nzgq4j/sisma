'use client';
// Official tsunami messages for an earthquake (lib/tsunami/): the banner in the summary card and detail sheet, the card
// line in the region view, the icon on feed rows and the badge in the map legend. Levels and centres are the warning
// centres' own; without an official message, USGS's tsunami flag only asks people to check official information.
import { useT } from '@/i18n/I18nProvider';
import type { Quake } from '@/lib/quakes/types';
import { BADGE_R, WAVE_PATH } from '@/lib/pin';
import { tsunamiTone, toneVar } from '@/lib/tsunami/view';
import type { TsunamiAlert } from '@/lib/tsunami/types';
import styles from './tsunami.module.css';

type Q = Pick<Quake, 'tsunami' | 'tsunamiAlert'>;

/** "Tsunami warning", "Major tsunami warning", … in the app's language. */
export function useLevelName() {
  const { m } = useT();
  return (a: TsunamiAlert) => m.tsu[`lv_${a.level}` as keyof typeof m.tsu];
}

/** Banner for an earthquake with an official message (or USGS's flag). `areas`: how many coasts to list; `full`: the
 *  link to the official message and the relay note too; `compact`: coasts on one line (region view card). A coast's own
 *  level is shown only where it differs from the message's. */
export function TsunamiBanner({ q, areas = 0, full = false, compact = false }: { q: Q; areas?: number; full?: boolean; compact?: boolean }) {
  const { m, locale, nf } = useT();
  const name = useLevelName();
  const a = q.tsunamiAlert;
  if (!a) {
    if (!q.tsunami) return null;
    return <div className={`${styles.banner} ${styles.neutral}`}><span className="ms" aria-hidden="true">tsunami</span><span>{m.tsu.check}</span></div>;
  }
  const tone = tsunamiTone(a);
  const when = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(a.issued);
  const center = m.tsu[`center_${a.center}` as keyof typeof m.tsu];
  const shown = a.areas.slice(0, areas);
  return (
    <div className={`${styles.banner} ${tone ? styles[tone] : styles.neutral}`} role={tone ? 'alert' : undefined}>
      <span className="ms" aria-hidden="true">tsunami</span>
      <div className={styles.body}>
        <strong>{name(a)}{a.status !== 'active' && <span className={styles.status}> · {a.status === 'cancelled' ? m.tsu.cancelled : m.tsu.ended}</span>}</strong>
        <span className={styles.meta} title={center}>{m.tsu.issued.replace('{center}', a.center).replace('{time}', when)}</span>
        {shown.length > 0 && compact && (
          <span className={styles.meta}>{shown.map(x => x.name).join(', ')}{a.areas.length > shown.length ? ` ${m.tsu.more_areas.replace('{n}', nf.format(a.areas.length - shown.length))}` : ''}</span>
        )}
        {shown.length > 0 && !compact && (
          <>
            <span className={styles.areasH}>{m.tsu.areas}</span>
            <ul className={styles.areas}>
              {shown.map(x => <li key={x.name}><i className={styles.dot} style={{ background: tsunamiTone({ ...a, level: x.level }) ? toneVar(tsunamiTone({ ...a, level: x.level })!) : 'var(--ink2)' }} />{x.name}{x.level !== a.level && <small> · {m.tsu[`lv_${x.level}` as keyof typeof m.tsu]}</small>}</li>)}
              {a.areas.length > shown.length && <li className={styles.more}>{m.tsu.more_areas.replace('{n}', nf.format(a.areas.length - shown.length))}</li>}
            </ul>
          </>
        )}
        {(full || areas > 0) && <a className={styles.link} href={a.url} target="_blank" rel="noopener noreferrer">{m.tsu.official}<span className="ms" aria-hidden="true">open_in_new</span></a>}
        {full && <span className={styles.relay}>{m.tsu.relay}</span>}
      </div>
    </div>
  );
}

/** Feed row icon: coloured by level for an active warning, threat, watch or advisory; neutral otherwise. */
export function TsunamiIcon({ q }: { q: Q }) {
  const name = useLevelName();
  const { m } = useT();
  if (!q.tsunamiAlert && !q.tsunami) return null;
  const tone = tsunamiTone(q.tsunamiAlert);
  const label = q.tsunamiAlert ? name(q.tsunamiAlert) : m.tsu.check;
  return <span className="ms" role="img" aria-label={label} title={label} style={{ color: tone ? toneVar(tone) : 'var(--ink2)', fontSize: 20 }}>tsunami</span>;
}

/** The pin badge as drawn on the map, for the legend. */
export function TsunamiBadgeKey() {
  const { m } = useT();
  const s = BADGE_R + 1.5;
  return (
    <span title={m.tsu.legend}>
      <svg width={s * 2} height={s * 2} viewBox={`${-s} ${-s} ${s * 2} ${s * 2}`} aria-hidden="true" style={{ flex: 'none' }}>
        <circle r={BADGE_R} fill="var(--tsu-warning)" stroke="var(--surface)" strokeWidth={1.5} />
        <path d={WAVE_PATH} fill="none" stroke="var(--tsu-ink)" strokeWidth={1.3} strokeLinecap="round" />
      </svg>
      {m.tsu.legend_short}
    </span>
  );
}
