'use client';
// Me tab — the account dashboard. Spec: design/SismaApp.dc.html (isMe): profile row with sign-in, plan card
// (Free → paywall, sisma+ → plan and billing), Alerts (sisma+), Saved locations (limit via entitlements), Language,
// Appearance, data sources and the disclaimer. Desktop (>= 1024px): two columns — account on the left, settings right.
// Skeleton status: sign-in, profile, plan, alert settings, language and appearance are live; saved locations are
// device-only, push delivery (build step 9) and billing (step 8) are not wired yet.
import Link from 'next/link';
import { usePushDevice } from '@/components/PushDevice';
import { useEffect, useMemo, useState } from 'react';
import { useT, LOCALES } from '@/i18n/I18nProvider';
import { useApp, type LocateResult } from '@/components/AppState';
import { useAccount } from '@/components/Account';
import { useNow } from '@/components/FeltReport';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Sheet, SheetOptions } from '@/components/Sheet';
import COUNTRY_CODES from '@/lib/country-codes.json';
import { WORLD_REGIONS, type WorldRegion } from '@/lib/world-regions';
import { setTheme, useTheme, type ThemePref } from '@/components/Theme';
import { setUnits, useDistance, useUnits, type Units } from '@/components/Units';
import { openOnboarding } from '@/components/onboarding/store';
import { FeltMapInfoSheet, setFeltMapSharing, useFeltMapSharing } from '@/components/FeltMap';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { PRICES, limits } from '@/lib/entitlements';
import type { PlaceHit } from '@/lib/places';
import { ALERT_RADII, snapRadius } from '@/lib/alert-radius';
import styles from './me.module.css';

const SOURCES = ['USGS', 'EMSC', 'GeoNet', 'JMA'];
/** Alert minimum magnitude choices (was a 3–7 slider in steps of 0.5). */
const ALERT_MAGS = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];

export default function MePage() {
  const { t, m } = useT();
  const a = m.acct;
  const { setSheet } = useApp();
  const acct = useAccount();
  const [delOpen, setDelOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const name = acct.profile?.display_name || acct.user?.email || t('guest');
  const initial = (acct.profile?.display_name || acct.user?.email || t('guest')).trim().charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <div className={styles.col}>
        <h1 className={styles.title}>{t('tab_me')}</h1>
        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden="true">{initial}</div>
          <div className={styles.who}>
            <div className={styles.name}>{name}</div>
            {acct.user && acct.profile?.display_name && <div className={styles.email}>{acct.user.email}</div>}
          </div>
          {!acct.user && acct.ready && <button type="button" className={styles.pillBtn} onClick={() => acct.openSignIn()}>{t('sign_in')}</button>}
        </div>

        <PlanCard onUpgrade={() => setSheet('paywall')} />

        {acct.user && (
          <>
            <div className={styles.sectionLabel}>{a.account}</div>
            <div className={styles.card}>
              <button type="button" className={styles.row} onClick={() => setNameOpen(true)}>
                <span className="ms" aria-hidden="true">badge</span><span className={styles.grow}>{a.display_name}</span>
                <span className={styles.meta}>{acct.profile?.display_name || a.not_set}</span><span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
              </button>
              <div className={styles.row}><span className="ms" aria-hidden="true">mail</span><span className={styles.grow}>{a.email}</span><span className={styles.meta}>{acct.user.email}</span></div>
              <button type="button" className={styles.row} onClick={acct.openPassword}>
                <span className="ms" aria-hidden="true">password</span><span className={styles.grow}>{a.password_row}</span><span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
              </button>
              <button type="button" className={styles.row} onClick={() => void acct.signOut()}><span className="ms" aria-hidden="true">logout</span><span className={styles.grow}>{a.sign_out}</span></button>
              <button type="button" className={`${styles.row} ${styles.dangerRow}`} onClick={() => setDelOpen(true)}><span className="ms" aria-hidden="true">delete</span><span className={styles.grow}>{a.delete}</span></button>
            </div>
          </>
        )}
        <p className={`${styles.disclaimer} ${styles.desktopOnly}`}>{m.web.footer} <a href="/privacy" className={styles.privacyLink}>{m.web.privacy}</a></p>
      </div>

      <div className={styles.col}>
        <Alerts onLocked={() => setSheet('paywall')} />
        <Locations onLocked={() => setSheet('paywall')} />
        <Preferences />
        <p className={`${styles.disclaimer} ${styles.phoneOnly}`}>{m.web.footer} <a href="/privacy" className={styles.privacyLink}>{m.web.privacy}</a></p>
      </div>

      <DeleteSheet open={delOpen} onClose={() => setDelOpen(false)} />
      {nameOpen && <NameSheet onClose={() => setNameOpen(false)} />}
    </div>
  );
}

function PlanCard({ onUpgrade }: { onUpgrade: () => void }) {
  const { t, m } = useT();
  const { plan } = useApp();
  const { profile } = useAccount();
  const now = useNow();
  if (plan === 'free') {
    return (
      <div className={styles.planFree}>
        <div className={styles.planTop}><span>{t('current')}</span><span className={styles.planBadge}>{t('plan_free')}</span></div>
        <div className={styles.planH}>{t('upgrade')}</div>
        <div className={styles.planP}>{m.ent_plus.slice(0, 3).join(' · ')}</div>
        <button type="button" className={styles.planBtn} onClick={onUpgrade}>{t('trial')}</button>
      </div>
    );
  }
  const trialLeft = profile?.trial_ends_at ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - now) / 86_400_000)) : 0;
  const interval = profile?.billing_interval ?? 'monthly';
  return (
    <div className={styles.planPlus}>
      <div className={styles.planTop}><span>{t('current')}</span><span>{profile?.subscription_status === 'trialing' ? t('trial_active', { n: trialLeft }) : m.acct.active}</span></div>
      <div className={styles.planH}>sisma+</div>
      <div className={styles.planSub}>{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(PRICES[interval].usd)} {t(interval === 'yearly' ? 'per_year' : 'per_month')}</div>
      <Link href="/app/me/subscription" className={styles.planManage}>{m.sub.manage}<span className="ms" aria-hidden="true">chevron_right</span></Link>
    </div>
  );
}

/** This device's alert notifications: status, a button to turn them on, and a test alert. */
function AlertDevice() {
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

const MAX_AREAS = 20;
const ALL_COUNTRIES = [...new Set(Object.values(COUNTRY_CODES as Record<string, string>))];
const countryName = (locale: string, code: string) => {
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code.toUpperCase(); } catch { return code.toUpperCase(); }
};

/** Pick countries and world regions (several; up to 20 of each). Countries can be searched by name. */
function AreaPicker({ open, onClose, countries, regions, onChange }: {
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

function Alerts({ onLocked }: { onLocked: () => void }) {
  const { t, m, nf, locale } = useT();
  const u = useDistance();
  const { plan, places } = useApp();
  const { user } = useAccount();
  const push = usePushDevice();
  const [s, setS] = useState({ enabled: false, min_magnitude: 5, radius_km: 500, countries: [] as string[], regions: [] as string[] });
  const [open, setOpen] = useState<null | 'mag' | 'radius' | 'areas'>(null);
  const [hasRow, setHasRow] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Load the saved settings (RLS: own row only).
  useEffect(() => {
    const sb = supabaseBrowser(); if (!sb || !user) return;
    let alive = true;
    sb.from('alert_settings').select('enabled, min_magnitude, radius_km, countries, regions').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!alive || !data) return;
        setS({ enabled: data.enabled, min_magnitude: Number(data.min_magnitude), radius_km: data.radius_km, countries: data.countries ?? [], regions: data.regions ?? [] });
        setHasRow(true);
      });
    return () => { alive = false; };
  }, [user]);

  // The radius is one of the choices in the current units (a radius saved in km becomes the nearest mile choice and
  // back), and the saved value is updated to match, so what is shown is what alerts use.
  const radius = snapRadius(s.radius_km, u.units);
  const areaNames = [...s.regions.map(r => m.wr[r as WorldRegion] ?? r), ...s.countries.map(c => countryName(locale, c))];
  const update = (patch: Partial<typeof s>) => {
    const nextS = { ...s, radius_km: radius, ...patch }; setS(nextS); setSaveError(false);
    const sb = supabaseBrowser(); if (!sb || !user) return;
    // The DB trigger refuses enabled = true without sisma+, so the server is the gate, not this toggle.
    void sb.from('alert_settings').upsert({ user_id: user.id, ...nextS, updated_at: new Date().toISOString() }).then(({ error }) => { if (error) setSaveError(true); });
  };
  // Store the snapped radius when it differs from the saved one (e.g. after switching units).
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!hasRow || !sb || !user || radius === s.radius_km) return;
    void sb.from('alert_settings').update({ radius_km: radius, updated_at: new Date().toISOString() }).eq('user_id', user.id)
      .then(({ error }) => { if (error) setSaveError(true); else setS(prev => ({ ...prev, radius_km: radius })); });
  }, [hasRow, radius, s.radius_km, user]);

  return (
    <>
      <div className={styles.sectionLabel}>{t('alerts')}</div>
      <div className={styles.card}>
        <button type="button" className={styles.row} role={plan === 'plus' ? 'switch' : undefined} aria-checked={plan === 'plus' ? s.enabled : undefined}
          onClick={() => {
            if (plan !== 'plus') { onLocked(); return; }
            // Turning alerts on also asks this device for notification permission (it has to come from a tap).
            if (!s.enabled && push.state === 'off') void push.enable();
            update({ enabled: !s.enabled });
          }}>
          <span className="ms" aria-hidden="true">notifications_active</span>
          <span className={styles.grow}>{t('push')}</span>
          {plan === 'plus' ? <span className={styles.switch} aria-hidden="true"><span /></span> : <Lock />}
        </button>
        {plan === 'plus' && s.enabled && (
          <div className={styles.alertBody}>
            <button type="button" className={styles.row} aria-haspopup="dialog" onClick={() => setOpen('mag')}>
              <span className="ms" aria-hidden="true">filter_alt</span><span className={styles.grow}>{t('alert_mag')}</span>
              <span className={styles.meta}>M{nf.format(s.min_magnitude)}+</span><span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
            </button>
            <button type="button" className={styles.row} aria-haspopup="dialog" onClick={() => setOpen('radius')}>
              <span className="ms" aria-hidden="true">radar</span><span className={styles.grow}>{t('alert_radius')}</span>
              <span className={styles.meta}>{radius ? u.dist(radius) : m.acct.anywhere}</span><span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
            </button>
            <button type="button" className={styles.row} aria-haspopup="dialog" onClick={() => setOpen('areas')}>
              <span className="ms" aria-hidden="true">public</span><span className={styles.grow}>{m.notif.areas_label}</span>
              <span className={`${styles.meta} ${styles.metaClip}`}>{areaNames.length ? areaNames.join(', ') : m.notif.areas_none}</span>
              <span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
            </button>
            <p className={styles.hint}>{places.length ? m.notif.coverage : s.countries.length + s.regions.length ? null : m.notif.need_location}</p>
            <Sheet open={open === 'mag'} onClose={() => setOpen(null)} title={t('alert_mag')}>
              <SheetOptions value={String(s.min_magnitude)} onPick={v => { update({ min_magnitude: Number(v) }); setOpen(null); }}
                options={ALERT_MAGS.map(v => ({ value: String(v), label: `M${nf.format(v)}+` }))} />
            </Sheet>
            <Sheet open={open === 'radius'} onClose={() => setOpen(null)} title={t('alert_radius')}>
              <SheetOptions value={String(radius)} onPick={v => { update({ radius_km: Number(v) }); setOpen(null); }}
                options={ALERT_RADII[u.units].map(r => ({ value: String(r), label: r ? u.dist(r) : m.acct.anywhere }))} />
            </Sheet>
            <AreaPicker open={open === 'areas'} onClose={() => setOpen(null)} countries={s.countries} regions={s.regions}
              onChange={(countries, regions) => update({ countries, regions })} />
            <AlertDevice />
          </div>
        )}
        {saveError && <p className={styles.errLine} role="alert">{m.acct.error}</p>}
      </div>
    </>
  );
}

function Locations({ onLocked }: { onLocked: () => void }) {
  const { t, m } = useT();
  const a = m.acct;
  const { plan, locations, active, setActive, locateMe, removePlace, canAddPlace } = useApp();
  const [loc, setLoc] = useState<LocateResult | 'busy' | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const hasDevice = locations.some(l => l.fromDevice);
  const shown = locations.filter(l => !l.fallback);
  const atPlusLimit = !canAddPlace && plan === 'plus';
  return (
    <>
      <div className={styles.sectionLabel}>{t('locations')}</div>
      <div className={styles.card}>
        {shown.length === 0 && <p className={styles.empty}>{a.no_places}</p>}
        {shown.map(l => {
          const i = locations.indexOf(l);
          return (
            <div key={l.key} className={styles.placeRow}>
              <button type="button" className={styles.row} aria-pressed={i === active} onClick={() => setActive(i)}>
                <span className="ms" aria-hidden="true" style={{ color: l.fromDevice ? 'var(--mint-text)' : undefined }}>{l.fromDevice ? 'my_location' : 'location_on'}</span>
                <span className={styles.grow}>
                  <span className={styles.placeName}>{l.fromDevice ? a.my_location : l.name}</span>
                  {l.detail && <span className={styles.placeDetail}>{l.detail}</span>}
                </span>
                {i === active && <span className={`ms ${styles.check}`} aria-hidden="true">check</span>}
              </button>
              {!l.fromDevice && (
                <button type="button" className={styles.iconBtn} aria-label={a.remove.replace('{name}', l.name)} onClick={() => void removePlace(l.key)}>
                  <span className="ms" aria-hidden="true">close</span>
                </button>
              )}
            </div>
          );
        })}
        {!hasDevice && (
          <button type="button" className={`${styles.row} ${styles.accent}`} disabled={loc === 'busy'} onClick={async () => { setLoc('busy'); setLoc(await locateMe()); }}>
            <span className="ms" aria-hidden="true">near_me</span><span className={styles.grow}>{loc === 'busy' ? m.onboard.loc_finding : a.use_location}</span>
          </button>
        )}
        {(loc === 'denied' || loc === 'unavailable') && <p className={styles.errLine} role="status">{loc === 'denied' ? `${a.loc_denied} ${a.loc_help}` : a.loc_unavailable}</p>}
        <button type="button" className={`${styles.row} ${styles.accent}`} aria-disabled={atPlusLimit}
          onClick={() => (canAddPlace ? setAddOpen(true) : plan === 'free' ? onLocked() : undefined)}>
          <span className="ms" aria-hidden="true">add_location_alt</span><span className={styles.grow}>{t('add_location')}</span>
          {!canAddPlace && plan === 'free' && <Lock />}
        </button>
        {atPlusLimit && <p className={styles.hint}>{a.limit_reached.replace('{n}', String(limits(plan).maxLocations))}</p>}
      </div>
      <AddPlaceSheet open={addOpen} onClose={() => setAddOpen(false)} onLimit={() => { setAddOpen(false); if (plan === 'free') onLocked(); }} />
    </>
  );
}

/** Place search (OpenStreetMap / Nominatim via /api/places). Searches when submitted, not while typing (usage policy). */
function AddPlaceSheet({ open, onClose, onLimit }: { open: boolean; onClose: () => void; onLimit: () => void }) {
  const { t, m, locale } = useT();
  const a = m.acct;
  const { addPlace } = useApp();
  const [q, setQ] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error' | 'rate' | 'saving' | 'save_error'>('idle');
  const [results, setResults] = useState<PlaceHit[]>([]);
  const [attribution, setAttribution] = useState('© OpenStreetMap contributors');
  const close = () => { onClose(); setState('idle'); setResults([]); setQ(''); };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim(); if (query.length < 2) return;
    setState('busy');
    try {
      const r = await fetch(`/api/places?q=${encodeURIComponent(query)}&lang=${locale}`);
      const j = (await r.json()) as { results?: PlaceHit[]; attribution?: string };
      if (j.attribution) setAttribution(j.attribution);
      if (r.status === 429) return setState('rate');
      if (!r.ok) return setState('error');
      setResults(j.results ?? []); setState('done');
    } catch { setState('error'); }
  };
  const pick = async (hit: PlaceHit) => {
    setState('saving');
    const res = await addPlace(hit);
    if (res === 'ok') close(); else if (res === 'limit') { close(); onLimit(); } else setState('save_error');
  };

  return (
    <Sheet open={open} onClose={close} title={t('add_location')}>
      <div className={styles.sheetBody}>
        <form className={styles.searchForm} onSubmit={search} role="search">
          <label htmlFor="place-q" className="sr-only">{a.search_ph}</label>
          <span className={`ms ${styles.searchIcon}`} aria-hidden="true">search</span>
          <input id="place-q" className={styles.searchInput} type="search" enterKeyHint="search" autoComplete="off" placeholder={a.search_ph}
            value={q} onChange={e => setQ(e.target.value)} maxLength={100} />
          <button type="submit" className={styles.searchBtn} disabled={q.trim().length < 2 || state === 'busy'}>{a.search}</button>
        </form>
        <div aria-live="polite">
          {state === 'busy' && <p className={styles.sheetP}>{a.searching}</p>}
          {state === 'error' && <p className={styles.errLine}>{a.search_error}</p>}
          {state === 'rate' && <p className={styles.errLine}>{a.rate_limited}</p>}
          {state === 'save_error' && <p className={styles.errLine}>{a.error}</p>}
          {state === 'done' && results.length === 0 && <p className={styles.sheetP}>{a.no_results}</p>}
        </div>
        {results.length > 0 && (
          <div className={styles.results}>
            {results.map(h => (
              <button key={`${h.name}|${h.detail}|${h.lat}`} type="button" className={styles.resultRow} disabled={state === 'saving'} onClick={() => void pick(h)}>
                <span className="ms" aria-hidden="true">location_on</span>
                <span className={styles.grow}><span className={styles.placeName}>{h.name}</span>{h.detail && <span className={styles.placeDetail}>{h.detail}</span>}</span>
                <span className="ms" aria-hidden="true">add</span>
              </button>
            ))}
          </div>
        )}
        <p className={styles.attrib}>{attribution}</p>
      </div>
    </Sheet>
  );
}

function Preferences() {
  const { t, m, locale } = useT();
  const { user, savePrefs } = useAccount();
  const theme = useTheme();
  const units = useUnits();
  const pickTheme = (th: ThemePref) => { setTheme(th); if (user) void savePrefs({ theme: th }); };
  return (
    <div className={styles.card}>
      <LanguagePicker>
        {open => (
          <button type="button" className={styles.row} onClick={open}>
            <span className="ms" aria-hidden="true">language</span><span className={styles.grow}>{t('language')}</span>
            <span className={styles.meta}>{LOCALES.find(l => l.code === locale)?.name}</span><span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
          </button>
        )}
      </LanguagePicker>
      <div className={styles.block}>
        <div className={styles.blockHead}><span className="ms" aria-hidden="true">contrast</span>{t('theme')}</div>
        <div className={styles.seg} role="radiogroup" aria-label={t('theme')}>
          {(['system', 'light', 'dark'] as ThemePref[]).map(th => (
            <button key={th} type="button" role="radio" aria-checked={theme === th} onClick={() => pickTheme(th)}>{t(`th_${th}`)}</button>
          ))}
        </div>
      </div>
      <div className={styles.block}>
        <div className={styles.blockHead}><span className="ms" aria-hidden="true">straighten</span>{t('units')}</div>
        <div className={styles.seg} role="radiogroup" aria-label={t('units')}>
          {(['km', 'mi'] as Units[]).map(x => (
            <button key={x} type="button" role="radio" aria-checked={units === x} onClick={() => setUnits(x)}>{t(x === 'km' ? 'units_km' : 'units_mi')}</button>
          ))}
        </div>
      </div>
      <FeltMapRow />
      <button type="button" className={styles.row} onClick={openOnboarding}>
        <span className="ms" aria-hidden="true">waving_hand</span><span className={styles.grow}>{m.acct.intro}</span><span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
      </button>
      <div className={styles.block}>
        <div className={styles.blockHead}><span className="ms" aria-hidden="true">database</span>{t('data_sources')}</div>
        <div className={styles.chips}>
          {SOURCES.map(s => <span key={s} className={styles.source}><span className="ms" aria-hidden="true">check</span>{s}</span>)}
        </div>
      </div>
    </div>
  );
}

/** Edit the display name (profiles.display_name: 1–50 characters, or empty to fall back to the email). */
function NameSheet({ onClose }: { onClose: () => void }) {
  const { m } = useT();
  const a = m.acct;
  const { profile, savePrefs } = useAccount();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = name.trim().replace(/\s+/g, ' ');
    setState('busy');
    if (await savePrefs({ display_name: v || null })) onClose(); else setState('error');
  };
  return (
    <Sheet open onClose={onClose} title={a.display_name}>
      <form className={styles.sheetBody} onSubmit={save}>
        <label htmlFor="display-name" className="sr-only">{a.display_name}</label>
        <input id="display-name" className={styles.textInput} value={name} onChange={e => setName(e.target.value)} maxLength={50}
          autoComplete="name" placeholder={a.display_name_ph} autoFocus />
        <p className={styles.hint}>{a.display_name_hint}</p>
        {state === 'error' && <p className={styles.errLine} role="alert">{a.error}</p>}
        <button type="submit" className={styles.primaryBtn} disabled={state === 'busy'}>{a.save}</button>
      </form>
    </Sheet>
  );
}

/** Automatic felt maps: share an approximate, anonymous position while the app is open (only with location allowed). */
function FeltMapRow() {
  const { m } = useT();
  const on = useFeltMapSharing();
  const [how, setHow] = useState(false);
  return (
    <>
      <button type="button" className={styles.row} role="switch" aria-checked={on} onClick={() => setFeltMapSharing(!on)}>
        <span className="ms" aria-hidden="true">sensors</span>
        <span className={styles.grow}>
          <span className={styles.placeName}>{m.feltmap.toggle}</span>
          <span className={styles.rowHint}>{m.feltmap.toggle_hint}</span>
        </span>
        <span className={styles.switch} aria-hidden="true"><span /></span>
      </button>
      <button type="button" className={`${styles.row} ${styles.accent}`} onClick={() => setHow(true)}>
        <span className="ms" aria-hidden="true">info</span><span className={styles.grow}>{m.feltmap.title}</span>
      </button>
      <FeltMapInfoSheet open={how} onClose={() => setHow(false)} />
    </>
  );
}

function DeleteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { m } = useT();
  const a = m.acct;
  const { accessToken, signOut } = useAccount();
  const [state, setState] = useState<'idle' | 'busy' | 'sub' | 'error'>('idle');
  const del = async () => {
    setState('busy');
    try {
      const r = await fetch('/api/account', { method: 'DELETE', headers: { authorization: `Bearer ${await accessToken()}` } });
      if (r.ok) { await signOut(); onClose(); setState('idle'); return; }
      setState(r.status === 409 ? 'sub' : 'error');
    } catch { setState('error'); }
  };
  return (
    <Sheet open={open} onClose={() => { onClose(); setState('idle'); }} title={a.delete_h}>
      <div className={styles.sheetBody}>
        <p className={styles.sheetP}>{a.delete_p}</p>
        {state === 'sub' && <p className={styles.errLine} role="alert">{a.delete_sub}</p>}
        {state === 'error' && <p className={styles.errLine} role="alert">{a.error}</p>}
        <button type="button" className={styles.dangerBtn} onClick={del} disabled={state === 'busy'}>{a.delete_confirm}</button>
        <button type="button" className={styles.secondaryBtn} onClick={onClose}>{a.cancel}</button>
      </div>
    </Sheet>
  );
}

function Lock() {
  return <span className={styles.lock}><span className="ms" aria-hidden="true">lock</span>sisma+</span>;
}
