'use client';
// Shared alert pieces (Me → Alerts and the rule editor): this device's push status, and the countries / world regions
// picker (several; up to 20 of each; countries searchable by name).
import { useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { usePushDevice } from '@/components/PushDevice';
import { Sheet, SheetOptions } from '@/components/Sheet';
import COUNTRY_CODES from '@/lib/country-codes.json';
import { WORLD_REGIONS, type WorldRegion } from '@/lib/world-regions';
import styles from '@/app/app/me/me.module.css';

export function AlertDevice() {
  const { m } = useT();
  const n = m.notif;
  const push = usePushDevice();
  const msg: Record<string, string | null> = {
    checking: null, on: n.device_on, off: null, blocked: n.device_blocked, unsupported: n.device_unsupported,
    ios: n.device_ios, app_update: n.device_app_update, error: n.device_error,
  };
  return (
    <div className={styles.deviceRow} aria-live="polite">
      {msg[push.state] && <p className={push.state === 'on' ? styles.okLine : styles.hint}>{push.state === 'on' && <span className="ms" aria-hidden="true">check_circle</span>}{msg[push.state]}</p>}
      {(push.state === 'off' || push.state === 'error') && (
        <button type="button" className={styles.smallBtn} onClick={() => void push.enable()} disabled={push.busy}>
          <span className="ms" aria-hidden="true">notifications</span>{n.device_enable}
        </button>
      )}
      {push.state === 'on' && (
        <button type="button" className={styles.smallBtn} onClick={() => void push.test()} disabled={push.busy || push.tested === 'sent'}>
          <span className="ms" aria-hidden="true">{push.tested === 'sent' ? 'check' : 'send'}</span>
          {push.tested === 'sent' ? n.test_sent : n.test}
        </button>
      )}
      {push.tested === 'failed' && <p className={styles.errLine} role="alert">{n.test_failed}</p>}
    </div>
  );
}

export const MAX_AREAS = 20;
const ALL_COUNTRIES = [...new Set(Object.values(COUNTRY_CODES as Record<string, string>))];
export const countryName = (locale: string, code: string) => {
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code.toUpperCase(); } catch { return code.toUpperCase(); }
};

/** Pick countries and world regions (several; up to 20 of each). Countries can be searched by name. */
export function AreaPicker({ open, onClose, countries, regions, onChange }: {
  open: boolean; onClose: () => void; countries: string[]; regions: string[]; onChange: (countries: string[], regions: string[]) => void;
}) {
  const { m, locale } = useT();
  const n = m.notif;
  const [q, setQ] = useState('');
  const sorted = useMemo(() => ALL_COUNTRIES.map(c => ({ code: c, name: countryName(locale, c) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale)), [locale]);
  const needle = q.trim().toLocaleLowerCase(locale);
  const shown = needle ? sorted.filter(c => c.name.toLocaleLowerCase(locale).includes(needle)) : sorted;
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : list.length < MAX_AREAS ? [...list, v] : list);
  return (
    <Sheet open={open} onClose={() => { setQ(''); onClose(); }} title={n.areas_label}>
      <p className={styles.hint}>{n.areas_hint}</p>
      <div className={styles.searchForm} role="search">
        <span className={`ms ${styles.searchIcon}`} aria-hidden="true">search</span>
        <input type="search" className={styles.searchInput} value={q} onChange={e => setQ(e.target.value)} placeholder={n.area_search} aria-label={n.area_search} />
      </div>
      {!needle && regions.length + countries.length > 0 && (
        <>
          <div className={styles.pickerLabel}>{n.area_selected}</div>
          <SheetOptions values={[...regions, ...countries]}
            onPick={v => (regions.includes(v) ? onChange(countries, regions.filter(r => r !== v)) : onChange(countries.filter(c => c !== v), regions))}
            options={[
              ...regions.map(r => ({ value: r, label: m.wr[r as WorldRegion] ?? r, lead: <span className="ms" aria-hidden="true">public</span> })),
              // eslint-disable-next-line @next/next/no-img-element -- small bundled flag SVGs
              ...countries.map(c => ({ value: c, label: countryName(locale, c), lead: <img src={`/flags/${c}.svg`} alt="" width={20} height={20} className={styles.areaFlag} /> })),
            ]} />
        </>
      )}
      {!needle && (
        <>
          <div className={styles.pickerLabel}>{n.area_regions}</div>
          <SheetOptions values={regions as WorldRegion[]} onPick={r => onChange(countries, toggle(regions, r))}
            options={WORLD_REGIONS.map(r => ({ value: r, label: m.wr[r], lead: <span className="ms" aria-hidden="true">public</span> }))} />
        </>
      )}
      <div className={styles.pickerLabel}>{n.area_countries}</div>
      <SheetOptions values={countries} onPick={c => onChange(toggle(countries, c), regions)}
        // eslint-disable-next-line @next/next/no-img-element -- small bundled flag SVGs
        options={shown.map(c => ({ value: c.code, label: c.name, lead: <img src={`/flags/${c.code}.svg`} alt="" width={20} height={20} className={styles.areaFlag} /> }))} />
      <p className={styles.hint}>{n.area_limit}</p>
    </Sheet>
  );
}
