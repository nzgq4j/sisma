'use client';
// One quake data set for the whole app shell: Feed, Map, Globe and the desktop dashboard share the
// time range, region filter and the loaded list (as in design/SismaApp.dc.html, where all tabs read getList()).
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApp } from './AppState';
import type { Quake } from '@/lib/quakes/types';

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
}
const Ctx = createContext<QuakeData | null>(null);

export function QuakeDataProvider({ children }: { children: ReactNode }) {
  const { locations, active } = useApp();
  const loc = locations[active];
  const [range, setRange] = useState<ViewRange>('7d');
  const [region, setRegion] = useState('all');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () => {
      const qs = new URLSearchParams({ range, sort: 'time', lat: String(loc.lat), lon: String(loc.lon) });
      fetch('/api/quakes?' + qs)
        .then(r => (r.ok ? r.json() : null))
        .then(j => { if (alive && j) { setLoadedAt(Date.now()); setRows(j.quakes); } })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(id); };
  }, [range, loc.lat, loc.lon]);

  const value = useMemo<QuakeData>(() => {
    // Defensive: one row per id and only plottable coordinates, so map keys stay unique.
    const seen = new Set<string>();
    const all = (rows ?? []).filter(q => !seen.has(q.id) && seen.add(q.id) && Math.abs(q.lat) <= 90 && Math.abs(q.lon) <= 180);
    const counts = new Map<string, number>();
    all.forEach(q => counts.set(q.region, (counts.get(q.region) ?? 0) + 1));
    const regions = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const list = region === 'all' ? all : all.filter(q => q.region === region);
    return { range, setRange, region, setRegion, loaded: rows !== null, all, list, regions, loadedAt };
  }, [rows, range, region, loadedAt]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useQuakeData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useQuakeData outside QuakeDataProvider');
  return v;
}
