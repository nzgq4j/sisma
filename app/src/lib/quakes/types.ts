import type { TsunamiAlert } from '../tsunami/types';
import type { WorldRegion } from '../world-regions';

export type SourceId = 'usgs' | 'emsc' | 'geonet' | 'jma';

/** Agency review state: automatic solution, preliminary (human-checked, may change) or reviewed (final). */
export type ReviewStatus = 'automatic' | 'preliminary' | 'reviewed';

export interface Quake {
  id: string;            // source:sourceId of the winning record
  source: SourceId;
  mag: number;
  magType?: string;
  title: string;         // e.g. "12 km SW of Ridgecrest"
  region: string;        // country or named region, used for filters
  time: number;          // epoch ms UTC
  lat: number;
  lon: number;
  depthKm: number;
  felt?: number;         // number of felt reports (USGS DYFI)
  cdi?: number;          // max community intensity
  mmi?: number;          // max instrumental/JMA intensity mapped to MMI
  tsunami: boolean;      // USGS flag: the event is large and offshore, so the tsunami centres may have issued a message
  tsunamiAlert?: TsunamiAlert; // the official message for this event (PTWC, NTWC, JMA), matched by lib/tsunami/alerts.ts
  url?: string;
  status?: ReviewStatus; // agency review state, when the source publishes one
  alsoIn?: SourceId[];   // other sources reporting the same event
  otherIds?: string[];   // their ids: the event's id changes when a preferred source reports it later (e.g. EMSC first, then USGS)
  /** Country it is in, or nearest within 300 km (`near`), for the flag; null far out at sea (lib/quakes/place-info.ts). */
  country?: { code: string; near: boolean } | null;
  /** World region for the region filter (lib/world-region-of.ts). */
  worldRegion?: WorldRegion;
}

export type SortKey = 'time' | 'distance' | 'mag';
export type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all';
export const RANGE_DAYS: Record<RangeKey, number> = { '24h': 1, '7d': 7, '30d': 30, '1y': 365, all: 36500 };
