// Pacific Fire Ribbon share card: the facts it states and the post text and image description (alt text) that go with
// it. Pure functions (no DOM), shared by the share sheet (components/science/RibbonShare.tsx) and its tests.
import type { MinMag, Period, RibbonQuake } from './shared';
import type { RibbonVolcano } from './volcanoes';
import { fillPost } from '../share-text';

/** The card is drawn as one ribbon folded into this many rows (left to right, then back, and so on). */
export const CARD_ROWS = 4;
/** Terrain heights and sea-floor depths on the card, times the depth scale (stated on the card and in the alt text). */
export const CARD_RELIEF = 20;
/** Depth that counts as "deep" in the alt text (km). */
export const DEEP_KM = 300;

export interface RibbonFacts {
  n: number;
  largest: RibbonQuake | null;
  deepest: RibbonQuake | null;
  /** Earthquakes deeper than DEEP_KM. */
  deep: number;
  /** Volcanoes in this week's activity report (any category). */
  reported: number;
}

const isReported = (v: RibbonVolcano) => v.status !== 'catalogued' && v.status !== 'unknown';

export function ribbonFacts(quakes: RibbonQuake[], volcanoes: RibbonVolcano[]): RibbonFacts {
  let largest: RibbonQuake | null = null, deepest: RibbonQuake | null = null, deep = 0;
  for (const q of quakes) {
    if (q.mag !== null && (!largest || q.mag > (largest.mag ?? -Infinity) || (q.mag === largest.mag && q.time > largest.time))) largest = q;
    if (!deepest || q.depth > deepest.depth) deepest = q;
    if (q.depth > DEEP_KM) deep++;
  }
  return { n: quakes.length, largest, deepest, deep, reported: volcanoes.filter(isReported).length };
}

export interface ShareStrings {
  post: string; alt_intro: string; alt_quakes: string; alt_none: string; alt_largest: string; alt_deepest: string;
  alt_deep: string; alt_volc: string; alt_terrain: string; alt_source: string; all_mags: string;
}

/** Fills {name} placeholders. */
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

export interface ShareFormat {
  /** "30 days" etc. */
  period: string;
  /** Formats a whole number. */
  int: (n: number) => string;
  /** Formats a magnitude (one decimal). */
  mag: (m: number) => string;
  /** Formats a depth in the person's units. */
  depth: (km: number) => string;
  /** The source place text in the person's units. */
  place: (s: string) => string;
}

const minText = (min: MinMag, s: ShareStrings, f: ShareFormat) => (min === 0 ? s.all_mags : `M${f.mag(min)}+`);

/** The post's opening lines (the link and hashtag are added after it). */
export function ribbonPost(facts: RibbonFacts, min: MinMag, s: ShareStrings, f: ShareFormat) {
  const largest = facts.largest?.mag != null ? `M${f.mag(facts.largest.mag)}${facts.largest.place ? ` · ${f.place(facts.largest.place)}` : ''}` : '';
  return fillPost(s.post, { period: f.period, n: f.int(facts.n), min: minText(min, s, f), largest });
}

/** The image description: what the card shows, in the order a reader meets it. */
export function ribbonAlt(facts: RibbonFacts, min: MinMag, s: ShareStrings, f: ShareFormat) {
  const parts = [s.alt_intro];
  if (facts.n === 0) parts.push(fill(s.alt_none, { period: f.period, min: minText(min, s, f) }));
  else {
    parts.push(fill(s.alt_quakes, { n: f.int(facts.n), period: f.period, min: minText(min, s, f) }));
    if (facts.largest?.mag != null) parts.push(fill(s.alt_largest, { mag: f.mag(facts.largest.mag), place: f.place(facts.largest.place ?? '—'), depth: f.depth(facts.largest.depth) }));
    if (facts.deepest) parts.push(fill(s.alt_deepest, { depth: f.depth(facts.deepest.depth), place: f.place(facts.deepest.place ?? '—') }));
    if (facts.deep > 0) parts.push(fill(s.alt_deep, { n: f.int(facts.deep), depth: f.depth(DEEP_KM) }));
  }
  if (facts.reported > 0) parts.push(fill(s.alt_volc, { n: f.int(facts.reported) }));
  parts.push(fill(s.alt_terrain, { n: f.int(CARD_RELIEF) }), s.alt_source);
  // Sentences ending in a CJK full stop are joined without a space.
  return parts.filter(Boolean).reduce((acc, p) => (acc ? acc + (/[。！？]$/.test(acc) ? '' : ' ') + p : p), '');
}

/** The card's file name, e.g. sisma-fire-ribbon-month-m2.5.png. */
export const ribbonFileName = (period: Period, min: MinMag) => `sisma-fire-ribbon-${period}-${min === 0 ? 'all' : `m${min}`}.png`;

/**
 * Splits the route into CARD_ROWS equal rows. Row r covers [x0, x1); odd rows run right to left (the ribbon folds
 * back), so `px(x)` maps a route position to 0…1 across the row in reading order on the card.
 */
export function cardRows(lengthKm: number) {
  const len = lengthKm / CARD_ROWS;
  return Array.from({ length: CARD_ROWS }, (_, r) => {
    const x0 = r * len, x1 = (r + 1) * len, rev = r % 2 === 1;
    return { r, x0, x1, rev, px: (x: number) => (rev ? (x1 - x) / len : (x - x0) / len) };
  });
}
/** The row a route position falls in (positions beyond the ends go to the first or last row). */
export const rowOf = (x: number, lengthKm: number) => Math.max(0, Math.min(CARD_ROWS - 1, Math.floor(x / (lengthKm / CARD_ROWS))));
