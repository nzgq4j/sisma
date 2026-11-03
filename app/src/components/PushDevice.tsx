'use client';
// Alert notifications on this device, shared by the Me screen (status, turn on, test) and PushSync (keeps the
// registration fresh and opens the event when an Android notification is tapped). See lib/push-client.ts.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from './Account';
import { useT } from '@/i18n/I18nProvider';
import { useUnits } from './Units';
import { enablePush, listenForPushTaps, pushState, refreshPush, sendTestPush, type PushState } from '@/lib/push-client';

type Snap = { state: PushState; busy: boolean; tested: 'sent' | 'failed' | null };
let snap: Snap = { state: 'checking', busy: false, tested: null };
const subs = new Set<() => void>();
const set = (p: Partial<Snap>) => { snap = { ...snap, ...p }; subs.forEach(f => f()); };
let checked = false;
const check = () => { if (checked) return; checked = true; void pushState().then(state => set({ state })).catch(() => set({ state: 'unsupported' })); };

export function usePushDevice() {
  const s = useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, () => snap, () => snap);
  const { accessToken } = useAccount();
  const { locale } = useT();
  const units = useUnits();
  useEffect(check, []);
  return {
    ...s,
    enable: async () => {
      const token = await accessToken(); if (!token) return;
      set({ busy: true, tested: null });
      set({ state: await enablePush(token, locale, units), busy: false });
    },
    test: async () => {
      const token = await accessToken(); if (!token) return;
      set({ busy: true });
      const ok = await sendTestPush(token);
      set({ busy: false, tested: ok ? 'sent' : 'failed' });
      if (ok) setTimeout(() => set({ tested: null }), 4000);
    },
  };
}

/** Mounted once in the app shell: refreshes this device's language/units on the server and handles notification taps. */
export function PushSync() {
  const { user, accessToken } = useAccount();
  const { locale } = useT();
  const units = useUnits();
  const router = useRouter();
  useEffect(() => listenForPushTaps(url => router.push(url)), [router]);
  const userId = user?.id;
  const tokenRef = useRef(accessToken);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);
  useEffect(() => {
    if (!userId) return;
    void tokenRef.current().then(t => { if (t) void refreshPush(t, locale, units); });
  }, [userId, locale, units]);
  return null;
}
