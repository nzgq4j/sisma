// What the share card's felt cells show (no server code: also used by the Share sheet in the browser). All felt
// sources are drawn as one grid of intensity-coloured cells (lib/felt-grid.ts); "unknown" marks grey cells (felt,
// intensity unknown: automatic felt map areas no report covers). Sent with the card as X-Felt-Layers for the alt text.
import type { FeltGridCell } from './felt-grid';

export type FeltMark = 'intensity' | 'unknown';
export const isFeltMark = (v: string): v is FeltMark => v === 'intensity' || v === 'unknown';

export function feltMarks(grid: FeltGridCell[]): FeltMark[] {
  return [...(grid.some(c => c.mmi != null) ? ['intensity' as const] : []), ...(grid.some(c => c.mmi == null) ? ['unknown' as const] : [])];
}

/** English sentence for alt text (Bluesky posts) describing the felt cells on the card; '' when none. */
export function feltAltEn(marks: FeltMark[]): string {
  const i = marks.includes('intensity'), u = marks.includes('unknown');
  if (!i && !u) return '';
  if (!i) return 'Where people felt it is shown as grey squares (intensity unknown).';
  return `Where people felt it is shown as small squares in intensity colours (MMI).${u ? ' Grey squares: felt, intensity unknown.' : ''}`;
}
