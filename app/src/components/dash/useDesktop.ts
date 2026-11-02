'use client';
import { useSyncExternalStore } from 'react';

/** Desktop breakpoint: at and above this width /app renders as a dashboard instead of the phone layout. */
export const DESKTOP_QUERY = '(min-width: 1024px)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP_QUERY).matches, () => false);
}
