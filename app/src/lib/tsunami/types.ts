// Official tsunami messages from the tsunami warning centres, normalised (lib/tsunami/noaa.ts, jma.ts) and stored in
// tsunami_messages by the per-minute job (lib/tsunami/poll.ts), because the feeds only carry the latest bulletin.
// sisma relays these messages; it does not issue warnings.

export type TsunamiCenter = 'PTWC' | 'NTWC' | 'JMA';

/** Levels, from the most to the least serious. 'threat' is PTWC's Tsunami Threat Message; 'forecast' is JMA's
 *  Tsunami Forecast (slight sea-level change, no damage expected); 'none' is JMA's "No tsunami risk". */
export const TSUNAMI_LEVELS = ['major_warning', 'warning', 'threat', 'watch', 'advisory', 'forecast', 'information', 'none'] as const;
export type TsunamiLevel = (typeof TSUNAMI_LEVELS)[number];

/** Levels that put a badge on pins and send a push: an official message saying there may be a hazard. */
export const TSUNAMI_HAZARD: ReadonlySet<TsunamiLevel> = new Set(['major_warning', 'warning', 'threat', 'watch', 'advisory']);

export const levelRank = (l: TsunamiLevel) => TSUNAMI_LEVELS.indexOf(l);
/** The more serious of two levels. */
export const worse = (a: TsunamiLevel, b: TsunamiLevel) => (levelRank(a) <= levelRank(b) ? a : b);

export interface TsunamiArea { name: string; level: TsunamiLevel }

export interface TsunamiMessage {
  id: string;              // center-specific message id (CAP identifier, JMA detail file)
  center: TsunamiCenter;
  incident: string;        // groups the messages about one earthquake (NOAA <incidents>, JMA EventID)
  level: TsunamiLevel;
  cancelled: boolean;      // the message cancels the earlier ones for this incident
  title: string;           // the centre's own title, English
  issued: number;          // epoch ms
  expires: number | null;
  origin: number | null;   // earthquake origin time, epoch ms
  lat: number | null;
  lon: number | null;
  mag: number | null;
  place: string;           // the centre's location text, English
  areas: TsunamiArea[];    // coasts named in the message (JMA forecast areas; NOAA CAP areaDesc)
  url: string;             // the official bulletin
}

/** What the app shows for an earthquake: the latest message of its incident, per centre, the most serious first. */
export interface TsunamiAlert {
  incident: string;        // the incident it belongs to (TsunamiMessage.incident)
  level: TsunamiLevel;
  center: TsunamiCenter;
  status: 'active' | 'cancelled' | 'ended';
  title: string;
  issued: number;
  url: string;
  areas: TsunamiArea[];
}
