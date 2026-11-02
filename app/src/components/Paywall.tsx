'use client';
// sisma+ paywall sheet (design: sheetPaywall). Opened through useApp().setSheet('paywall') from anywhere in /app.
// Starting the trial needs an account: guests are sent to sign-in first. Checkout is created server-side
// (/api/stripe/checkout re-checks the session); until Stripe is configured the route answers 501 and we say so.
import { useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { PRICES, type Billing } from '@/lib/entitlements';
import { useApp } from './AppState';
import { useAccount } from './Account';
import { Sheet } from './Sheet';
import styles from './paywall.module.css';

const ICONS = ['notifications_active', 'bookmark_added', 'history', 'tune'];
const SAVE = Math.round((1 - PRICES.yearly.usd / (PRICES.monthly.usd * 12)) * 100);

export function PaywallSheet() {
  const { t, m } = useT();
  const { sheet, setSheet } = useApp();
  const { user, openSignIn, accessToken } = useAccount();
  const [billing, setBilling] = useState<Billing>('yearly');
  const [state, setState] = useState<'idle' | 'busy' | 'soon' | 'error'>('idle');
  const close = () => { setSheet(null); setState('idle'); };
  const usd = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);

  const start = async () => {
    if (!user) { close(); openSignIn(); return; }
    setState('busy');
    try {
      const token = await accessToken();
      const r = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ billing }) });
      if (r.status === 501) return setState('soon');
      const j = (await r.json()) as { url?: string };
      if (j.url) location.href = j.url; else setState('error');
    } catch { setState('error'); }
  };

  return (
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
          {(['yearly', 'monthly'] as Billing[]).map(b => (
            <button key={b} type="button" role="radio" aria-checked={billing === b} className={styles.price} onClick={() => setBilling(b)}>
              <span className={styles.radio} aria-hidden="true"><span /></span>
              <span className={styles.priceText}><strong>{t(b)}</strong><span>{t(b === 'yearly' ? 'per_year' : 'per_month')}</span></span>
              {b === 'yearly' && <span className={styles.badge}>{t('save', { n: SAVE })}</span>}
              <span className={styles.amount}>{usd(PRICES[b].usd)}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.cta} onClick={start} disabled={state === 'busy'}>{user ? t('trial') : `${t('sign_in')} · ${t('trial')}`}</button>
        {state === 'soon' && <p className={styles.msg} role="status">{m.acct.billing_soon}</p>}
        {state === 'error' && <p className={styles.msg} role="alert">{m.acct.error}</p>}
        <p className={styles.fine}>{t('cancel_any')}</p>
      </div>
    </Sheet>
  );
}
