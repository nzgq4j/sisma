'use client';
// iPhone / iPad, in the browser (not opened from the Home Screen): a one-time sheet explaining how to add sisma to the
// Home Screen, the only way iOS lets a website send push notifications. Shown a few seconds after the app opens, once
// the splash and onboarding are out of the way. "Got it" hides it for good on this device; "Not now" (or closing
// the sheet) hides it for SNOOZE_DAYS. Never shown in the Android app or once sisma runs from the Home Screen.
import { useEffect, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { Sheet } from '@/components/Sheet';
import { LogoMark } from '@/components/Logo';
import { useOnboardingOpen } from '@/components/onboarding/store';
import styles from './install.module.css';

const KEY = 'sisma.installPrompt';
const SNOOZE_DAYS = 14;
const DELAY_MS = 3000;

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
const nativeApp = () => !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

/** Whether this device should see the prompt now (iOS browser, not dismissed or snoozed). */
export function shouldOfferInstall(stored: string | null, now: number, env: { ios: boolean; standalone: boolean; native: boolean }): boolean {
  if (!env.ios || env.standalone || env.native) return false;
  if (stored === 'done') return false;
  const until = Number(stored?.startsWith('snooze:') ? stored.slice(7) : 0);
  return !(until > now);
}

export function InstallPrompt() {
  const { m, t } = useT();
  const k = m.install;
  const onboarding = useOnboardingOpen();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (onboarding) return;
    let stored: string | null = null;
    try { stored = localStorage.getItem(KEY); } catch { return; }
    if (!shouldOfferInstall(stored, Date.now(), { ios: isIos(), standalone: standalone(), native: nativeApp() })) return;
    const id = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(id);
  }, [onboarding]);

  const close = (forGood: boolean) => {
    try { localStorage.setItem(KEY, forGood ? 'done' : `snooze:${Date.now() + SNOOZE_DAYS * 86_400_000}`); } catch { /* shows again next time */ }
    setOpen(false);
  };

  return (
    <Sheet open={open} onClose={() => close(false)} label={k.title}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <LogoMark size={64} />
          <div>
            <h2 className={styles.title}>{k.title}</h2>
            <p className={styles.body}>{k.body}</p>
          </div>
        </div>
        <ol className={styles.steps}>
          <li>{k.step1} <span className={`ms ${styles.share}`} aria-hidden="true">ios_share</span></li>
          <li>{k.step2}</li>
          <li>{k.step3.replace('{push}', t('push')).replace('{me}', t('tab_me'))}</li>
        </ol>
        <p className={styles.note}>{m.rules.locked_h}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => close(false)}>{k.not_now}</button>
          <button type="button" className={styles.primary} onClick={() => close(true)}>{k.got_it}</button>
        </div>
      </div>
    </Sheet>
  );
}
