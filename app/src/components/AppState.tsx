'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Plan } from '@/lib/entitlements';

export interface SavedLocation { name: string; lat: number; lon: number; /** true when it came from the device's geolocation */ fromDevice?: boolean }
interface AppState {
  plan: Plan; setPlan: (p: Plan) => void;
  locations: SavedLocation[]; active: number; setActive: (i: number) => void; addLocation: (l: SavedLocation) => void;
  sheet: null | 'detail' | 'report' | 'filter' | 'paywall' | 'lang'; setSheet: (s: AppState['sheet']) => void;
}
const Ctx = createContext<AppState | null>(null);

// TODO: back plan + locations with Supabase (profiles, saved_locations); this is the demo-mode store.
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>('free');
  const [locations, setLocations] = useState<SavedLocation[]>([{ name: 'San Francisco, CA', lat: 37.77, lon: -122.42 }]);
  const [active, setActive] = useState(0);
  const [sheet, setSheet] = useState<AppState['sheet']>(null);
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => setLocations(l => [{ name: 'My location', lat: p.coords.latitude, lon: p.coords.longitude, fromDevice: true }, ...l.slice(1)]), () => {});
  }, []);
  return <Ctx.Provider value={{ plan, setPlan, locations, active, setActive, addLocation: l => setLocations(x => [...x, l]), sheet, setSheet }}>{children}</Ctx.Provider>;
}
export const useApp = () => { const v = useContext(Ctx); if (!v) throw new Error('useApp outside AppStateProvider'); return v; };
