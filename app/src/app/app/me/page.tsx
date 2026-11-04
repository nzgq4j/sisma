'use client';
// Me tab — the account dashboard. Spec: design/SismaApp.dc.html (isMe): profile row with sign-in, plan card
// (Free → paywall, sisma+ → plan and billing), Alerts (sisma+), Saved locations (limit via entitlements), Language,
// Appearance, data sources and the disclaimer. Desktop (>= 1024px): two columns — account on the left, settings right.
// Skeleton status: sign-in, profile, plan, alert settings, language and appearance are live; saved locations are
// device-only, push delivery (build step 9) and billing (step 8) are not wired yet.
import Link from 'next/link';
import { usePushDevice } from '@/components/PushDevice';
import { useAlertRules } from '@/components/alerts/useAlerts';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useT, LOCALES } from '@/i18n/I18nProvider';
import { useApp, type LocateResult } from '@/components/AppState';
import { useAccount } from '@/components/Account';
import { useNow } from '@/components/FeltReport';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Sheet, SheetOptions } from '@/components/Sheet';
import { setTheme, useTheme, type ThemePref } from '@/components/Theme';
import { setMarkerStyle, useMarkerStyle, type MarkerStyle } from '@/components/MarkerStyle';
import { PIN_FONT_PX, PIN_HEAD, PIN_PATH, PIN_TEXT_DY, dotRadius } from '@/lib/pin';
import { setUnits, useUnits, type Units } from '@/components/Units';
import { openOnboarding } from '@/components/onboarding/store';
import { FeltMapInfoSheet, setFeltMapSharing, useFeltMapSharing } from '@/components/FeltMap';
import { PRICES, limits } from '@/lib/entitlements';
import type { PlaceHit } from '@/lib/places';
import styles from './me.module.css';

const SOURCES = ['USGS', 'EMSC', 'GeoNet', 'JMA'];

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
        <AdminLink />
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
/** Alerts on Me: the master switch and a way into Me → Alerts (rules and history). sisma+ only; free accounts see a lock. */
function Alerts({ onLocked }: { onLocked: () => void }) {
  const { t, m } = useT();
  const k = m.rules;
  const { plan } = useApp();
  const { user } = useAccount();
  const push = usePushDevice();
  const a = useAlertRules();
  const plus = plan === 'plus' && !!user;
  const on = a.rules.filter(r => r.enabled).length;
  return (
    <>
      <div className={styles.sectionLabel}>{t('alerts')}</div>
      <div className={styles.card}>
        <button type="button" className={styles.row} role={plus ? 'switch' : undefined} aria-checked={plus ? a.enabled : undefined}
          onClick={() => {
            if (!plus) { onLocked(); return; }
            // Turning alerts on also asks this device for notification permission (it has to come from a tap).
            if (!a.enabled && push.state === 'off') void push.enable();
            void a.setEnabled(!a.enabled);
          }}>
          <span className="ms" aria-hidden="true">notifications_active</span>
          <span className={styles.grow}>{t('push')}</span>
          {plus ? <span className={styles.switch} aria-hidden="true"><span /></span> : <Lock />}
        </button>
        {plus && (
          <Link href="/app/me/alerts" className={styles.row}>
            <span className="ms" aria-hidden="true">tune</span><span className={styles.grow}>{k.manage}</span>
            <span className={styles.meta}>{a.loading ? '' : a.rules.length ? k.summary.replace('{on}', String(on)).replace('{total}', String(a.rules.length)) : k.none}</span>
            <span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
          </Link>
        )}
        {a.error && <p className={styles.errLine} role="alert">{m.acct.error}</p>}
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

/** Me → Administration, shown to administrators only (profiles.is_admin; the admin pages and API re-check it). */
function AdminLink() {
  const { m } = useT();
  const { user } = useAccount();
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) { void Promise.resolve().then(() => setAdmin(false)); return; }
    let alive = true;
    void sb.from('profiles').select('is_admin').eq('id', user.id).maybeSingle().then(({ data }) => { if (alive) setAdmin(data?.is_admin === true); });
    return () => { alive = false; };
  }, [user]);
  if (!admin) return null;
  return (
    <div className={styles.card}>
      <Link href="/app/me/admin" className={styles.row}>
        <span className="ms" aria-hidden="true">admin_panel_settings</span><span className={styles.grow}>{m.admin.title}</span>
        <span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
      </Link>
    </div>
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
      <MarkerRow />
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

/** Map markers (pins or circles) for the Map, Globe and dashboard, with a legend for the chosen style. */
function MarkerRow() {
  const { m, locale } = useT();
  const k = m.markers;
  const style = useMarkerStyle();
  const [open, setOpen] = useState(false);
  const f1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), one = (v: number) => f1.format(v);
  const bands = [
    { mag: 7.2, i: 0, label: k.band_top.replace('{a}', one(7)) },
    ...[6, 5, 4, 3].map((a, j) => ({ mag: a + 0.5, i: j + 1, label: k.band.replace('{a}', one(a)).replace('{b}', one(a + 0.9)) })),
    { mag: 2.5, i: 5, label: k.band_low.replace('{a}', one(3)) },
  ].reverse();
  return (
    <>
      <button type="button" className={styles.row} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="ms" aria-hidden="true">location_on</span><span className={styles.grow}>{k.title}</span>
        <span className={styles.meta}>{style === 'pins' ? k.pins : k.circles}</span><span className={`ms ${styles.chev}`} aria-hidden="true">chevron_right</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={k.title}>
        <SheetOptions value={style} onPick={v => setMarkerStyle(v)}
          options={(['pins', 'circles'] as const).map(v => ({
            value: v,
            lead: <MarkerSwatch style={v} mag={4.5} band={2} />,
            label: <span className={styles.optText}><strong>{v === 'pins' ? k.pins : k.circles}</strong><small>{v === 'pins' ? k.pins_d : k.circles_d}</small></span>,
          }))} />
        <div className={styles.pickerLabel}>{k.legend}</div>
        <ul className={styles.markerLegend}>
          {bands.map(b => <li key={b.i}><span className={styles.swatchBox}><MarkerSwatch style={style} mag={b.mag} band={b.i} /></span>{b.label}</li>)}
        </ul>
      </Sheet>
    </>
  );
}

/** A marker as drawn on the map: a numbered pin, or a circle sized by magnitude. */
function MarkerSwatch({ style, mag, band }: { style: MarkerStyle; mag: number; band: number }) {
  if (style === 'circles') {
    const r = dotRadius(mag), size = Math.ceil(r * 2 + 2);
    return <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden="true"><circle r={r} fill={`var(--mag-${band})`} fillOpacity={0.92} stroke="var(--surface)" strokeWidth={1} /></svg>;
  }
  return (
    <svg width={26} height={34} viewBox="-13 -31 26 34" aria-hidden="true">
      <path d={PIN_PATH} fill={`var(--mag-${band})`} stroke="var(--surface)" strokeWidth={1.5} strokeLinejoin="round" />
      <text y={-PIN_HEAD + PIN_TEXT_DY} textAnchor="middle" fontSize={PIN_FONT_PX} fontWeight={800} fill={`var(--mag-ink-${band})`}>{mag.toFixed(1)}</text>
    </svg>
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
