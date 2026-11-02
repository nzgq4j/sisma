'use client';
// Me tab — the account dashboard. Spec: design/SismaApp.dc.html (isMe): profile row with sign-in, plan card
// (Free → paywall, sisma+ → plan and billing), Alerts (sisma+), Saved locations (limit via entitlements), Language,
// Appearance, data sources and the disclaimer. Desktop (>= 1024px): two columns — account on the left, settings right.
// Skeleton status: sign-in, profile, plan, alert settings, language and appearance are live; saved locations are
// device-only, push delivery (build step 9) and billing (step 8) are not wired yet.
import { useEffect, useState } from 'react';
import { useT, LOCALES } from '@/i18n/I18nProvider';
import { useApp, type LocateResult } from '@/components/AppState';
import { useAccount } from '@/components/Account';
import { useNow } from '@/components/FeltReport';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Sheet } from '@/components/Sheet';
import { setTheme, useTheme, type ThemePref } from '@/components/Theme';
import { openOnboarding } from '@/components/onboarding/store';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { PRICES, limits } from '@/lib/entitlements';
import styles from './me.module.css';

const RADII = [100, 250, 500, 1000, 0];
const SOURCES = ['USGS', 'EMSC', 'GeoNet', 'JMA'];

export default function MePage() {
  const { t, m } = useT();
  const a = m.acct;
  const { setSheet } = useApp();
  const acct = useAccount();
  const [delOpen, setDelOpen] = useState(false);
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
          {!acct.user && acct.ready && <button type="button" className={styles.pillBtn} onClick={acct.openSignIn}>{t('sign_in')}</button>}
        </div>

        <PlanCard onUpgrade={() => setSheet('paywall')} />

        {acct.user && (
          <>
            <div className={styles.sectionLabel}>{a.account}</div>
            <div className={styles.card}>
              <div className={styles.row}><span className="ms" aria-hidden="true">mail</span><span className={styles.grow}>{a.email}</span><span className={styles.meta}>{acct.user.email}</span></div>
              <button type="button" className={styles.row} onClick={() => void acct.signOut()}><span className="ms" aria-hidden="true">logout</span><span className={styles.grow}>{a.sign_out}</span></button>
              <button type="button" className={`${styles.row} ${styles.dangerRow}`} onClick={() => setDelOpen(true)}><span className="ms" aria-hidden="true">delete</span><span className={styles.grow}>{a.delete}</span></button>
            </div>
          </>
        )}
        <p className={`${styles.disclaimer} ${styles.desktopOnly}`}>{m.web.footer}</p>
      </div>

      <div className={styles.col}>
        <Alerts onLocked={() => setSheet('paywall')} />
        <Locations onLocked={() => setSheet('paywall')} />
        <Preferences />
        <p className={`${styles.disclaimer} ${styles.phoneOnly}`}>{m.web.footer}</p>
      </div>

      <DeleteSheet open={delOpen} onClose={() => setDelOpen(false)} />
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
    </div>
  );
}

function Alerts({ onLocked }: { onLocked: () => void }) {
  const { t, m, nf } = useT();
  const { plan } = useApp();
  const { user } = useAccount();
  const [s, setS] = useState({ enabled: false, min_magnitude: 5, radius_km: 500 });
  const [saveError, setSaveError] = useState(false);

  // Load the saved settings (RLS: own row only).
  useEffect(() => {
    const sb = supabaseBrowser(); if (!sb || !user) return;
    let alive = true;
    sb.from('alert_settings').select('enabled, min_magnitude, radius_km').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (alive && data) setS({ enabled: data.enabled, min_magnitude: Number(data.min_magnitude), radius_km: data.radius_km }); });
    return () => { alive = false; };
  }, [user]);

  const update = (patch: Partial<typeof s>) => {
    const nextS = { ...s, ...patch }; setS(nextS); setSaveError(false);
    const sb = supabaseBrowser(); if (!sb || !user) return;
    // The DB trigger refuses enabled = true without sisma+, so the server is the gate, not this toggle.
    void sb.from('alert_settings').upsert({ user_id: user.id, ...nextS, updated_at: new Date().toISOString() }).then(({ error }) => { if (error) setSaveError(true); });
  };

  return (
    <>
      <div className={styles.sectionLabel}>{t('alerts')}</div>
      <div className={styles.card}>
        <button type="button" className={styles.row} role={plan === 'plus' ? 'switch' : undefined} aria-checked={plan === 'plus' ? s.enabled : undefined}
          onClick={() => (plan === 'plus' ? update({ enabled: !s.enabled }) : onLocked())}>
          <span className="ms" aria-hidden="true">notifications_active</span>
          <span className={styles.grow}>{t('push')}</span>
          {plan === 'plus' ? <span className={styles.switch} aria-hidden="true"><span /></span> : <Lock />}
        </button>
        {plan === 'plus' && s.enabled && (
          <div className={styles.alertBody}>
            <label className={styles.rangeHead} htmlFor="alert-mag"><span>{t('alert_mag')}</span><strong>M{nf.format(s.min_magnitude)}+</strong></label>
            <input id="alert-mag" type="range" min={3} max={7} step={0.5} value={s.min_magnitude} className={styles.range}
              onChange={e => update({ min_magnitude: Number(e.target.value) })} />
            <div className={styles.rangeHead}><span>{t('alert_radius')}</span></div>
            <div className={styles.chips}>
              {RADII.map(r => (
                <button key={r} type="button" className={styles.chip} aria-pressed={s.radius_km === r} onClick={() => update({ radius_km: r })}>
                  {r ? `${nf.format(r)} km` : m.acct.anywhere}
                </button>
              ))}
            </div>
            <p className={styles.hint}>{m.acct.alerts_soon}</p>
          </div>
        )}
        {saveError && <p className={styles.errLine} role="alert">{m.acct.error}</p>}
      </div>
    </>
  );
}

function Locations({ onLocked }: { onLocked: () => void }) {
  const { t, m } = useT();
  const { plan, locations, active, setActive, locateMe } = useApp();
  const [loc, setLoc] = useState<LocateResult | 'busy' | null>(null);
  const hasDevice = locations.some(l => l.fromDevice);
  const locked = locations.length >= limits(plan).maxLocations;
  const [addOpen, setAddOpen] = useState(false);
  return (
    <>
      <div className={styles.sectionLabel}>{t('locations')}</div>
      <div className={styles.card}>
        {locations.map((l, i) => (
          <button key={`${l.name}-${i}`} type="button" className={styles.row} aria-pressed={i === active} onClick={() => setActive(i)}>
            <span className="ms" aria-hidden="true" style={{ color: l.fromDevice ? 'var(--mint-text)' : undefined }}>{l.fromDevice ? 'my_location' : 'location_on'}</span>
            <span className={styles.grow}>{l.fromDevice ? m.acct.my_location : l.name}</span>
            {i === active && <span className={`ms ${styles.check}`} aria-hidden="true">check</span>}
          </button>
        ))}
        {!hasDevice && (
          <button type="button" className={`${styles.row} ${styles.accent}`} disabled={loc === 'busy'} onClick={async () => { setLoc('busy'); setLoc(await locateMe()); }}>
            <span className="ms" aria-hidden="true">near_me</span><span className={styles.grow}>{m.acct.use_location}</span>
          </button>
        )}
        {(loc === 'denied' || loc === 'unavailable') && <p className={styles.errLine} role="status">{loc === 'denied' ? m.acct.loc_denied : m.acct.loc_unavailable}</p>}
        <button type="button" className={`${styles.row} ${styles.accent}`} onClick={() => (locked ? onLocked() : setAddOpen(true))}>
          <span className="ms" aria-hidden="true">add_location_alt</span><span className={styles.grow}>{t('add_location')}</span>
          {locked && <Lock />}
        </button>
      </div>
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={t('add_location')}>
        <p className={styles.sheetP}>{m.acct.search_soon}</p>
      </Sheet>
    </>
  );
}

function Preferences() {
  const { t, m, locale } = useT();
  const { user, savePrefs } = useAccount();
  const theme = useTheme();
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
