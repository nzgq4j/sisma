'use client';
// First-run state. Done is per device ('sisma.onboarded' = version); bump ONBOARD_VERSION to show the flow again
// after it changes. A first visit that arrives on a deep link (e.g. a shared /app/map?focus=…) skips onboarding so
// the link opens straight away; it then shows on the next plain app open.
import { useSyncExternalStore } from 'react';

export const ONBOARD_VERSION = 1;
const KEY = 'sisma.onboarded';
const subs = new Set<() => void>();
let manual = false;
let deepLinkFirst: boolean | undefined;

const done = () => { try { return Number(localStorage.getItem(KEY)) >= ONBOARD_VERSION; } catch { return true; } };
const snapshot = () => {
  deepLinkFirst ??= new URLSearchParams(location.search).has('focus');
  return manual || (!done() && !deepLinkFirst);
};
const emit = () => subs.forEach(f => f());

/** Whether onboarding should be on screen (false during server render; the splash covers the first paint). */
export const useOnboardingOpen = () => useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, snapshot, () => false);
/** Re-run from Me → "Show introduction". */
export function openOnboarding() { manual = true; emit(); }
export function finishOnboarding() {
  try { localStorage.setItem(KEY, String(ONBOARD_VERSION)); } catch { /* storage unavailable: shows again next time */ }
  manual = false; deepLinkFirst = true; emit();
}
