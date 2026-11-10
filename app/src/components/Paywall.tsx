'use client';
// sisma+ paywall sheet (design: sheetPaywall). Opened through useApp().setSheet('paywall') from anywhere in /app.
// - Starting needs an account: guests sign in first and the chosen plan carries on afterwards (lib/pending-upgrade.ts;
//   also through the sign-up confirmation link, ?upgrade=<plan>).
// - Website: Stripe Checkout (/api/stripe/checkout re-checks the session and the account's subscriptions; answers 501
//   until Stripe is configured). Android app: Google Play Billing (lib/play-client.ts → /api/play/verify), with
//   "Restore purchase"; an app version without the billing plugin asks for an update instead of selling on the web.
// - The free trial is offered to accounts that have never subscribed (lib/billing.ts); others see "Subscribe".
// - Back from Stripe (/app/me?upgraded=1): the plan is written by the webhook, so we wait for it (ActivationSheet).
import { useEffect, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { PRICES, TRIAL_DAYS, type Billing } from '@/lib/entitlements';
import { trialEligible } from '@/lib/billing';
import { clearPendingUpgrade, setPendingUpgrade, takePendingUpgrade } from '@/lib/pending-upgrade';
import { buyWithPlay, inApp, playBillingReady, playPrices, restorePlay, type PlayResult } from '@/lib/play-client';
import { useApp } from './AppState';
import { useAccount } from './Account';
import { Sheet } from './Sheet';
import styles from './paywall.module.css';

const ICONS = ['notifications_active', 'bookmark_added', 'history', 'tune'];
type State = 'idle' | 'busy' | 'soon' | 'error' | 'already' | 'restore_none' | 'other_account' | 'unavailable';

export function PaywallSheet() {
  const { t, m } = useT();
  const b = m.billing;
  const { sheet, setSheet } = useApp();
  const { user, profile, plan, openSignIn, accessToken, refreshProfile } = useAccount();
  const [billing, setBilling] = useState<Billing>('yearly');
  const [state, setState] = useState<State>('idle');
  const [done, setDone] = useState(false);
  // Android app: null until checked; false when this app version or device cannot use Google Play billing.
  const app = typeof window !== 'undefined' && inApp();
  const [play, setPlay] = useState<boolean | null>(null);
  const [localPrices, setLocalPrices] = useState<Partial<Record<Billing, string>>>({});
  const close = () => { setSheet(null); setState('idle'); };
  const usd = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
  const trial = !user || trialEligible(profile);

  useEffect(() => {
    if (!app || sheet !== 'paywall' || play !== null) return;
    void playBillingReady().then(async ok => { setPlay(ok); if (ok) setLocalPrices(await playPrices()); });
  }, [app, sheet, play]);

  const afterPlay = async (r: PlayResult) => {
    if (r === 'ok') { await refreshProfile(); setState('idle'); setSheet(null); setDone(true); return; }
    setState(r === 'cancelled' ? 'idle' : r === 'none' ? 'restore_none' : r === 'mismatch' ? 'other_account' : r === 'unavailable' ? 'unavailable' : 'error');
  };

  const checkout = async (choice: Billing) => {
    setState('busy');
    try {
      const token = await accessToken();
      if (!token || !user) return setState('error');
      if (app) return afterPlay(await buyWithPlay(choice, user.id, token));
      const r = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ billing: choice }) });
      if (r.status === 501) return setState('soon');
      if (r.status === 409) { await refreshProfile(); return setState('already'); }
      const j = (await r.json()) as { url?: string };
      if (j.url) location.href = j.url; else setState('error');
    } catch { setState('error'); }
  };
  const start = () => {
    if (user) { void checkout(billing); return; }
    setPendingUpgrade(billing);
    close();
    openSignIn({ upgrade: true, onCancel: clearPendingUpgrade });
  };
  const restore = async () => {
    setState('busy');
    const token = await accessToken();
    if (!token || !user) return setState('error');
    await afterPlay(await restorePlay(user.id, token));
  };

  // The plan chosen before signing up can arrive in the confirmation link (another browser): keep it for below.
  useEffect(() => {
    const url = new URL(location.href), up = url.searchParams.get('upgrade');
    // 'monthly' links from before sisma+ became yearly only continue as yearly.
    if (up !== 'monthly' && up !== 'yearly') return;
    setPendingUpgrade('yearly');
    url.searchParams.delete('upgrade');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }, []);

  // Signed in (and the profile loaded) with an upgrade waiting: reopen the sheet on that plan and go on to checkout,
  // unless the account already has sisma+.
  useEffect(() => {
    if (!user || !profile) return;
    const pending = takePendingUpgrade();
    if (!pending || plan === 'plus') return;
    void Promise.resolve().then(() => { setBilling(pending); setSheet('paywall'); return checkout(pending); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the signed-in profile arrives
  }, [user, profile, plan]);

  const blocked = app && play === false;
  const label = !user ? `${t('sign_in')} · ${t('trial', { n: TRIAL_DAYS })}` : trial ? t('trial', { n: TRIAL_DAYS }) : b.subscribe;
  const msg: Partial<Record<State, string>> = {
    soon: m.acct.billing_soon, error: m.acct.error, unavailable: b.play_not_ready, already: b.already, restore_none: b.restore_none, other_account: b.other_account,
  };

  return (
    <>
      <Sheet open={sheet === 'paywall'} onClose={close} label="sisma+">
        <div className={styles.wrap}>
          <div>
            <div className={styles.brand}>sisma+</div>
            <div className={styles.sub}>{t('everything_free')}</div>
          </div>
          <ul className={styles.ents}>
            {m.ent_plus.map((e, i) => (
              <li key={i}><span className={styles.tick}><span className="ms" aria-hidden="true">{ICONS[i] ?? 'check'}</span></span><span>{e}</span></li>
            ))}
          </ul>
          <div className={styles.prices} role="radiogroup">
            {(['yearly'] as Billing[]).map(x => (
              <button key={x} type="button" role="radio" aria-checked={billing === x} className={styles.price} onClick={() => setBilling(x)}>
                <span className={styles.radio} aria-hidden="true"><span /></span>
                <span className={styles.priceText}><strong>{t(x)}</strong><span>{t('per_year')}</span></span>
                <span className={styles.amount}>{localPrices[x] ?? usd(PRICES[x].usd)}</span>
              </button>
            ))}
          </div>
          {blocked
            ? <p className={styles.msg} role="status">{play === false && !hasPlugin() ? b.app_update : b.play_unavailable}</p>
            : <button type="button" className={styles.cta} onClick={start} disabled={state === 'busy' || (app && play === null)}>{label}</button>}
          {msg[state] && <p className={styles.msg} role={state === 'error' ? 'alert' : 'status'}>{msg[state]}</p>}
          {app && play && user && (
            <button type="button" className={styles.link} onClick={() => void restore()} disabled={state === 'busy'}>{b.restore}</button>
          )}
          <p className={styles.fine}>{app ? b.play_fine : trial ? t('cancel_any') : b.cancel_any_paid}</p>
        </div>
      </Sheet>
      <ActivationSheet done={done} onDone={() => setDone(false)} />
    </>
  );
}

const hasPlugin = () => !!(window as { Capacitor?: { Plugins?: { NativePurchases?: unknown } } }).Capacitor?.Plugins?.NativePurchases;

/**
 * After paying: Google Play purchases are recorded before the sheet closes (`done`); Stripe brings the person back to
 * /app/me?upgraded=1 while its webhook writes the plan, so the profile is read again every 2 s for up to 30 s.
 */
function ActivationSheet({ done, onDone }: { done: boolean; onDone: () => void }) {
  const { m } = useT();
  const b = m.billing;
  const { ready, user, plan, refreshProfile } = useAccount();
  const [phase, setPhase] = useState<null | 'wait' | 'slow' | 'done'>(null);

  useEffect(() => {
    const url = new URL(location.href);
    if (url.searchParams.get('upgraded') !== '1' || !ready || !user) return;
    url.searchParams.delete('upgraded');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    let tries = 0, stop = false;
    const tick = async () => {
      if (stop) return;
      const p = await refreshProfile();
      if (stop) return;
      const live = p && p.plan === 'plus' && ['trialing', 'active', 'past_due'].includes(p.subscription_status ?? '');
      if (live) { setPhase('done'); return; }
      if (++tries >= 15) { setPhase('slow'); return; }
      setTimeout(() => void tick(), 2000);
    };
    void Promise.resolve().then(() => { setPhase('wait'); return tick(); });
    return () => { stop = true; };
  }, [ready, user, refreshProfile]);

  // Shown while waiting, when it took too long, and once sisma+ is on (after either store).
  const welcome = (done && plan === 'plus') || phase === 'done';
  const open = welcome || phase === 'wait' || phase === 'slow';
  const close = () => { setPhase(null); onDone(); };
  const [h, p] = welcome ? [b.done_h, b.done_p] : phase === 'slow' ? [b.slow_h, b.slow_p] : [b.activating_h, b.activating_p];
  return (
    <Sheet open={open} onClose={close} label={h}>
      <div className={styles.wrap} role="status" aria-live="polite">
        <div className={styles.brand}>{welcome ? 'sisma+' : <span className="ms" aria-hidden="true">{phase === 'slow' ? 'schedule' : 'hourglass_top'}</span>}</div>
        <div><strong>{h}</strong><p className={styles.fine}>{p}</p></div>
        {(welcome || phase === 'slow') && <button type="button" className={styles.cta} onClick={close}>{b.ok}</button>}
      </div>
    </Sheet>
  );
}
