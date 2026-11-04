'use client';
// One quake data set for the whole app shell: Feed, Map, Globe and the desktop dashboard share the
// time range, region filter and the loaded list (as in design/SismaApp.dc.html, where all tabs read getList()).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from './AppState';
import { takePendingYearRange } from '@/lib/pending-upgrade';
import type { Quake } from '@/lib/quakes/types';
import { can } from '@/lib/entitlements';
import { worldRegion, WORLD_REGIONS, type WorldRegion } from '@/lib/world-regions';

export type ViewRange = '24h' | '7d' | '30d' | '1y';
export const VIEW_RANGES: ViewRange[] = ['24h', '7d', '30d', '1y'];
export const RANGE_LABEL = { '24h': 'r24', '7d': 'r7', '30d': 'r30', '1y': 'r1y' } as const;
export type Row = Quake & { distanceKm: number | null };

const REFRESH_MS = 120_000;

interface QuakeData {
  range: ViewRange; setRange: (r: ViewRange) => void;
  region: string; setRegion: (r: string) => void;
  /** null until the first load finishes */
  loaded: boolean;
  /** every quake in range (deduplicated, plottable) */
  all: Row[];
  /** `all` narrowed to the selected region */
  list: Row[];
  /** regions in range with counts, most active first */
  regions: [string, number][];
  /** time of the last successful load (keeps render functions pure) */
  loadedAt: number;
  /** Map/Globe magnitude filter (sisma+ advanced filter): show only events at or above this magnitude; null = all. */
  minMag: number | null; setMinMag: (m: number | null) => void;
  /** `list` with the magnitude filter applied — what the Map tab, Globe and dashboard map draw. */
  mapList: Row[];
  /** World-region filter (sisma+ advanced filter, lib/world-regions.ts): Feed, Map, Globe and dashboard; null = all. */
  worldReg: WorldRegion | null; setWorldReg: (r: WorldRegion | null) => void;
  /** Events in range per world region (before the region filter), in WORLD_REGIONS order. */
  worldCounts: [WorldRegion, number][];
  /** Load the latest events now (pull to refresh); resolves true once new data is in, false if the request failed. */
  refresh: () => Promise<boolean>;
}
const Ctx = createContext<QuakeData | null>(null);

export function QuakeDataProvider({ children }: { children: ReactNode }) {
  const { locations, active, plan } = useApp();
  const loc = locations[active];
  const [minMag, setMinMag] = useState<number | null>(null);
  const [worldRegState, setWorldReg] = useState<WorldRegion | null>(null);
  const [range, setRange] = useState<ViewRange>('7d');
  const [region, setRegion] = useState('all');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const loadRef = useRef<(fresh?: boolean) => Promise<boolean>>(async () => false);
  // A 1-year range chosen before upgrading takes effect once the account has sisma+.
  useEffect(() => {
    if (plan !== 'plus' || !takePendingYearRange()) return;
    void Promise.resolve().then(() => setRange('1y'));
  }, [plan]);

  useEffect(() => {
    let alive = true;
    const load = (fresh = false) => {
      const qs = new URLSearchParams({ range, sort: 'time', lat: String(loc.lat), lon: String(loc.lon) });
      return fetch('/api/quakes?' + qs, fresh ? { cache: 'no-store' } : undefined)
        .then(r => (r.ok ? r.json() : null))
        .then(j => { if (alive && j) { setLoadedAt(Date.now()); setRows(j.quakes); return true; } return false; })
        .catch(() => false);
    };
    loadRef.current = load;
    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(id); };
  }, [range, loc.lat, loc.lon]);
  const refresh = useCallback(() => loadRef.current(true), []);

  // World region of each event, worked out once per load (country outlines + ocean boxes).
  const regionOf = useMemo(() => new Map((rows ?? []).map(q => [q.id, worldRegion(q.lat, q.lon)])), [rows]);

  const value = useMemo<QuakeData>(() => {
    // Defensive: one row per id and only plottable coordinates, so map keys stay unique.
    const seen = new Set<string>();
    const all = (rows ?? []).filter(q => !seen.has(q.id) && seen.add(q.id) && Math.abs(q.lat) <= 90 && Math.abs(q.lon) <= 180);
    const counts = new Map<string, number>();
    all.forEach(q => counts.set(q.region, (counts.get(q.region) ?? 0) + 1));
    const regions = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    // Advanced filters are sisma+ (lib/entitlements.ts); the settings are kept but not applied on Free.
    const plus = can(plan, 'advancedFilters');
    const wr = plus ? worldRegState : null;
    const wcount = new Map<WorldRegion, number>();
    all.forEach(q => { const r = regionOf.get(q.id); if (r) wcount.set(r, (wcount.get(r) ?? 0) + 1); });
    const worldCounts = WORLD_REGIONS.map(r => [r, wcount.get(r) ?? 0] as [WorldRegion, number]);
    const inWorld = wr ? all.filter(q => regionOf.get(q.id) === wr) : all;
    const list = region === 'all' ? inWorld : inWorld.filter(q => q.region === region);
    const mag = plus ? minMag : null;
    const mapList = mag == null ? list : list.filter(q => q.mag >= mag);
    return { range, setRange, region, setRegion, loaded: rows !== null, all, list, regions, loadedAt, minMag: mag, setMinMag, mapList,
      worldReg: wr, setWorldReg, worldCounts, refresh };
  }, [rows, range, region, loadedAt, minMag, plan, worldRegState, regionOf, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useQuakeData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useQuakeData outside QuakeDataProvider');
  return v;
}
