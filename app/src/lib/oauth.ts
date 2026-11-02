'use client';
// Social sign-in (Google) through Supabase Auth.
// - Web: a normal redirect to Google and back to /app/me; supabase-js reads the session from the returned URL.
// - Android app (Capacitor): Google refuses sign-in inside an embedded WebView, so the Google page opens in the
//   phone's browser (Custom Tab). When Supabase redirects back to https://sisma.io/app/me, Android hands that link to
//   the app (App Links: AndroidManifest intent filter + /.well-known/assetlinks.json) and we load it in the WebView,
//   where supabase-js picks up the session. Until App Links are verified, the browser simply stays signed in on the web.
import type { Provider, SupabaseClient } from '@supabase/supabase-js';

interface CapPlugins {
  Browser?: { open: (o: { url: string; presentationStyle?: string }) => Promise<void>; close: () => Promise<void> };
  App?: { addListener: (e: 'appUrlOpen', cb: (d: { url: string }) => void) => Promise<{ remove: () => void }> | { remove: () => void } };
}
function capacitor(): CapPlugins | null {
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: CapPlugins } }).Capacitor;
  return cap?.isNativePlatform?.() ? cap.Plugins ?? {} : null;
}

export const OAUTH_RETURN_PATH = '/app/me';

/** Starts sign-in with a provider. Resolves when the browser has been handed off (or rejects on an error). */
export async function startOAuth(sb: SupabaseClient, provider: Provider): Promise<void> {
  const redirectTo = `${location.origin}${OAUTH_RETURN_PATH}`;
  const native = capacitor();
  const queryParams = provider === 'google' ? { prompt: 'select_account' } : undefined;
  if (native?.Browser) {
    const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true, queryParams } });
    if (error || !data.url) throw error ?? new Error('no_url');
    await native.Browser.open({ url: data.url, presentationStyle: 'popover' });
    return;
  }
  const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo, queryParams } });
  if (error) throw error;
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
