// Felt layers for the share card's map (lib/share-card.tsx, lib/share-map.ts), loaded on the server for one event,
// the same as the region view: sisma's "I felt it" reports (~10 km cells), the automatic felt map (cached in
// felt_maps once its window has closed), USGS "Did You Feel It?" boxes and EMSC felt reports, merged into one grid. Each
// source has a time limit, so a slow or unreachable one leaves its layer out instead of delaying the card.
import { adminClient } from './auth';
import { feltCells, type FeltCell } from './felt-cells';
import type { HeatCell } from './feltmap';
import { fetchDyfi, usgsEventId, type DyfiCell } from './quakes/dyfi';
import { emscUnid, fetchEmscFelt, type EmscFeltCell } from './quakes/emsc-felt';
import type { Quake } from './quakes/types';
import { feltGrid, type FeltGridCell } from './felt-grid';

export interface ShareFelt { reports: FeltCell[]; heat: HeatCell[]; dyfi: DyfiCell[]; emsc: EmscFeltCell[] }
export const NO_FELT: ShareFelt = { reports: [], heat: [], dyfi: [], emsc: [] };

/** All sources merged into one grid of ~10 km cells, as drawn on the card (lib/felt-grid.ts). */
export const shareGrid = (f: ShareFelt): FeltGridCell[] => feltGrid({ reports: f.reports, dyfi: f.dyfi, emsc: f.emsc, heat: f.heat });

function within<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p.catch(() => fallback), new Promise<T>(res => setTimeout(() => res(fallback), ms))]);
}

export async function loadShareFelt(q: Quake, ms = 4000): Promise<ShareFelt> {
  const ids = [q.id, ...(q.otherIds ?? [])];
  const db = adminClient();
  const usgs = usgsEventId(q), unid = emscUnid(q);
  const [reports, heat, dyfi, emsc] = await Promise.all([
    db ? within((async () => {
      const { data } = await db.from('felt_reports').select('lat, lon, mmi').in('quake_id', ids).limit(5000);
      return feltCells(data ?? []);
    })(), ms, [] as FeltCell[]) : [],
    db ? within((async () => {
      const { data } = await db.from('felt_maps').select('cells').in('quake_id', ids).limit(1).maybeSingle();
      return Array.isArray(data?.cells) ? (data.cells as HeatCell[]) : [];
    })(), ms, [] as HeatCell[]) : [],
    usgs ? within(fetchDyfi(usgs).then(d => d?.cells ?? []), ms, [] as DyfiCell[]) : [],
    unid ? within(fetchEmscFelt(unid).then(d => d.cells), ms, [] as EmscFeltCell[]) : [],
  ]);
  return { reports, heat, dyfi, emsc };
}
