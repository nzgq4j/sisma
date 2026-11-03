'use client';
// Me → Subscription: the sisma+ plan, its status (trial, active, cancelling, payment problem), price and next date,
// and where to manage it: Stripe's customer portal for website subscriptions (POST /api/stripe/portal; switch
// monthly / yearly, card, invoices, cancel), Google Play for subscriptions bought in the Android app, or the paywall
// to choose a plan (free plan, or a trial without a payment method).
import Link from 'next/link';
import { useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useAccount } from '@/components/Account';
import { useNow } from '@/components/FeltReport';
import { PRICES } from '@/lib/entitlements';
import styles from '../me.module.css';
import sub from './subscription.module.css';

const PLAY_SUBSCRIPTIONS = 'https://play.google.com/store/account/subscriptions?package=io.sisma.app';

export default function SubscriptionPage() {
  const { t, m, locale } = useT();
  const s = m.sub;
  const { plan, setSheet } = useApp();
  const { user, profile, accessToken, openSignIn } = useAccount();
  const now = useNow();
  const [state, setState] = useState<'idle' | 'busy' | 'error' | 'soon'>('idle');

  const date = (iso: string | null | undefined) => (iso ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso)) : null);
  const usd = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(n);

  const openPortal = async () => {
    setState('busy');
    try {
      const r = await fetch('/api/stripe/portal', { method: 'POST', headers: { authorization: `Bearer ${await accessToken()}` } });
      if (r.status === 501) return setState('soon');
      const j = (await r.json()) as { url?: string };
      if (j.url) location.href = j.url; else setState('error');
    } catch { setState('error'); }
  };

  const back = (
    <Link href="/app/me" className={sub.back}><span className="ms" aria-hidden="true">arrow_back</span>{s.back}</Link>
  );

  // Free plan (or signed out): what sisma+ adds and the way to the plans.
  if (plan !== 'plus' || !profile) {
    return (
      <div className={styles.page}>
        {back}
        <h1 className={sub.h1}>{s.title}</h1>
        <div className={styles.planFree}>
          <div className={styles.planTop}><span>{t('current')}</span><span className={styles.planBadge}>{t('plan_free')}</span></div>
          <div className={styles.planH}>{s.free_h}</div>
          <div className={styles.planP}>{m.ent_plus.join(' · ')}</div>
          <button type="button" className={styles.planBtn} onClick={() => (user ? setSheet('paywall') : openSignIn())}>{s.see_plans}</button>
        </div>
      </div>
    );
  }

  const status = profile.subscription_status;
  const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at).getTime() : 0;
  const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / 86_400_000));
  const onTrial = status === 'trialing' || (!status && trialEnd > now);
  const interval = profile.billing_interval ?? 'monthly';
  const stripe = !!profile.stripe_customer_id;
  // A subscription that is live but not from Stripe was bought through Google Play (the Android app).
  const play = !stripe && !!status && status !== 'trialing';

  const statusText = onTrial ? s.st_trial.replace('{n}', String(daysLeft))
    : status === 'past_due' ? s.st_past_due
    : profile.cancel_at_period_end ? s.st_canceling.replace('{date}', date(profile.current_period_end) ?? '—')
    : s.st_active;
  const [dateLabel, dateValue] = onTrial ? [s.trial_ends, date(profile.trial_ends_at)]
    : profile.cancel_at_period_end ? [s.ends, date(profile.current_period_end)]
    : [s.renews, date(profile.current_period_end)];

  return (
    <div className={styles.page}>
      {back}
      <h1 className={sub.h1}>{s.title}</h1>
      <div className={styles.planPlus}>
        <div className={styles.planTop}><span>{t('current')}</span><span>{statusText}</span></div>
        <div className={styles.planH}>sisma+</div>
        {(stripe || play) && <div className={styles.planSub}>{usd(PRICES[interval].usd)} {t(interval === 'yearly' ? 'per_year' : 'per_month')}</div>}
      </div>

      <div className={styles.card}>
        <div className={styles.row}><span className="ms" aria-hidden="true">verified</span><span className={styles.grow}>{s.status}</span><span className={styles.meta}>{!onTrial && status !== 'past_due' && profile.cancel_at_period_end ? s.st_cancelled : statusText}</span></div>
        {(stripe || play) && (
          <div className={styles.row}><span className="ms" aria-hidden="true">event_repeat</span><span className={styles.grow}>{s.plan}</span><span className={styles.meta}>{t(interval)}</span></div>
        )}
        {dateValue && (
          <div className={styles.row}><span className="ms" aria-hidden="true">event</span><span className={styles.grow}>{dateLabel}</span><span className={styles.meta}>{dateValue}</span></div>
        )}
      </div>

      {status === 'past_due' && <p className={sub.warn} role="status">{s.past_due_hint}</p>}

      {stripe ? (
        <div className={sub.action}>
          <button type="button" className={sub.primary} onClick={() => void openPortal()} disabled={state === 'busy'}>
            <span className="ms" aria-hidden="true">credit_card</span>{s.billing}<span className="ms" aria-hidden="true">open_in_new</span>
          </button>
          <p className={styles.hint}>{s.billing_hint}</p>
        </div>
      ) : play ? (
        <div className={sub.action}>
          <a className={sub.primary} href={PLAY_SUBSCRIPTIONS} target="_blank" rel="noopener noreferrer">
            <span className="ms" aria-hidden="true">shop</span>{s.play}<span className="ms" aria-hidden="true">open_in_new</span>
          </a>
          <p className={styles.hint}>{s.play_hint}</p>
        </div>
      ) : (
        <div className={sub.action}>
          <button type="button" className={sub.primary} onClick={() => setSheet('paywall')}>
            <span className="ms" aria-hidden="true">workspace_premium</span>{s.choose}
          </button>
          {onTrial && <p className={styles.hint}>{s.trial_hint.replace('{date}', date(profile.trial_ends_at) ?? '—')}</p>}
        </div>
      )}
      {state === 'error' && <p className={styles.errLine} role="alert">{s.err}</p>}
      {state === 'soon' && <p className={styles.hint} role="status">{s.soon}</p>}
    </div>
  );
}
