'use client';
// App-wide state for /app: plan, the user's locations and which one drives "nearest" and distances, and open sheets.
// Locations = the device position (when allowed; never prompted on load) + saved places. Saved places live in
// Supabase (saved_locations, RLS own rows, the DB trigger enforces the plan limit) for signed-in users and in
// localStorage for guests; a guest's places move into the account on sign-in. The chosen location is remembered per
// device; for signed-in users it is also the account's default (is_primary) so another device opens on it.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { limits, type Plan } from '@/lib/entitlements';
import type { PlaceHit } from '@/lib/places';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useAccount } from './Account';
import { usePresencePings } from './FeltMap';

export interface SavedLocation {
  /** 'device', a saved place id, or 'default' for the example location shown before any is set. */
  key: string; name: string; detail?: string; lat: number; lon: number;
  /** true when it came from the device's geolocation */ fromDevice?: boolean;
  /** true for the example location used until the user sets one */ fallback?: boolean;
}
export interface Place { id: string; name: string; detail?: string; lat: number; lon: number; primary?: boolean }
export type LocateResult = 'ok' | 'denied' | 'unavailable';
export type AddResult = 'ok' | 'limit' | 'error';
interface AppState {
  /** Effective plan from the signed-in profile (guests: free). UI only — the server re-checks. */
  plan: Plan;
  locations: SavedLocation[]; active: number; setActive: (i: number) => void;
  places: Place[]; canAddPlace: boolean;
  addPlace: (p: PlaceHit) => Promise<AddResult>; removePlace: (id: string) => Promise<void>;
  /** Asks for the device position (shows the browser/OS prompt if not yet decided) and makes it the active location. */
  locateMe: () => Promise<LocateResult>;
  sheet: null | 'detail' | 'report' | 'filter' | 'paywall' | 'lang'; setSheet: (s: AppState['sheet']) => void;
}
const Ctx = createContext<AppState | null>(null);
const FALLBACK: SavedLocation = { key: 'default', name: 'San Francisco, CA', lat: 37.77, lon: -122.42, fallback: true };

// Small localStorage-backed stores (guest places, chosen location) shared through useSyncExternalStore.
function localStore<T>(key: string, empty: T) {
  const subs = new Set<() => void>();
  let raw: string | null | undefined, val = empty;
  const get = () => {
    let r: string | null = null;
    try { r = localStorage.getItem(key); } catch { /* storage unavailable */ }
    if (r !== raw) { raw = r; try { val = r ? (JSON.parse(r) as T) : empty; } catch { val = empty; } }
    return val;
  };
  const set = (v: T) => { try { if (v === empty || v === null || (Array.isArray(v) && v.length === 0)) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } subs.forEach(f => f()); };
  const use = () => useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, get, () => empty);
  return { get, set, use };
}
const NO_PLACES: Place[] = [];
const guestPlaces = localStore<Place[]>('sisma.places', NO_PLACES);
const activeStore = localStore<string | null>('sisma.activeLoc', null);
const writeActive = (k: string | null) => activeStore.set(k);

interface NativeGeo {
  requestPermissions: () => Promise<{ location: string }>;
  getCurrentPosition: (o: { enableHighAccuracy: boolean; timeout: number }) => Promise<{ coords: { latitude: number; longitude: number } }>;
}
/** @capacitor/geolocation when running inside the Android app; null in a browser. */
function nativeGeolocation(): NativeGeo | null {
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { Geolocation?: NativeGeo } } }).Capacitor;
  return cap?.isNativePlatform?.() && cap.Plugins?.Geolocation ? cap.Plugins.Geolocation : null;
}


export function AppStateProvider({ children }: { children: ReactNode }) {
  const { plan, user, ready } = useAccount();
  const sb = supabaseBrowser();
  const [device, setDevice] = useState<{ lat: number; lon: number } | null>(null);
  const [remote, setRemote] = useState<Place[] | null>(null);
  const [sheet, setSheet] = useState<AppState['sheet']>(null);
  const guest = guestPlaces.use();
  const activeKey = activeStore.use();
  const places = user ? remote ?? NO_PLACES : guest;

  // Signed in: load the account's places, moving any guest places into the account first (up to the plan limit).
  useEffect(() => {
    if (!sb || !user) { setRemoteLater(null); return; }
    let alive = true;
    (async () => {
      const local = guestPlaces.get();
      if (local.length) {
        const { data: have } = await sb.from('saved_locations').select('name, lat, lon').eq('user_id', user.id);
        for (const p of local) {
          if (have?.some(h => h.name === p.name && Math.abs(h.lat - p.lat) < 0.01 && Math.abs(h.lon - p.lon) < 0.01)) continue;
          const { error } = await sb.from('saved_locations').insert({ user_id: user.id, name: p.name, detail: p.detail ?? null, lat: p.lat, lon: p.lon });
          if (error) break; // limit reached
        }
        guestPlaces.set(NO_PLACES);
      }
      const { data } = await sb.from('saved_locations').select('id, name, detail, lat, lon, is_primary').eq('user_id', user.id).order('created_at');
      if (alive) setRemote((data ?? []).map(r => ({ id: r.id, name: r.name, detail: r.detail ?? undefined, lat: r.lat, lon: r.lon, primary: r.is_primary })));
    })();
    return () => { alive = false; };
    // Reset to "not loaded" outside the effect body so it doesn't render twice synchronously.
    function setRemoteLater(v: null) { void Promise.resolve().then(() => setRemote(v)); }
  }, [sb, user]);

  const locateMe = useCallback(async (): Promise<LocateResult> => {
    const applyFix = (lat: number, lon: number) => {
      setDevice({ lat, lon });
      writeActive('device');
    };
    // Android app: ask through the native plugin so the system permission dialog appears (a WebView won't prompt itself).
    const G = nativeGeolocation();
    if (G) {
      try {
        const perm = await G.requestPermissions();
        if (perm.location === 'denied') return 'denied';
        const p = await G.getCurrentPosition({ enableHighAccuracy: false, timeout: 15_000 });
        applyFix(p.coords.latitude, p.coords.longitude); return 'ok';
      } catch { return 'unavailable'; }
    }
    if (!navigator.geolocation) return 'unavailable';
    // Browser: shows the permission prompt when the user hasn't decided yet; resolves at once when already allowed.
    return new Promise<LocateResult>(resolve => navigator.geolocation.getCurrentPosition(
      p => { applyFix(p.coords.latitude, p.coords.longitude); resolve('ok'); },
      e => resolve(e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { maximumAge: 300_000, timeout: 20_000 },
    ));
  }, []);

  // Automatic felt maps: approximate position while the app is open (only with location allowed; Me can turn it off).
  usePresencePings(device);

  // Never prompt on load (onboarding and Me ask with an explanation); only refresh when access was already granted.
  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' }).then(s => { if (s.state === 'granted') void locateMe(); }).catch(() => {});
  }, [locateMe]);

  const locations = useMemo<SavedLocation[]>(() => {
    const list: SavedLocation[] = [
      ...(device ? [{ key: 'device', name: 'My location', lat: device.lat, lon: device.lon, fromDevice: true }] : []),
      ...places.map(p => ({ key: p.id, name: p.name, detail: p.detail, lat: p.lat, lon: p.lon })),
    ];
    return list.length ? list : [FALLBACK];
  }, [device, places]);

  // Chosen on this device → the account default → the device position → the first place.
  const resolvedKey = [activeKey, places.find(p => p.primary)?.id, device ? 'device' : null, locations[0].key]
    .find(k => k && locations.some(l => l.key === k));
  const active = Math.max(0, locations.findIndex(l => l.key === resolvedKey));

  const setActive = useCallback((i: number) => {
    const l = locations[i]; if (!l) return;
    writeActive(l.key);
    if (!sb || !user || l.fromDevice || l.fallback) return;
    setRemote(r => r?.map(p => ({ ...p, primary: p.id === l.key })) ?? r);
    void (async () => {
      await sb.from('saved_locations').update({ is_primary: false }).eq('user_id', user.id).eq('is_primary', true).neq('id', l.key);
      await sb.from('saved_locations').update({ is_primary: true }).eq('id', l.key);
    })();
  }, [locations, sb, user]);

  const max = limits(plan).maxLocations;
  const addPlace = useCallback(async (hit: PlaceHit): Promise<AddResult> => {
    const same = places.find(p => p.name === hit.name && Math.abs(p.lat - hit.lat) < 0.01 && Math.abs(p.lon - hit.lon) < 0.01);
    if (same) { writeActive(same.id); return 'ok'; }
    if (places.length >= max) return 'limit';
    if (!user || !sb) {
      const id = `local-${Date.now().toString(36)}`;
      guestPlaces.set([...guestPlaces.get(), { id, ...hit }]);
      writeActive(id); return 'ok';
    }
    const { data, error } = await sb.from('saved_locations')
      .insert({ user_id: user.id, name: hit.name, detail: hit.detail || null, lat: hit.lat, lon: hit.lon })
      .select('id, name, detail, lat, lon, is_primary').single();
    if (error) return error.code === 'P0001' ? 'limit' : 'error';
    setRemote(r => [...(r ?? []), { id: data.id, name: data.name, detail: data.detail ?? undefined, lat: data.lat, lon: data.lon, primary: data.is_primary }]);
    writeActive(data.id); return 'ok';
  }, [places, max, user, sb]);

  const removePlace = useCallback(async (id: string) => {
    if (activeStore.get() === id) writeActive(null);
    if (!user || !sb) { guestPlaces.set(guestPlaces.get().filter(p => p.id !== id)); return; }
    setRemote(r => r?.filter(p => p.id !== id) ?? r);
    await sb.from('saved_locations').delete().eq('id', id);
  }, [user, sb]);

  return (
    <Ctx.Provider value={{
      plan, locations, active, setActive, places, canAddPlace: ready && places.length < max,
      addPlace, removePlace, locateMe, sheet, setSheet,
    }}>{children}</Ctx.Provider>
  );
}
export const useApp = () => { const v = useContext(Ctx); if (!v) throw new Error('useApp outside AppStateProvider'); return v; };
