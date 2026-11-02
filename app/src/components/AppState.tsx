'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Plan } from '@/lib/entitlements';
import { useAccount } from './Account';

export interface SavedLocation { name: string; lat: number; lon: number; /** true when it came from the device's geolocation */ fromDevice?: boolean }
export type LocateResult = 'ok' | 'denied' | 'unavailable';
interface AppState {
  /** Effective plan from the signed-in profile (guests: free). UI only — the server re-checks. */
  plan: Plan;
  locations: SavedLocation[]; active: number; setActive: (i: number) => void;
  addLocation: (l: SavedLocation) => void; removeLocation: (i: number) => void;
  /** Asks for the device position (shows the browser/OS prompt if not yet decided) and makes it the first location. */
  locateMe: () => Promise<LocateResult>;
  sheet: null | 'detail' | 'report' | 'filter' | 'paywall' | 'lang'; setSheet: (s: AppState['sheet']) => void;
}
const Ctx = createContext<AppState | null>(null);

// TODO: back saved locations with Supabase (saved_locations; the DB trigger enforces the plan limit). Device-only for now.
export function AppStateProvider({ children }: { children: ReactNode }) {
  const { plan } = useAccount();
  const [locations, setLocations] = useState<SavedLocation[]>([{ name: 'San Francisco, CA', lat: 37.77, lon: -122.42 }]);
  const [active, setActive] = useState(0);
  const [sheet, setSheet] = useState<AppState['sheet']>(null);

  const locateMe = useCallback(() => new Promise<LocateResult>(resolve => {
    if (!navigator.geolocation) return resolve('unavailable');
    navigator.geolocation.getCurrentPosition(p => {
      setLocations(l => [{ name: 'My location', lat: p.coords.latitude, lon: p.coords.longitude, fromDevice: true }, ...l.slice(1)]);
      setActive(0); resolve('ok');
    }, e => resolve(e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable'), { maximumAge: 600_000, timeout: 15_000 });
  }), []);

  // Never prompt on load (onboarding and Me ask with an explanation); only refresh when access was already granted.
  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' }).then(s => { if (s.state === 'granted') void locateMe(); }).catch(() => {});
  }, [locateMe]);

  return (
    <Ctx.Provider value={{
      plan, locations, active, setActive, locateMe, sheet, setSheet,
      addLocation: l => setLocations(x => [...x, l]),
      removeLocation: i => { setLocations(x => x.filter((_, j) => j !== i)); setActive(a => (a === i ? 0 : a > i ? a - 1 : a)); },
    }}>{children}</Ctx.Provider>
  );
}
export const useApp = () => { const v = useContext(Ctx); if (!v) throw new Error('useApp outside AppStateProvider'); return v; };
