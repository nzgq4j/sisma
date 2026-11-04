'use client';
// Social sign-in (Google) through Supabase Auth.
// - Web: a normal redirect to Google and back to /app/me; supabase-js reads the session from the returned URL.
// - Android app with the social-login plugin (@capgo/capacitor-social-login, app 1.1+): Google's own account picker
//   (Credential Manager) inside the app, no browser. It returns a Google ID token for the Web client (its audience is
//   the Client ID set in Supabase → Google), which supabase-js exchanges for a session with signInWithIdToken. A nonce
//   protects against token replay: Google gets its SHA-256, Supabase the raw value and checks they match.
//   Google Cloud also needs an Android OAuth client for io.sisma.app with the SHA-1 of the key that signed the app.
// - Android app (Capacitor): Google refuses sign-in inside an embedded WebView, so the Google page opens in the
//   phone's browser (Custom Tab). When Supabase redirects back to https://sisma.io/app/me, Android hands that link to
//   the app (App Links: AndroidManifest intent filter + /.well-known/assetlinks.json) and we load it in the WebView,
//   where supabase-js picks up the session. Until App Links are verified, the browser simply stays signed in on the web.
import type { Provider, SupabaseClient } from '@supabase/supabase-js';

interface CapPlugins {
  Browser?: { open: (o: { url: string; presentationStyle?: string }) => Promise<void>; close: () => Promise<void> };
  SocialLogin?: {
    initialize: (o: { google: { webClientId: string } }) => Promise<void>;
    login: (o: { provider: 'google'; options: { nonce?: string } }) => Promise<{ result: { idToken?: string | null } }>;
  };
  App?: { addListener: (e: 'appUrlOpen', cb: (d: { url: string }) => void) => Promise<{ remove: () => void }> | { remove: () => void } };
}
function capacitor(): CapPlugins | null {
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: CapPlugins } }).Capacitor;
  return cap?.isNativePlatform?.() ? cap.Plugins ?? {} : null;
}

export const OAUTH_RETURN_PATH = '/app/me';

/** The Google OAuth client of type "Web application" (project io-sisma-app). Not secret. */
export const GOOGLE_WEB_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
  || '512767380789-psjt0a0ek4i4jp2btqkjqlas6vb3pgq8.apps.googleusercontent.com';

/** 'signed_in': done here (Android account picker); 'redirected': handed to Google, finishes on return; 'cancelled'. */
export type OAuthStart = 'signed_in' | 'redirected' | 'cancelled';

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
let socialReady: Promise<void> | null = null;

/** Starts sign-in with a provider (rejects on an error). */
export async function startOAuth(sb: SupabaseClient, provider: Provider): Promise<OAuthStart> {
  const redirectTo = `${location.origin}${OAUTH_RETURN_PATH}`;
  const native = capacitor();
  const queryParams = provider === 'google' ? { prompt: 'select_account' } : undefined;
  if (provider === 'google' && native?.SocialLogin) {
    const social = native.SocialLogin;
    socialReady ??= social.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID } }).catch(e => { socialReady = null; throw e; });
    await socialReady;
    const raw = hex(crypto.getRandomValues(new Uint8Array(32)));
    const hashed = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)));
    let idToken: string | null | undefined;
    try {
      idToken = (await social.login({ provider: 'google', options: { nonce: hashed } })).result.idToken;
    } catch (e) {
      if ((e as { code?: string })?.code === 'USER_CANCELLED') return 'cancelled';
      throw e;
    }
    if (!idToken) throw new Error('no_id_token');
    const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: raw });
    if (error) throw error;
    return 'signed_in';
  }
  // Older app versions without the plugin: Google in the phone's browser, back through an app link.
  if (native?.Browser) {
    const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true, queryParams } });
    if (error || !data.url) throw error ?? new Error('no_url');
    await native.Browser.open({ url: data.url, presentationStyle: 'popover' });
    return 'redirected';
  }
  const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo, queryParams } });
  if (error) throw error;
  return 'redirected';
}

/** Android app: when sign-in finishes in the browser and Android opens our return link in the app, load it here. */
export function listenForOAuthReturn(): () => void {
  const native = capacitor();
  if (!native?.App) return () => {};
  let handle: { remove: () => void } | undefined;
  void Promise.resolve(native.App.addListener('appUrlOpen', ({ url }) => {
    try {
      const u = new URL(url);
      if (u.origin !== location.origin || !u.pathname.startsWith(OAUTH_RETURN_PATH)) return;
      void native.Browser?.close().catch(() => {});
      location.href = u.toString(); // supabase-js reads the session from the URL on load
    } catch { /* not a URL we handle */ }
  })).then(h => { handle = h; });
  return () => handle?.remove();
}
