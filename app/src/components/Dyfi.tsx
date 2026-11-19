'use client';
// USGS "Did You Feel It?" for the event in focus in the region view: loads GET /api/dyfi (lib/quakes/dyfi.ts) for
// the event's USGS id. Drawn by WorldMap as intensity-coloured ~10 km boxes; summarised in the region card.
import { useEffect, useState } from 'react';
import type { DyfiCell } from '@/lib/quakes/dyfi';

export interface DyfiState { responses: number; maxCdi: number | null; cells: DyfiCell[] }

/** The USGS event page with its Did You Feel It? map. */
export const dyfiPage = (usgsId: string) => `https://earthquake.usgs.gov/earthquakes/eventpage/${encodeURIComponent(usgsId)}/dyfi/intensity`;

export function useDyfi(usgsId: string | null): { loading: boolean; data: DyfiState | null } {
  const [data, setData] = useState<{ id: string; d: DyfiState | null } | null>(null);
  useEffect(() => {
    if (!usgsId) return;
    let alive = true;
    fetch('/api/dyfi?id=' + encodeURIComponent(usgsId))
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive) setData({ id: usgsId, d: j && Array.isArray(j.cells) ? j : null }); })
      .catch(() => { if (alive) setData({ id: usgsId, d: null }); });
    return () => { alive = false; };
  }, [usgsId]);
  return usgsId && data?.id === usgsId ? { loading: false, data: data.d } : { loading: !!usgsId, data: null };
}
