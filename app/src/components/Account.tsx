'use client';
// Account state for /app: Supabase session (passwordless email link), the user's profile row and effective plan.
// Guest mode when Supabase isn't configured or nobody is signed in. Paid features are re-checked on the server
// (/api routes and public.effective_plan()); the plan here only drives the UI.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { effectivePlan, type Billing, type Plan } from '@/lib/entitlements';
import { useT } from '@/i18n/I18nProvider';
import { Sheet } from './Sheet';
import styles from './account.module.css';

export interface Profile {
  display_name: string | null; locale: string; theme: 'system' | 'light' | 'dark'; plan: Plan;
  billing_interval: Billing | null; subscription_status: string | null; trial_ends_at: string | null; current_period_end: string | null;
}
interface AccountCtx {
  configured: boolean; ready: boolean; user: User | null; profile: Profile | null; plan: Plan;
  /** Updates the user's own preference columns (display_name, locale, theme are the only ones RLS allows). */
  savePrefs: (p: Partial<Pick<Profile, 'display_name' | 'locale' | 'theme'>>) => Promise<void>;
  accessToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
  openSignIn: () => void;
}
const Ctx = createContext<AccountCtx | null>(null);
const PROFILE_COLS = 'display_name, locale, theme, plan, billing_interval, subscription_status, trial_ends_at, current_period_end';

export function AccountProvider({ children }: { children: ReactNode }) {
  const sb = supabaseBrowser();
  const { locale } = useT();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(!sb);
  const [signIn, setSignIn] = useState(false);

  useEffect(() => {
    if (!sb) return;
    let alive = true;
    const load = async (u: User | null) => {
      if (!alive) return;
      setUser(u);
      if (!u) { setProfile(null); setReady(true); return; }
      const { data } = await sb.from('profiles').select(PROFILE_COLS).eq('id', u.id).maybeSingle();
      if (alive) { setProfile((data as Profile | null) ?? null); setReady(true); }
    };
    sb.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => { void load(session?.user ?? null); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [sb]);

  // Keep the language used for auth emails ({{ .Data.locale }}) and the profile in step with the app language.
  useEffect(() => {
    if (!sb || !user) return;
    if (user.user_metadata?.locale !== locale) void sb.auth.updateUser({ data: { locale } });
    if (profile && profile.locale !== locale) {
      void sb.from('profiles').update({ locale }).eq('id', user.id).then(({ error }) => { if (!error) setProfile(p => (p ? { ...p, locale } : p)); });
    }
  }, [sb, user, profile, locale]);

  const savePrefs = useCallback<AccountCtx['savePrefs']>(async prefs => {
    if (!sb || !user) return;
    const { error } = await sb.from('profiles').update(prefs).eq('id', user.id);
    if (!error) setProfile(p => (p ? { ...p, ...prefs } : p));
  }, [sb, user]);

  const value = useMemo<AccountCtx>(() => ({
    configured: !!sb, ready, user, profile,
    plan: effectivePlan(profile ? { plan: profile.plan, subscription_status: profile.subscription_status, trial_ends_at: profile.trial_ends_at } : null),
    savePrefs,
    accessToken: async () => (sb ? (await sb.auth.getSession()).data.session?.access_token ?? null : null),
    signOut: async () => { await sb?.auth.signOut(); },
    openSignIn: () => setSignIn(true),
  }), [sb, ready, user, profile, savePrefs]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <SignInSheet open={signIn} onClose={() => setSignIn(false)} />
    </Ctx.Provider>
  );
}

export const useAccount = () => { const v = useContext(Ctx); if (!v) throw new Error('useAccount outside AccountProvider'); return v; };

/** Email-link sign-in (no password). New addresses get the "Confirm sign up" email, existing ones the magic link. */
function SignInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, m, locale } = useT();
  const sb = supabaseBrowser();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const close = () => { onClose(); if (state !== 'sending') setState('idle'); };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    setState('sending');
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${location.origin}/app/me`, data: { locale } } });
    setState(error ? 'error' : 'sent');
  };
  return (
    <Sheet open={open} onClose={close} title={t('sign_in')}>
      <div className={styles.signIn}>
        {!sb ? <p className={styles.note}>{m.acct.unavailable}</p>
          : state === 'sent' ? (
            <>
              <span className={`ms ${styles.bigIcon}`} aria-hidden="true">mark_email_read</span>
              <h3 className={styles.h}>{m.acct.sent_h}</h3>
              <p className={styles.p}>{m.acct.sent_p.replace('{email}', email.trim())}</p>
              <button type="button" className={styles.linkBtn} onClick={() => setState('idle')}>{m.acct.other_email}</button>
            </>
          ) : (
            <form onSubmit={send} className={styles.form}>
              <p className={styles.p}>{m.acct.sign_in_p}</p>
              <label className={styles.label} htmlFor="sisma-email">{m.acct.email}</label>
              <input id="sisma-email" className={styles.input} type="email" inputMode="email" autoComplete="email" required
                placeholder={m.acct.email_ph} value={email} onChange={e => setEmail(e.target.value)} />
              {state === 'error' && <p className={styles.err} role="alert">{m.acct.error}</p>}
              <button type="submit" className={styles.primary} disabled={state === 'sending'}>{m.acct.send_link}</button>
            </form>
          )}
      </div>
    </Sheet>
  );
}
