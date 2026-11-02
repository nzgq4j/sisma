export type SourceId = 'usgs' | 'emsc' | 'geonet' | 'jma';

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
  tsunami: boolean;
  url?: string;
  alsoIn?: SourceId[];   // other sources reporting the same event
}

export type SortKey = 'time' | 'distance' | 'mag';
export type RangeKey = '24h' | '7d' | '30d' | '1y' | 'all';
export const RANGE_DAYS: Record<RangeKey, number> = { '24h': 1, '7d': 7, '30d': 30, '1y': 365, all: 36500 };
