'use client';
// Launch splash for /app: brand violet (same as the Android launch screen and the PWA theme colour), the logo glyph,
// wordmark, tagline and a seismograph trace being drawn. Shown once per browser session on the first app load and
// held until the first quake data arrives (at least MIN_MS so it doesn't flash, at most MAX_MS so it never blocks).
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useQuakeData } from '@/components/QuakeData';
import { useT } from '@/i18n/I18nProvider';
import { EARTHQUAKE_PATH } from '@/components/logo-path';
import styles from './splash.module.css';

const KEY = 'sisma.splash';
const MIN_MS = 900, MAX_MS = 4000, FADE_MS = 320;
const noop = () => () => {};
const seenThisSession = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };
// Runs as soon as the server HTML is parsed (before hydration) so a reload in the same session never shows the splash.
const EARLY = `try{if(sessionStorage.getItem('${KEY}')==='1'){var s=document.getElementById('sisma-splash');if(s)s.style.display='none'}}catch(e){}`;

// A short seismogram: quiet, P-wave, larger S-wave, coda (viewBox 0 0 320 60).
const TRACE = 'M0 30 H70 l4 -3 l4 6 l4 -8 l4 9 l4 -5 l4 1 H120 l3 -10 l4 22 l4 -28 l5 34 l4 -26 l4 18 l4 -12 l4 8 l4 -5 l4 -1 H200 l4 -2 l4 4 l4 -3 l4 1 H320';

export function Splash() {
  const { loaded } = useQuakeData();
  const { t, m } = useT();
  const seen = useSyncExternalStore(noop, seenThisSession, () => false);
  const [minDone, setMinDone] = useState(false);
  const [capHit, setCapHit] = useState(false);
  const [gone, setGone] = useState(false);
  const leaving = capHit || (loaded && minDone);

  useEffect(() => {
    // In the Android app the native launch screen looks identical, so hand over to this one as soon as it is painted.
    const cap = (window as { Capacitor?: { Plugins?: { SplashScreen?: { hide?: (o?: { fadeOutDuration?: number }) => unknown } } } }).Capacitor;
    try { void cap?.Plugins?.SplashScreen?.hide?.({ fadeOutDuration: 0 }); } catch { /* not in the app shell */ }
    const a = setTimeout(() => setMinDone(true), MIN_MS), b = setTimeout(() => setCapHit(true), MAX_MS);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => { try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ } setGone(true); }, FADE_MS);
    return () => clearTimeout(id);
  }, [leaving]);

  if (seen || gone) return null;
  return (
    <>
      <div id="sisma-splash" className={`${styles.splash} ${leaving ? styles.leaving : ''}`} role="status" aria-live="polite" suppressHydrationWarning>
        <div className={styles.center}>
          <svg className={styles.mark} viewBox="0 -960 960 960" aria-hidden="true"><path d={EARTHQUAKE_PATH} /></svg>
          <div className={styles.word}>sisma</div>
          <div className={styles.tag}>{t('app_tag')}</div>
        </div>
        <svg className={styles.trace} viewBox="0 0 320 60" preserveAspectRatio="none" aria-hidden="true">
          <path d={TRACE} />
        </svg>
        <span className="sr-only">{m.dash.loading}</span>
      </div>
      <script dangerouslySetInnerHTML={{ __html: EARLY }} suppressHydrationWarning />
    </>
  );
}
