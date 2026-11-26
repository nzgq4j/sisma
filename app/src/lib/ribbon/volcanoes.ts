// Pacific Fire Ribbon, step 2: volcanoes on the ribbon. Server only (GET /api/science/ribbon/volcanoes).
//
// Sources (Smithsonian Institution, Global Volcanism Program):
//  - Volcanoes of the World, Holocene volcanoes (web services layer GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes):
//    number, name, country, subregion, position, summit elevation, type, tectonic setting, last known eruption year,
//    evidence. Only volcanoes in the ribbon's subregions (gvp-arcs.json) are kept.
//  - Holocene eruptions (GVP-VOTW:Smithsonian_VOTW_Holocene_Eruptions): per volcano, the number of confirmed eruptions,
//    the latest year one started and the largest explosivity index (VEI) recorded.
//  - The Smithsonian / USGS Weekly Volcanic Activity Report (RSS): this week's reports, joined by volcano number. Its
//    category gives the status shown: Continuing Eruptive Activity, New Eruptive Activity, New Unrest or Other
//    Observations. The report is not a list of every active volcano, so a volcano without a report has no status
//    ("catalogued"), never "dormant"; when the report can't be read, every volcano's status is "unknown".
// Each volcano is placed on the ribbon by its own latitude and longitude (lib/ribbon/transform.ts).
import gvp from './gvp-arcs.json';
import { GROUPS, type GroupId } from './shared';
import { toRibbon } from './transform';

const WFS = 'https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json';
export const VOLCANO_URL = `${WFS}&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes&propertyName=Volcano_Number,Volcano_Name,Country,Subregion,Latitude,Longitude,Elevation,Primary_Volcano_Type,Tectonic_Setting,Last_Eruption_Year,Evidence_Category`;
export const ERUPTION_URL = `${WFS}&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Eruptions&propertyName=Volcano_Number,Activity_Type,StartDateYear,ExplosivityIndexMax`;
export const REPORT_URL = 'https://volcano.si.edu/news/WeeklyVolcanoRSS.xml';
export const volcanoPage = (n: number) => `https://volcano.si.edu/volcano.cfm?vn=${n}`;

export type ReportCategory = 'continuing' | 'new_eruptive' | 'new_unrest' | 'other';
/** Shown status: a report category, 'catalogued' (no report this week) or 'unknown' (the report couldn't be read). */
export type VolcanoStatus = ReportCategory | 'catalogued' | 'unknown';

export interface WeeklyReport { n: number; name: string; category: ReportCategory; period: string; text: string; sources: string }
export interface RibbonVolcano {
  n: number; name: string; country: string | null; subregion: string; group: number;
  lat: number; lon: number; elevation: number | null; type: string | null; tectonic: string | null;
  lastEruption: number | null; evidence: string | null;
  /** Confirmed Holocene eruptions, the latest year one started, the largest VEI (null when none is recorded). */
  eruptions: number; lastConfirmed: number | null; maxVei: number | null;
  x: number; y: number;
  status: VolcanoStatus; report: WeeklyReport | null;
}

/** What GET /api/science/ribbon/volcanoes sends. */
export interface VolcanoResponse {
  catalogue: { retrieved: number };
  report: { retrieved: number; published: number | null } | null;
  volcanoes: RibbonVolcano[];
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
type Features = { features?: { properties?: Record<string, unknown> }[] };

const SUBREGION_GROUP = new Map<string, GroupId>(gvp.arcs.map(a => [a.subregion, a.group as GroupId]));

/** Eruption history per volcano number, from the Holocene eruptions layer. */
export function eruptionHistory(json: Features): Map<number, { eruptions: number; lastConfirmed: number | null; maxVei: number | null }> {
  const out = new Map<number, { eruptions: number; lastConfirmed: number | null; maxVei: number | null }>();
  for (const f of json.features ?? []) {
    const p = f.properties ?? {};
    const n = num(p.Volcano_Number);
    if (n === null || p.Activity_Type !== 'Confirmed Eruption') continue;
    const h = out.get(n) ?? { eruptions: 0, lastConfirmed: null, maxVei: null };
    h.eruptions++;
    const y = num(p.StartDateYear), v = num(p.ExplosivityIndexMax);
    if (y !== null && (h.lastConfirmed === null || y > h.lastConfirmed)) h.lastConfirmed = y;
    if (v !== null && (h.maxVei === null || v > h.maxVei)) h.maxVei = v;
    out.set(n, h);
  }
  return out;
}

/** Text from feeds that mix ISO-8859-1 and UTF-8 bytes: read as Latin-1, then repair any valid UTF-8 sequences. */
export function decodeMixed(bytes: Uint8Array): string {
  const latin = new TextDecoder('latin1').decode(bytes);
  return latin.replace(/[\xC2-\xF4][\x80-\xBF]{1,3}/g, s => {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(s, c => c.charCodeAt(0))); } catch { return s; }
  });
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ' };
const unescape = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m));
const tag = (xml: string, name: string) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? m[1] : null; };

const CATEGORY: Record<string, ReportCategory> = {
  'continuing eruptive activity': 'continuing', 'new eruptive activity': 'new_eruptive', 'new unrest': 'new_unrest', 'other observations': 'other',
};

/** This week's reports, by volcano number, and the report's publication time. */
export function weeklyReports(xml: string): { published: number | null; reports: Map<number, WeeklyReport> } {
  const reports = new Map<number, WeeklyReport>();
  const channel = xml.split('<item>')[0];
  const pub = tag(channel, 'pubDate');
  for (const item of xml.split('<item>').slice(1)) {
    const title = unescape(tag(item, 'title') ?? '').trim();
    const guid = tag(item, 'guid') ?? '';
    const n = num(guid.match(/vn_(\d+)/)?.[1]);
    const m = title.match(/^(.*?) \(([^)]*)\) - Report for (.+?) - (.+)$/);
    if (n === null || !m) continue;
    const category = CATEGORY[m[4].trim().toLowerCase()];
    if (!category) continue;
    const html = unescape(tag(item, 'description') ?? '');
    const paras = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(x => unescape(x[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()).filter(Boolean);
    const src = paras.findIndex(p => /^Sources?:/i.test(p));
    reports.set(n, {
      n, name: m[1], category, period: m[3],
      text: paras.filter((_, i) => i !== src).join('\n\n'),
      sources: src >= 0 ? paras[src].replace(/^Sources?:\s*/i, '').replace(/\s*,\s*/g, ', ') : '',
    });
  }
  const t = pub ? Date.parse(pub) : NaN;
  return { published: Number.isFinite(t) ? t : null, reports };
}

/** The ribbon's volcanoes with their history and this week's status (reports null = the report couldn't be read). */
export function ribbonVolcanoes(catalogue: Features, history: ReturnType<typeof eruptionHistory>, reports: Map<number, WeeklyReport> | null): RibbonVolcano[] {
  const out: RibbonVolcano[] = [];
  for (const f of catalogue.features ?? []) {
    const p = f.properties ?? {};
    const subregion = str(p.Subregion);
    const group = subregion ? SUBREGION_GROUP.get(subregion) : undefined;
    const n = num(p.Volcano_Number), lat = num(p.Latitude), lon = num(p.Longitude);
    if (!group || n === null || lat === null || lon === null) continue;
    const pos = toRibbon(lat, lon);
    if (!pos) continue;
    const h = history.get(n);
    const report = reports?.get(n) ?? null;
    out.push({
      n, name: str(p.Volcano_Name) ?? String(n), country: str(p.Country), subregion: subregion!, group: GROUPS.indexOf(group),
      lat, lon, elevation: num(p.Elevation), type: str(p.Primary_Volcano_Type), tectonic: str(p.Tectonic_Setting),
      lastEruption: num(p.Last_Eruption_Year), evidence: str(p.Evidence_Category),
      eruptions: h?.eruptions ?? 0, lastConfirmed: h?.lastConfirmed ?? null, maxVei: h?.maxVei ?? null,
      x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10,
      status: reports === null ? 'unknown' : report ? report.category : 'catalogued', report,
    });
  }
  return out.sort((a, b) => a.x - b.x);
}

/** Sets each volcano's status from this week's reports (null = the report couldn't be read: status unknown). */
export const withReports = (list: RibbonVolcano[], reports: Map<number, WeeklyReport> | null): RibbonVolcano[] =>
  list.map(v => {
    const report = reports?.get(v.n) ?? null;
    return { ...v, report, status: reports === null ? 'unknown' : report ? report.category : 'catalogued' };
  });
