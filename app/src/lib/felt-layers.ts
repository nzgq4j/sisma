// Names of the felt layers on the share card (no server code: also used by the Share sheet in the browser).
export type FeltLayer = 'reports' | 'auto' | 'dyfi' | 'emsc';
export const isFeltLayer = (v: string): v is FeltLayer => v === 'reports' || v === 'auto' || v === 'dyfi' || v === 'emsc';

/** English sentence for alt text (Bluesky posts) describing the felt layers drawn on the card; '' when none. */
export function feltAltEn(layers: FeltLayer[]): string {
  const parts: Record<FeltLayer, string> = {
    reports: 'soft areas for sisma reports', auto: 'a glow for the automatic felt map',
    dyfi: 'squares for USGS “Did You Feel It?”', emsc: 'dots for EMSC reports',
  };
  return layers.length ? `Where people felt it is shown in intensity colours: ${layers.map(l => parts[l]).join(', ')}.` : '';
}
