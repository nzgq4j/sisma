'use client';
// Account state for /app: Supabase session (passwordless email link, or Google when enabled in Supabase), the user's
// profile row and effective plan.
// Guest mode when Supabase isn't configured or nobody is signed in. Paid features are re-checked on the server
// (/api routes and public.effective_plan()); the plan here only drives the UI.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { enabledProviders, supabaseBrowser } from '@/lib/supabase-browser';
import { listenForOAuthReturn, startOAuth } from '@/lib/oauth';
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
  savePrefs: (p: Partial<Pick<Profile, 'display_name' | 'locale' | 'theme'>>) => Promise<boolean>;
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
      let prof = (data as Profile | null) ?? null;
      // First Google sign-in: start with the name from the Google profile (editable in Me → Account).
      const given = String(u.user_metadata?.full_name || u.user_metadata?.name || '').trim().replace(/\s+/g, ' ').slice(0, 50).trim();
      if (prof && !prof.display_name && given && u.app_metadata?.provider !== 'email') {
        const { error } = await sb.from('profiles').update({ display_name: given }).eq('id', u.id);
        if (!error) prof = { ...prof, display_name: given };
      }
      if (alive) { setProfile(prof); setReady(true); }
    };
    sb.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => { void load(session?.user ?? null); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [sb]);

  // Android app: finish a Google sign-in that returned from the phone's browser.
  useEffect(() => listenForOAuthReturn(), []);

  // Keep the language used for auth emails ({{ .Data.locale }}) and the profile in step with the app language.
  useEffect(() => {
    if (!sb || !user) return;
    if (user.user_metadata?.locale !== locale) void sb.auth.updateUser({ data: { locale } });
    if (profile && profile.locale !== locale) {
      void sb.from('profiles').update({ locale }).eq('id', user.id).then(({ error }) => { if (!error) setProfile(p => (p ? { ...p, locale } : p)); });
    }
  }, [sb, user, profile, locale]);

  const savePrefs = useCallback<AccountCtx['savePrefs']>(async prefs => {
    if (!sb || !user) return false;
    const { error } = await sb.from('profiles').update(prefs).eq('id', user.id);
    if (!error) setProfile(p => (p ? { ...p, ...prefs } : p));
    return !error;
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
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error' | 'oauth' | 'oauth_error'>('idle');
  const [providers, setProviders] = useState<string[]>([]);
  useEffect(() => { if (open) void enabledProviders().then(setProviders); }, [open]);
  const close = () => { onClose(); if (state !== 'sending') setState('idle'); };
  const google = async () => {
    if (!sb) return;
    setState('oauth');
    try { await startOAuth(sb, 'google'); } catch { setState('oauth_error'); }
  };
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
              {providers.includes('google') && (
                <>
                  <button type="button" className={styles.google} onClick={google} disabled={state === 'oauth'}>
                    <GoogleMark />{m.acct.continue_google}
                  </button>
                  {state === 'oauth_error' && <p className={styles.err} role="alert">{m.acct.oauth_error}</p>}
                  <div className={styles.or} aria-hidden="true"><span>{m.acct.or_email}</span></div>
                </>
              )}
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

/** Google's "G" mark, in Google's brand colours (required as-is by Google's sign-in branding guidelines). */
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" style={{ flex: 'none' }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
