'use client';
// Quake detail: used by the desktop dashboard panel and the phone detail sheet (Feed, Map, Globe).
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { MagBadge } from './MagBadge';
import { FeltButton } from './FeltReport';
import { FitLine } from './FitLine';
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
          <FitLine as="strong" min={12}>{q.region}</FitLine>
          <FitLine min={10}>{q.title}</FitLine>
        </div>
        {onClose && <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t('done')}><span className="ms">close</span></button>}
      </div>
      {q.tsunami && <div className={styles.banner}><span className="ms" aria-hidden="true">tsunami</span>{t('tsunami')}</div>}
      <dl className={styles.stats}>
        <div><dt>{t('magnitude')}</dt><FitLine as="dd">{q.mag.toFixed(1)}{q.magType ? ` ${q.magType}` : ''}</FitLine></div>
        <div><dt>{t('depth')}</dt><FitLine as="dd">{nf.format(Math.round(q.depthKm))} km</FitLine></div>
        <div><dt>{t('time')}</dt><FitLine as="dd">{dateFmt.format(q.time)}</FitLine></div>
        <div><dt>{m.dash.distance}</dt><FitLine as="dd">{q.distanceKm != null ? `${nf.format(Math.round(q.distanceKm))} km` : '—'}</FitLine></div>
        <div><dt>{t('coords')}</dt><FitLine as="dd">{q.lat.toFixed(2)}°, {q.lon.toFixed(2)}°</FitLine></div>
        <div><dt>{t('source')}</dt><FitLine as="dd">{[q.source, ...(q.alsoIn ?? [])].map(s => s.toUpperCase()).join(' · ')}</FitLine></div>
      </dl>
      <button type="button" className={styles.regionBtn} onClick={onShowRegion ?? (() => router.push(regionHref(q.id)))}>
        <span className="ms" aria-hidden="true">travel_explore</span>{t('show_region')}
      </button>
      <FeltButton q={q} variant="block" fallback={<FitLine as="p" className={styles.windowNote}>{t('report_window')}</FitLine>} />
      {!!q.felt && <p className={styles.felt}><span className="ms" aria-hidden="true">vibration</span><FitLine>{t('felt_by', { n: nf.format(q.felt) })}</FitLine></p>}
    </>
  );
}
