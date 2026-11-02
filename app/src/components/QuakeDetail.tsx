'use client';
// Quake detail: used by the desktop dashboard panel and the phone detail sheet (Feed, Map, Globe).
/* eslint-disable @next/next/no-img-element -- small bundled flag SVGs */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { countryAt } from '@/lib/country';
import { formatDms } from '@/lib/geo';
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
  const country = useMemo(() => countryAt(q.lat, q.lon), [q.lat, q.lon]);
  const countryName = country ? regionName(locale, country.code) : null;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(q.time);
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(q.time);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${location.origin}${regionHref(q.id)}`;
    const text = `M${q.mag.toFixed(1)} · ${q.region} · ${date} ${time}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'sisma', text, url }); return; }
    } catch (e) { if ((e as Error).name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* clipboard unavailable */ }
  };

  return (
    <>
      <div className={styles.detailHead}>
        <MagBadge mag={q.mag} size={56} />
        <div className={styles.detailTitle}>
          <span className={styles.detailPlace}>
            {country && <img src={`/flags/${country.code}.svg`} alt="" width={20} height={20} className={styles.detailFlag} />}
            <FitLine as="strong" min={12}>{q.region}</FitLine>
          </span>
          <FitLine min={10}>{q.title}</FitLine>
        </div>
        {onClose && <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t('done')}><span className="ms">close</span></button>}
      </div>
      {q.tsunami && <div className={styles.banner}><span className="ms" aria-hidden="true">tsunami</span>{t('tsunami')}</div>}
      <dl className={styles.stats}>
        <div><dt>{t('magnitude')}</dt><FitLine as="dd">{q.mag.toFixed(1)}{q.magType ? ` ${q.magType}` : ''}</FitLine></div>
        <div><dt>{t('depth')}</dt><FitLine as="dd">{nf.format(Math.round(q.depthKm))} km</FitLine></div>
        <div><dt>{t('date')}</dt><FitLine as="dd">{date}</FitLine></div>
        <div><dt>{t('time')}</dt><FitLine as="dd">{time}</FitLine></div>
        <div><dt>{m.dash.distance}</dt><FitLine as="dd">{q.distanceKm != null ? `${nf.format(Math.round(q.distanceKm))} km` : '—'}</FitLine></div>
        <div><dt>{t('country')}</dt><FitLine as="dd">{countryName ? (country!.near ? t('near_country', { country: countryName }) : countryName) : '—'}</FitLine></div>
        <div className={styles.statWide}><dt>{t('coords')}</dt><FitLine as="dd">{formatDms(q.lat, q.lon)}</FitLine></div>
        <div className={styles.statWide}><dt>{t('source')}</dt><FitLine as="dd">{[q.source, ...(q.alsoIn ?? [])].map(s => s.toUpperCase()).join(' · ')}</FitLine></div>
      </dl>
      <div className={styles.detailActions}>
        <button type="button" className={styles.regionBtn} onClick={onShowRegion ?? (() => router.push(regionHref(q.id)))}>
          <span className="ms" aria-hidden="true">travel_explore</span>{t('show_region')}
        </button>
        <button type="button" className={styles.regionBtn} onClick={share} aria-live="polite">
          <span className="ms" aria-hidden="true">{copied ? 'check' : 'ios_share'}</span>{copied ? t('link_copied') : t('share')}
        </button>
      </div>
      <FeltButton q={q} variant="block" fallback={<FitLine as="p" className={styles.windowNote}>{t('report_window')}</FitLine>} />
      {!!q.felt && <p className={styles.felt}><span className="ms" aria-hidden="true">vibration</span><FitLine>{t('felt_by', { n: nf.format(q.felt) })}</FitLine></p>}
    </>
  );
}

/** Localised country name for an ISO alpha-2 code (e.g. "pl" → "Poland", "Polen"); falls back to the code. */
function regionName(locale: string, code: string) {
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code.toUpperCase(); } catch { return code.toUpperCase(); }
}
