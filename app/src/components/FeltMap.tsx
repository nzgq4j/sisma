'use client';
// Automatic felt maps on the device: the setting, sending approximate positions while the app is open, loading an
// event's felt map, and the "How felt maps work" sheet. Logic and privacy rules: lib/feltmap.ts.
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { blur, PING_EVERY_MS, type FeltMap } from '@/lib/feltmap';
import { Sheet } from './Sheet';
import styles from './felt.module.css';

// Setting: on unless switched off (only takes effect when location is already allowed). Per device.
const KEY = 'sisma.feltmap';
const subs = new Set<() => void>();
const readOn = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return false; } };
export function setFeltMapSharing(on: boolean) {
  try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, 'off'); } catch { /* storage unavailable */ }
  subs.forEach(f => f());
}
export const useFeltMapSharing = () => useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, readOn, () => false);

/**
 * While the app is visible, sends the device's approximate position at most once a minute. The blur is drawn once
 * per position fix and reused, so repeated pings can't be averaged back to the real location. Nothing is sent when
 * location isn't allowed (no fix), when the setting is off, or when the tab is in the background.
 */
export function usePresencePings(device: { lat: number; lon: number } | null) {
  const on = useFeltMapSharing();
  const point = useMemo(() => (device ? blur(device.lat, device.lon) : null), [device]);
  useEffect(() => {
    if (!on || !point) return;
    const send = () => {
      if (document.visibilityState !== 'visible') return;
      let last = 0;
      try { last = Number(sessionStorage.getItem('sisma.pingAt')) || 0; } catch { /* ignore */ }
      if (Date.now() - last < PING_EVERY_MS) return;
      try { sessionStorage.setItem('sisma.pingAt', String(Date.now())); } catch { /* ignore */ }
      void fetch('/api/presence', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(point), keepalive: true }).catch(() => {});
    };
    send();
    const id = setInterval(send, PING_EVERY_MS);
    document.addEventListener('visibilitychange', send);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', send); };
  }, [on, point]);
}

export type FeltMapState = (FeltMap & { status: 'collecting' | 'ready' }) | null;

/** Loads the automatic felt map for an event; refreshes every 30 s while its 3-minute window is still open. */
export function useFeltMap(quakeId: string | null): { loading: boolean; map: FeltMapState } {
  const [data, setData] = useState<{ id: string; map: FeltMapState } | null>(null);
  useEffect(() => {
    if (!quakeId) return;
    let alive = true, timer: ReturnType<typeof setTimeout> | undefined;
    const load = () => fetch('/api/felt-map?quakeId=' + encodeURIComponent(quakeId))
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!alive) return;
        setData({ id: quakeId, map: j && Array.isArray(j.cells) ? j : null });
        if (j?.status === 'collecting') timer = setTimeout(load, 30_000);
      })
      .catch(() => { if (alive) setData({ id: quakeId, map: null }); });
    void load();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [quakeId]);
  return quakeId && data?.id === quakeId ? { loading: false, map: data.map } : { loading: !!quakeId, map: null };
}

/** Plain-language explanation of automatic felt maps and the privacy rules behind them. */
export function FeltMapInfoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { m } = useT();
  const f = m.feltmap;
  return (
    <Sheet open={open} onClose={onClose} title={f.title}>
      <div className={styles.info}>
        <p>{f.how_1}</p>
        <p>{f.how_2}</p>
        <p>{f.how_3}</p>
        <p className={styles.infoNote}>{f.how_4}</p>
      </div>
    </Sheet>
  );
}
