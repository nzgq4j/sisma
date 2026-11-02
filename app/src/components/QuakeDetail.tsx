'use client';
// Quake detail: used by the desktop dashboard panel and the phone detail sheet (Feed, Map, Globe).
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { MagBadge } from './MagBadge';
import { FeltButton } from './FeltReport';
import type { Row } from './QuakeData';
import styles from './dash/dash.module.css';

/** Map URL that zooms to a quake and shows its felt reports. */
export const regionHref = (id: string) => '/app/map?focus=' + encodeURIComponent(id);

export function QuakeDetail({ q, onClose, onShowRegion }: { q: Row; onClose?: () => void; onShowRegion?: () => void }) {
  const { t, m, nf, locale } = useT();
  const router = useRouter();
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <>
      <div className={styles.detailHead}>
        <MagBadge mag={q.mag} size={56} />
        <div className={styles.detailTitle}>
          <strong>{q.region}</strong>
          <span>{q.title}</span>
        </div>
        {onClose && <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t('done')}><span className="ms">close</span></button>}
      </div>
      {q.tsunami && <div className={styles.banner}><span className="ms" aria-hidden="true">tsunami</span>{t('tsunami')}</div>}
      <dl className={styles.stats}>
        <div><dt>{t('magnitude')}</dt><dd>{q.mag.toFixed(1)}{q.magType ? ` ${q.magType}` : ''}</dd></div>
        <div><dt>{t('depth')}</dt><dd>{nf.format(Math.round(q.depthKm))} km</dd></div>
        <div><dt>{t('time')}</dt><dd>{dateFmt.format(q.time)}</dd></div>
        <div><dt>{m.dash.distance}</dt><dd>{q.distanceKm != null ? `${nf.format(Math.round(q.distanceKm))} km` : '—'}</dd></div>
        <div><dt>{t('coords')}</dt><dd>{q.lat.toFixed(2)}°, {q.lon.toFixed(2)}°</dd></div>
        <div><dt>{t('source')}</dt><dd>{[q.source, ...(q.alsoIn ?? [])].map(s => s.toUpperCase()).join(' · ')}</dd></div>
      </dl>
      <button type="button" className={styles.regionBtn} onClick={onShowRegion ?? (() => router.push(regionHref(q.id)))}>
        <span className="ms" aria-hidden="true">travel_explore</span>{t('show_region')}
      </button>
      <FeltButton q={q} variant="block" fallback={<p className={styles.windowNote}>{t('report_window')}</p>} />
      {!!q.felt && <p className={styles.felt}><span className="ms" aria-hidden="true">vibration</span>{t('felt_by', { n: nf.format(q.felt) })}</p>}
    </>
  );
}
