'use client';
// Event views: QuakeSummary is the default (map panels, dashboard); QuakeDetail is the detailed view, opened from
// its Details button and from Feed rows.
/* eslint-disable @next/next/no-img-element -- small bundled flag SVGs */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { countryAt } from '@/lib/country';
import { formatDms } from '@/lib/geo';
import { useT } from '@/i18n/I18nProvider';
import { MagBadge } from './MagBadge';
import { FeltButton, useFeltCells } from './FeltReport';
import { FitLine } from './FitLine';
import type { Row } from './QuakeData';
import { useDistance } from './Units';
import { ShareCardSheet } from './ShareCard';
import styles from './dash/dash.module.css';

/** Map URL that zooms to a quake and shows its felt reports. */
export const regionHref = (id: string) => '/app/map?focus=' + encodeURIComponent(id);

/** Values shared by the compact summary and the detailed view. */
function useQuakeFacts(q: Row) {
  const { locale } = useT();
  const country = useMemo(() => countryAt(q.lat, q.lon), [q.lat, q.lon]);
  return {
    country,
    countryName: country ? regionName(locale, country.code) : null,
    date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(q.time),
    time: new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(q.time),
  };
}

function Place({ q, code }: { q: Row; code?: string }) {
  return (
    <span className={styles.detailPlace}>
      {code && <img src={`/flags/${code}.svg`} alt="" width={20} height={20} className={styles.detailFlag} />}
      <FitLine as="strong" min={12}>{q.region}</FitLine>
    </span>
  );
}

/** Default view of a selected event (map panels, dashboard): the key facts, "I felt it" and a Details button. */
export function QuakeSummary({ q, onClose, onDetails }: { q: Row; onClose?: () => void; onDetails: () => void }) {
  const { t, m } = useT();
  const u = useDistance();
  const { country, date, time } = useQuakeFacts(q);
  return (
    <div className={styles.summary}>
      <div className={styles.detailHead}>
        <MagBadge mag={q.mag} size={56} />
        <div className={styles.detailTitle}>
          <Place q={q} code={country?.code} />
          <FitLine min={10}>{date} · {time}</FitLine>
          <FitLine min={10}>{q.distanceKm != null ? `${u.dist(q.distanceKm)} · ` : ''}{t('depth_deep', { d: u.depth(q.depthKm) })}</FitLine>
        </div>
        {onClose && <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t('done')}><span className="ms">close</span></button>}
      </div>
      {q.tsunami && <div className={styles.banner}><span className="ms" aria-hidden="true">tsunami</span>{t('tsunami')}</div>}
      <div className={styles.summaryActions}>
        <FeltButton q={q} />
        <button type="button" className={styles.detailsBtn} onClick={onDetails} aria-haspopup="dialog">
          {m.dash.details}<span className="ms" aria-hidden="true">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

/** Detailed view of an event (opened from Details, and from Feed rows): every data point, Share and Show region. */
export function QuakeDetail({ q, onClose, onShowRegion }: { q: Row; onClose?: () => void; onShowRegion?: () => void }) {
  const { t, m, nf } = useT();
  const u = useDistance();
  const router = useRouter();
  const { country, countryName, date, time } = useQuakeFacts(q);
  const [shareOpen, setShareOpen] = useState(false);
  // One number: felt reports sent in sisma plus those the agencies publish (USGS "Did You Feel It?").
  // Shown only when there is at least one.
  const reports = useFeltCells(q.id);
  const feltTotal = reports.total + (q.felt ?? 0);
  const shareText = `M${q.mag.toFixed(1)} · ${q.region} · ${date} ${time}`;

  return (
    <>
      <div className={styles.detailHead}>
        <MagBadge mag={q.mag} size={56} />
        <div className={styles.detailTitle}>
          <Place q={q} code={country?.code} />
          <FitLine min={10}>{u.text(q.title)}</FitLine>
        </div>
        {onClose && <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t('done')}><span className="ms">close</span></button>}
      </div>
      {q.tsunami && <div className={styles.banner}><span className="ms" aria-hidden="true">tsunami</span>{t('tsunami')}</div>}
      <dl className={styles.stats}>
        <div><dt>{t('magnitude')}</dt><FitLine as="dd">{q.mag.toFixed(1)}{q.magType ? ` ${q.magType}` : ''}</FitLine></div>
        <div><dt>{t('depth')}</dt><FitLine as="dd">{u.depth(q.depthKm)}</FitLine></div>
        <div><dt>{t('date')}</dt><FitLine as="dd">{date}</FitLine></div>
        <div><dt>{t('time')}</dt><FitLine as="dd">{time}</FitLine></div>
        <div><dt>{m.dash.distance}</dt><FitLine as="dd">{q.distanceKm != null ? u.dist(q.distanceKm) : '—'}</FitLine></div>
        <div><dt>{t('country')}</dt><FitLine as="dd">{countryName ? (country!.near ? t('near_country', { country: countryName }) : countryName) : '—'}</FitLine></div>
        <div className={styles.statWide}><dt>{t('coords')}</dt><FitLine as="dd">{formatDms(q.lat, q.lon)}</FitLine></div>
        <div><dt>{t('review_status')}</dt>
          <dd className={`${styles.statusVal} ${q.status === 'reviewed' ? styles.statusOk : ''}`}>
            {q.status && <span className="ms" aria-hidden="true">{q.status === 'reviewed' ? 'verified' : 'schedule'}</span>}
            {q.status ? t(`st_${q.status}`) : '—'}
          </dd>
        </div>
        <div><dt>{t('source')}</dt><FitLine as="dd">{[q.source, ...(q.alsoIn ?? [])].map(s => s.toUpperCase()).join(' · ')}</FitLine></div>
      </dl>
      <div className={styles.detailActions}>
        <button type="button" className={styles.regionBtn} onClick={onShowRegion ?? (() => router.push(regionHref(q.id)))}>
          <span className="ms" aria-hidden="true">travel_explore</span>{t('show_region')}
        </button>
        <button type="button" className={styles.regionBtn} onClick={() => setShareOpen(true)} aria-haspopup="dialog">
          <span className="ms" aria-hidden="true">ios_share</span>{t('share')}
        </button>
      </div>
      <FeltButton q={q} variant="block" />
      {feltTotal > 0 && (
        <p className={styles.felt}><span className="ms" aria-hidden="true">vibration</span>
          <FitLine>{feltTotal === 1 ? t('felt_by_1') : t('felt_by', { n: nf.format(feltTotal) })}</FitLine>
        </p>
      )}
      <ShareCardSheet q={q} open={shareOpen} onClose={() => setShareOpen(false)} path={regionHref(q.id)} text={shareText} />
    </>
  );
}

/** Localised country name for an ISO alpha-2 code (e.g. "pl" → "Poland", "Polen"); falls back to the code. */
function regionName(locale: string, code: string) {
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code.toUpperCase(); } catch { return code.toUpperCase(); }
}
