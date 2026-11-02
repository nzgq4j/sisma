'use client';
// First-run onboarding (spec: docs/onboarding.md). Welcome → Language → Location → Important.
// The Alerts step joins once push (build step 9) and billing (8) exist. Shown after the splash, once per device.
// Skip jumps to the last step: the "not an official warning service" notice must be acknowledged once.
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp, type LocateResult } from '@/components/AppState';
import { LanguageOptions } from '@/components/LanguagePicker';
import { LogoMark } from '@/components/Logo';
import { finishOnboarding, useOnboardingOpen } from './store';
import styles from './onboarding.module.css';

const STEPS = ['welcome', 'language', 'location', 'important'] as const;
const fmtCoords = (lat: number, lon: number) => `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
type Step = (typeof STEPS)[number];

export function Onboarding() {
  const open = useOnboardingOpen();
  return open ? <Flow /> : null;
}

function Flow() {
  const { m } = useT();
  const o = m.onboard;
  const { locateMe, locations } = useApp();
  const device = locations.find(l => l.fromDevice);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [loc, setLoc] = useState<LocateResult | 'busy' | null>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const step: Step = STEPS[i], last = i === STEPS.length - 1;

  const go = (n: number) => { const to = Math.max(0, Math.min(STEPS.length - 1, n)); if (to !== i) { setDir(to > i ? 1 : -1); setI(to); } };
  const next = () => go(i + 1), back = () => go(i - 1), skip = () => go(STEPS.length - 1);

  // Move focus to each step's heading so screen readers announce it.
  useEffect(() => { head.current?.focus(); }, [i]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !last) { e.preventDefault(); skip(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  // Lock page scroll behind the overlay.
  useEffect(() => { const b = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = b; }; }, []);

  // Stay on the step and show the outcome: when access was already allowed there is no browser prompt, so a silent
  // jump to the next step looked like nothing happened.
  const askLocation = async () => { setLoc('busy'); setLoc(await locateMe()); };

  const swipe = {
    onPointerDown: (e: React.PointerEvent) => { if (e.pointerType !== 'mouse') start.current = { x: e.clientX, y: e.clientY }; },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current; start.current = null; if (!s) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0 && !last) next(); else if (dx > 0) back(); }
    },
  };

  const heading = (text: string) => <h2 ref={head} id="onboard-h" tabIndex={-1} className={styles.h}>{text}</h2>;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="onboard-h">
      <div className={styles.card} {...swipe}>
        <div className={styles.top}>
          {i > 0 ? <button type="button" className={styles.ghost} onClick={back}><span className="ms" aria-hidden="true">arrow_back</span>{o.back}</button> : <span />}
          {!last && <button type="button" className={styles.ghost} onClick={skip}>{o.skip}</button>}
        </div>

        <div key={step} className={`${styles.step} ${dir < 0 ? styles.fromLeft : ''}`}>
          {step === 'welcome' && (
            <>
              <LogoMark size={72} className={styles.logo} />
              {heading(o.welcome_h)}
              <p className={styles.p}>{o.welcome_p}</p>
              <ul className={styles.points}>
                {([['sensors', o.w1], ['public', o.w2], ['science', o.w3]] as const).map(([icon, text]) => (
                  <li key={icon}><span className={styles.pointIcon}><span className="ms" aria-hidden="true">{icon}</span></span>{text}</li>
                ))}
              </ul>
            </>
          )}
          {step === 'language' && (
            <>
              <span className={`ms ${styles.icon}`} aria-hidden="true">translate</span>
              {heading(o.lang_h)}
              <p className={styles.p}>{o.lang_p}</p>
              <div className={styles.langList}><LanguageOptions /></div>
            </>
          )}
          {step === 'location' && (
            <>
              <span className={`ms ${styles.icon}`} aria-hidden="true">near_me</span>
              {heading(o.loc_h)}
              <p className={styles.p}>{o.loc_p}</p>
              <p className={styles.small}><span className="ms" aria-hidden="true">lock</span>{o.loc_privacy}</p>
              <div aria-live="polite" className={styles.locStatus}>
                {loc === 'busy' && <p className={styles.info}><span className={`ms ${styles.spin}`} aria-hidden="true">progress_activity</span>{o.loc_finding}</p>}
                {loc === 'ok' && device && (
                  <p className={styles.ok}><span className="ms" aria-hidden="true">check_circle</span>
                    <span><strong>{o.loc_set}</strong><span className={styles.coords}>{fmtCoords(device.lat, device.lon)}</span></span></p>
                )}
                {loc === 'denied' && <p className={styles.warn}>{m.acct.loc_denied} {m.acct.loc_help}</p>}
                {loc === 'unavailable' && <p className={styles.warn}>{m.acct.loc_unavailable}</p>}
              </div>
            </>
          )}
          {step === 'important' && (
            <>
              <span className={`ms ${styles.icon} ${styles.iconWarm}`} aria-hidden="true">campaign</span>
              {heading(o.imp_h)}
              <p className={styles.p}>{o.imp_p}</p>
            </>
          )}
        </div>

        <div className={styles.bottom}>
          <div className={styles.dots} role="img" aria-label={o.step.replace('{n}', String(i + 1)).replace('{total}', String(STEPS.length))}>
            {STEPS.map((s, j) => <span key={s} className={j === i ? styles.dotOn : styles.dot} />)}
          </div>
          {step === 'location' ? (
            <div className={styles.actions}>
              {loc === 'ok' ? (
                <button type="button" className={styles.primary} onClick={next}>{o.next}</button>
              ) : (
                <>
                  <button type="button" className={styles.primary} onClick={askLocation} disabled={loc === 'busy'}>
                    <span className="ms" aria-hidden="true">{loc === 'denied' || loc === 'unavailable' ? 'refresh' : 'my_location'}</span>
                    {loc === 'denied' || loc === 'unavailable' ? o.try_again : o.loc_use}
                  </button>
                  <button type="button" className={styles.secondary} onClick={next}>{o.loc_later}</button>
                </>
              )}
            </div>
          ) : last ? (
            <button type="button" className={styles.primary} onClick={finishOnboarding}>{o.imp_ok}</button>
          ) : (
            <button type="button" className={styles.primary} onClick={next}>{o.next}</button>
          )}
        </div>
      </div>
    </div>
  );
}
