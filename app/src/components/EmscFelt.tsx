'use client';
// EMSC felt reports for the event in focus in the region view: loads GET /api/emsc-felt (lib/quakes/emsc-felt.ts,
// ~10 km cells, never individual positions) for the event's EMSC unid. Drawn by WorldMap as intensity-coloured dots.
import { useEffect, useState } from 'react';
import type { EmscFelt } from '@/lib/quakes/emsc-felt';

export function useEmscFelt(unid: string | null): { loading: boolean; data: EmscFelt | null } {
  const [data, setData] = useState<{ id: string; d: EmscFelt | null } | null>(null);
  useEffect(() => {
    if (!unid) return;
    let alive = true;
    fetch('/api/emsc-felt?unid=' + encodeURIComponent(unid))
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive) setData({ id: unid, d: j && Array.isArray(j.cells) ? j : null }); })
      .catch(() => { if (alive) setData({ id: unid, d: null }); });
    return () => { alive = false; };
  }, [unid]);
  return unid && data?.id === unid ? { loading: false, data: data.d } : { loading: !!unid, data: null };
}
