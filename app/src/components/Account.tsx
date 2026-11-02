'use client';
// Account state for /app: Supabase session (emailed link, email + password, or Google when enabled in Supabase), the user's
// profile row and effective plan.
// Guest mode when Supabase isn't configured or nobody is signed in. Paid features are re-checked on the server
// (/api routes and public.effective_plan()); the plan here only drives the UI.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  /** Set or change the account password (also opened by the password-reset email link). */
  openPassword: () => void;
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
  const [pwOpen, setPwOpen] = useState(false);
  const localeSynced = useRef('');

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
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      void load(session?.user ?? null);
      // Arrived from the "Reset your password" email: ask for the new password straight away.
      if (event === 'PASSWORD_RECOVERY') setPwOpen(true);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [sb]);

  // Android app: finish a Google sign-in that returned from the phone's browser.
  useEffect(() => listenForOAuthReturn(), []);

  // Keep the language used for auth emails ({{ .Data.locale }}) and the profile in step with the app language.
  useEffect(() => {
    if (!sb || !user) return;
    // Once per account + language: updateUser fires USER_UPDATED, which reloads `user` and re-runs this effect.
    const key = `${user.id}:${locale}`;
    if (user.user_metadata?.locale !== locale && localeSynced.current !== key) { localeSynced.current = key; void sb.auth.updateUser({ data: { locale } }); }
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
    openPassword: () => setPwOpen(true),
  }), [sb, ready, user, profile, savePrefs]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <SignInSheet open={signIn} onClose={() => setSignIn(false)} />
      {pwOpen && <PasswordSheet onClose={() => setPwOpen(false)} />}
    </Ctx.Provider>
  );
}

export const useAccount = () => { const v = useContext(Ctx); if (!v) throw new Error('useAccount outside AccountProvider'); return v; };

type Mode = 'link' | 'password' | 'signup';
type Status = 'idle' | 'busy' | 'link_sent' | 'signup_sent' | 'reset_sent' | 'oauth';

const authError = (code: string | undefined, a: Record<string, string>) =>
  code === 'invalid_credentials' ? a.err_credentials
    : code === 'email_not_confirmed' ? a.err_unconfirmed
      : code === 'weak_password' ? a.err_weak
        : code === 'user_already_exists' || code === 'email_exists' ? a.err_exists
          : code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' ? a.rate_limited
            : a.error;

/** Sign in: Google (when enabled), an emailed link (no password), or email + password, with sign-up and reset. */
function SignInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, m, locale } = useT();
  const a = m.acct as unknown as Record<string, string>;
  const sb = supabaseBrowser();
  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  useEffect(() => { if (open) void enabledProviders().then(setProviders); }, [open]);
  const redirect = () => `${location.origin}/app/me`; // read on click: `location` doesn't exist while prerendering
  const reset = (to: Mode = mode) => { setMode(to); setStatus('idle'); setErr(null); };
  const close = () => { onClose(); if (status !== 'busy') { setStatus('idle'); setErr(null); setPassword(''); } };

  const run = async (fn: () => Promise<{ error: { code?: string } | null }>, ok: Status | 'close') => {
    if (!sb) return;
    setStatus('busy'); setErr(null);
    const { error } = await fn();
    if (error) { setStatus('idle'); setErr(authError(error.code, a)); return; }
    if (ok === 'close') { setPassword(''); setStatus('idle'); onClose(); } else setStatus(ok);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    const mail = email.trim();
    if (mode === 'link') void run(() => sb.auth.signInWithOtp({ email: mail, options: { emailRedirectTo: redirect(), data: { locale } } }), 'link_sent');
    else if (mode === 'password') void run(() => sb.auth.signInWithPassword({ email: mail, password }), 'close');
    else void run(async () => {
      const r = await sb.auth.signUp({ email: mail, password, options: { emailRedirectTo: redirect(), data: { locale } } });
      if (!r.error && r.data.session) { setPassword(''); onClose(); return { error: null }; } // email confirmation is off
      return r;
    }, 'signup_sent');
  };
  const forgot = () => {
    if (!sb) return;
    if (!email.trim()) { setErr(a.enter_email); return; }
    void run(() => sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect() }), 'reset_sent');
  };
  const google = async () => {
    if (!sb) return;
    setStatus('oauth'); setErr(null);
    try { await startOAuth(sb, 'google'); } catch { setStatus('idle'); setErr(a.oauth_error); }
  };

  const sentBody = status === 'link_sent' ? a.sent_p : status === 'signup_sent' ? a.signup_sent_p : a.reset_sent_p;
  return (
    <Sheet open={open} onClose={close} title={mode === 'signup' ? a.create_account : t('sign_in')}>
      <div className={styles.signIn}>
        {!sb ? <p className={styles.note}>{a.unavailable}</p>
          : status === 'link_sent' || status === 'signup_sent' || status === 'reset_sent' ? (
            <>
              <span className={`ms ${styles.bigIcon}`} aria-hidden="true">mark_email_read</span>
              <h3 className={styles.h}>{a.sent_h}</h3>
              <p className={styles.p}>{sentBody.replace('{email}', email.trim())}</p>
              <button type="button" className={styles.linkBtn} onClick={() => reset(status === 'link_sent' ? 'link' : 'password')}>{a.back_to_sign_in}</button>
            </>
          ) : (
            <form onSubmit={submit} className={styles.form}>
              {providers.includes('google') && mode !== 'signup' && (
                <>
                  <button type="button" className={styles.google} onClick={google} disabled={status === 'oauth'}>
                    <GoogleMark />{a.continue_google}
                  </button>
                  <div className={styles.or} aria-hidden="true"><span>{a.or_email}</span></div>
                </>
              )}
              {mode !== 'signup' && (
                <div className={styles.seg} role="tablist" aria-label={t('sign_in')}>
                  {(['link', 'password'] as const).map(k => (
                    <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => reset(k)}>{k === 'link' ? a.tab_link : a.tab_password}</button>
                  ))}
                </div>
              )}
              <p className={styles.p}>{mode === 'link' ? a.sign_in_p : mode === 'password' ? a.password_p : a.signup_p}</p>
              <label className={styles.label} htmlFor="sisma-email">{a.email}</label>
              <input id="sisma-email" className={styles.input} type="email" inputMode="email" autoComplete="email" required
                placeholder={a.email_ph} value={email} onChange={e => setEmail(e.target.value)} />
              {mode !== 'link' && (
                <>
                  <label className={styles.label} htmlFor="sisma-password">{a.password}</label>
                  <div className={styles.pwWrap}>
                    <input id="sisma-password" className={styles.input} type={show ? 'text' : 'password'} required minLength={mode === 'signup' ? 8 : undefined}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className={styles.eye} onClick={() => setShow(v => !v)} aria-label={a.show_password} aria-pressed={show}>
                      <span className="ms" aria-hidden="true">{show ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {mode === 'signup' && <p className={styles.hint}>{a.password_rules}</p>}
                </>
              )}
              {err && <p className={styles.err} role="alert">{err}</p>}
              <button type="submit" className={styles.primary} disabled={status === 'busy'}>
                {mode === 'link' ? a.send_link : mode === 'password' ? t('sign_in') : a.create_account}
              </button>
              {mode === 'password' && (
                <div className={styles.links}>
                  <button type="button" className={styles.linkBtn} onClick={forgot}>{a.forgot}</button>
                  <button type="button" className={styles.linkBtn} onClick={() => reset('signup')}>{a.no_account}</button>
                </div>
              )}
              {mode === 'signup' && <button type="button" className={styles.linkBtn} onClick={() => reset('password')}>{a.have_account}</button>}
            </form>
          )}
      </div>
    </Sheet>
  );
}

/** Set or change the password of the signed-in account (also after following a password-reset link). */
function PasswordSheet({ onClose }: { onClose: () => void }) {
  const { m } = useT();
  const a = m.acct as unknown as Record<string, string>;
  const sb = supabaseBrowser();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    if (pw !== pw2) { setErr(a.password_mismatch); return; }
    setStatus('busy'); setErr(null);
    const { error } = await sb.auth.updateUser({ password: pw });
    if (!error) { setStatus('done'); return; }
    setStatus('idle');
    setErr(error.code === 'reauthentication_needed' ? a.err_reauth : error.code === 'same_password' ? a.err_same : authError(error.code, a));
  };
  return (
    <Sheet open onClose={onClose} title={a.change_password}>
      <div className={styles.signIn}>
        {status === 'done' ? (
          <>
            <span className={`ms ${styles.bigIcon}`} aria-hidden="true">check_circle</span>
            <h3 className={styles.h}>{a.password_saved}</h3>
            <button type="button" className={styles.primary} onClick={onClose}>{a.done_btn}</button>
          </>
        ) : (
          <form className={styles.form} onSubmit={save}>
            <label className={styles.label} htmlFor="pw-new">{a.new_password}</label>
            <div className={styles.pwWrap}>
              <input id="pw-new" className={styles.input} type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={pw} onChange={e => setPw(e.target.value)} />
              <button type="button" className={styles.eye} onClick={() => setShow(v => !v)} aria-label={a.show_password} aria-pressed={show}>
                <span className="ms" aria-hidden="true">{show ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <label className={styles.label} htmlFor="pw-confirm">{a.confirm_password}</label>
            <input id="pw-confirm" className={styles.input} type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={pw2} onChange={e => setPw2(e.target.value)} />
            <p className={styles.hint}>{a.password_rules}</p>
            {err && <p className={styles.err} role="alert">{err}</p>}
            <button type="submit" className={styles.primary} disabled={status === 'busy'}>{a.save}</button>
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
