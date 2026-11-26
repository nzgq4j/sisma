// Pacific Fire Ribbon: what GET /api/science/ribbon sends and how the page draws it. No server-only imports: shared by
// the API (lib/ribbon/feed.ts) and the page (components/science/FireRibbon.tsx).

export type Period = 'day' | 'week' | 'month';
export const PERIODS: Period[] = ['day', 'week', 'month'];
export const PERIOD_MS: Record<Period, number> = { day: 86_400_000, week: 7 * 86_400_000, month: 30 * 86_400_000 };
/** Minimum magnitudes the page offers; 0 = every earthquake in the feed. */
export const MIN_MAGS = [0, 2.5, 4.5] as const;
export type MinMag = (typeof MIN_MAGS)[number];
/** The page asks for new data this often (the API keeps each USGS download for the same time). */
export const POLL_MS = 3_600_000;
/** Data older than this (from the USGS publication time) is shown as out of date. */
export const STALE_MS = 2 * POLL_MS;

export const GROUPS = ['southern_andes', 'central_andes', 'northern_andes', 'central_america', 'mexico', 'western_us', 'western_canada',
  'alaska', 'aleutians', 'kamchatka', 'kurils', 'japan', 'ryukyu', 'philippines', 'sangihe_halmahera', 'png', 'solomons', 'vanuatu',
  'fiji', 'tonga', 'kermadec', 'new_zealand'] as const;
export type GroupId = (typeof GROUPS)[number];

/** One earthquake, as sent: every field from the USGS summary feeds that the page shows, plus its route position. */
export interface RibbonQuake {
  id: string; time: number; updated: number;
  lat: number; lon: number; depth: number;
  mag: number | null; magType: string | null; place: string | null;
  status: string | null; net: string | null; sig: number | null;
  felt: number | null; cdi: number | null; mmi: number | null; alert: string | null; tsunami: boolean;
  nst: number | null; gap: number | null; rms: number | null; dmin: number | null;
  /** Uncertainties, km (horizontal, depth) and magnitude units, from the CSV feed; null when not reported. */
  hErr: number | null; dErr: number | null; magErr: number | null;
  url: string;
  /** Route position, km: x along the route, y to the left of it (the Pacific side on most of the route). */
  x: number; y: number;
  /** Region (index into GROUPS): the one it is beside, or the two a stretch without a volcanic arc joins. */
  from: number; to: number;
}

/** Field order of each row in the API response (rows are arrays, to keep the month's data small). */
export const COLUMNS = ['id', 'time', 'updated', 'lat', 'lon', 'depth', 'mag', 'magType', 'place', 'status', 'net', 'sig', 'felt', 'cdi', 'mmi',
  'alert', 'tsunami', 'nst', 'gap', 'rms', 'dmin', 'hErr', 'dErr', 'magErr', 'url', 'x', 'y', 'from', 'to'] as const satisfies readonly (keyof RibbonQuake)[];
export type Row = unknown[];
export const toRow = (q: RibbonQuake): Row => COLUMNS.map(c => q[c]);
export const fromRow = (r: Row): RibbonQuake => Object.fromEntries(COLUMNS.map((c, i) => [c, r[i]])) as unknown as RibbonQuake;

export interface RibbonResponse {
  period: Period; min: MinMag;
  /** When the server downloaded the feed, and when USGS generated it (ms since 1970). */
  retrieved: number; generated: number | null;
  /** Events in the USGS feed; earthquakes among them; earthquakes on the ribbon (before the magnitude filter). */
  counts: { feed: number; earthquakes: number; ribbon: number };
  lengthKm: number;
  regions: { group: GroupId; x0: number; x1: number }[];
  gaps: { x0: number; x1: number }[];
  corridor: { leftKm: number; rightKm: number; endKm: number };
  columns: readonly string[];
  rows: Row[];
}

/** Depth classes (upper bounds, km) and their colours, from the brief; checked for colour-vision separation on the
 * ribbon's dark panel (docs/fire-ribbon.md). Depth is also the vertical position, so colour is never the only cue. */
export const DEPTH_BANDS: { max: number; color: string }[] = [
  { max: 10, color: '#DE3B3B' }, // red
  { max: 35, color: '#FF8A2A' }, // orange
  { max: 70, color: '#FFE066' }, // amber
  { max: 150, color: '#2FC9D8' }, // cyan
  { max: 300, color: '#3D7BFF' }, // blue
  { max: 500, color: '#B7A1FF' }, // violet
  { max: Infinity, color: '#A23FE0' }, // deep purple
];
export const depthBand = (km: number) => DEPTH_BANDS.findIndex(b => km < b.max);
export const depthColour = (km: number) => DEPTH_BANDS[depthBand(km)].color;

/** Marker radius (CSS px) from magnitude: grows by 45% per magnitude unit, from 1.5 px (M2.5 and below) to 11 px. */
export const markerRadius = (mag: number | null) => Math.max(1.5, Math.min(11, 0.8 + 1.2 * 1.45 ** ((mag ?? 0) - 2.5)));
/** Marker opacity from age: 1 for the last 24 hours (the last hour for the past-day view), then fading linearly to
 * 0.35 at the start of the period, so recent earthquakes stand out. */
export function markerOpacity(ageMs: number, period: Period) {
  const fresh = period === 'day' ? 3_600_000 : 86_400_000;
  if (ageMs <= fresh) return 1;
  return 1 - 0.65 * Math.min(1, (ageMs - fresh) / (PERIOD_MS[period] - fresh));
}

/** The terrain profile (GET /api/science/ribbon/terrain), from NOAA ETOPO 2022 (60 arc-second), heights in metres above
 * the EGM2008 geoid. crest[i]: the highest cell within params.crestBandKm of the route for x in [i·step, (i+1)·step);
 * trench[i]: the deepest cell within params.trenchBandKm, and trenchY[i] its distance from the route (km, + = left).
 * null = no cell there. */
export interface TerrainResponse {
  builtAt: number; source: string;
  params: { lengthKm: number; crestStepKm: number; crestBandKm: number; crestGrid: string; trenchStepKm: number; trenchBandKm: number; trenchGrid: string; pieces: number };
  crest: (number | null)[]; trench: (number | null)[]; trenchY: (number | null)[];
}
/** Relief modes: the same vertical scale as earthquake depth, or heights exaggerated (earthquake depths never are). */
export const RELIEF = { scientific: 1, enhanced: 10 } as const;
export type Relief = keyof typeof RELIEF;
