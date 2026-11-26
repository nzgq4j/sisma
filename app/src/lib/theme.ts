// Tokens lifted from design/SismaApp.dc.html. globals.css mirrors these as CSS variables. Light map colours (map*):
// warm cream land, soft sky-blue sea, warm grey borders, orange-red plate boundaries.
export const THEME = {
  light: { bg: '#F6F4FC', surface: '#FFFFFF', surface2: '#EFECF8', ink: '#1B1530', ink2: '#5E587A', line: '#E4E0F0', violet: '#6C4BF4', onViolet: '#FFFFFF', violetSoft: '#ECE7FF', violetText: '#5A38E0', mint: '#2CCB9A', chart: '#0F9B78', chartStrong: '#0A7558', chartHot: '#E0532F', tsuWarning: '#C8102E', tsuThreat: '#D9480F', tsuWatch: '#B26A00', tsuInk: '#FFFFFF', mintSoft: '#D9F7EC', mintText: '#0A7558', warmSoft: '#FFE9E1', warmText: '#B3401F', mapSea: '#B9DDF3', mapLand: '#F6F3E7', mapLine: '#CDC5B2', mapGrat: 'rgba(58,110,150,.10)', mapPlate: '#E2572B', mapGlow: 'rgba(80,150,215,.20)', mapLabel: '#3D3852', mapLabelHalo: 'rgba(255,255,255,.88)' },
  dark: { bg: '#100C1D', surface: '#1A1530', surface2: '#251F3F', ink: '#F2EFFB', ink2: '#A9A2C6', line: '#2E2748', violet: '#8F74FF', onViolet: '#120C26', violetSoft: '#2A2152', violetText: '#BFAFFF', mint: '#3FE0AE', chart: '#3FE0AE', chartStrong: '#6DF0C6', chartHot: '#FF8A6B', tsuWarning: '#EE4266', tsuThreat: '#FF7A59', tsuWatch: '#F2B33D', tsuInk: '#1B1530', mintSoft: '#123A30', mintText: '#6DF0C6', warmSoft: '#3A2019', warmText: '#FFA088', mapSea: '#0C1E36', mapLand: '#173A2A', mapLine: '#4F7D68', mapGrat: 'rgba(255,255,255,.06)', mapPlate: '#BFAFFF', mapGlow: 'rgba(70,140,230,.24)', mapLabel: '#E4DFF5', mapLabelHalo: 'rgba(12,10,24,.82)' },
} as const;

// Magnitude scale: [min magnitude, fill, text]
export const MAG_SCALE: [number, string, string][] = [
  [7, '#B5179E', '#FFFFFF'], [6, '#EE4266', '#FFFFFF'], [5, '#FF7A59', '#1B1530'],
  [4, '#FFA94D', '#1B1530'], [3, '#F7CF4A', '#1B1530'], [-99, '#86DCC4', '#1B1530'],
];
export function magColor(m: number) {
  const row = MAG_SCALE.find(r => m >= r[0]) ?? MAG_SCALE[MAG_SCALE.length - 1];
  return { fill: row[1], text: row[2] };
}
/** Map and globe markers in light mode: the same bands as MAG_SCALE (same order), in stronger, more saturated colours so
 *  they stand out on the light map and street tiles. Dark mode uses the MAG_SCALE fills. Mirrored in globals.css as
 *  --mag-0 … --mag-5 (light values in :root, MAG_SCALE fills in the dark blocks). */
export const MAG_MARKER_LIGHT = ['#8E0F8C', '#C8102E', '#E8411F', '#F27A00', '#E2A400', '#139E73'];
/** Text on MAG_MARKER_LIGHT fills (globals.css --mag-ink-N, light mode): the higher-contrast of white or ink. */
export const MAG_INK_LIGHT = ['#FFFFFF', '#FFFFFF', '#1B1530', '#1B1530', '#1B1530', '#1B1530'];
/** Band index into MAG_SCALE / MAG_MARKER_LIGHT for a magnitude (0 = 7+, 5 = below 3). */
export const magIndex = (m: number) => { const i = MAG_SCALE.findIndex(r => m >= r[0]); return i < 0 ? MAG_SCALE.length - 1 : i; };
/** Marker colour that follows light/dark mode (CSS variable; for SVG/HTML). */
export const magVar = (m: number) => `var(--mag-${magIndex(m)})`;
/** Text colour on a marker of that band (--mag-ink-N: the higher-contrast of white or ink on each fill). */
export const magInkVar = (m: number) => `var(--mag-ink-${magIndex(m)})`;
export const depthColor = (km: number) => (km < 70 ? '#2CCB9A' : km < 300 ? '#7B61FF' : '#B5179E');
/** Text colour on a depth-coloured pin (globe Depth mode): ink on the light green, white on violet and magenta. */
export const depthInk = (km: number) => (km < 70 ? '#1B1530' : '#FFFFFF');
export const MMI_COLORS = ['#86DCC4', '#86DCC4', '#F7CF4A', '#F7CF4A', '#FFA94D', '#FF7A59', '#EE4266', '#EE4266', '#B5179E', '#B5179E'];
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Science diagram palette (design: SCP) — light and dark steps for the canvas visuals.
export const SCIENCE_PALETTE = {
  light: { ink: '#1B1530', ink2: '#5E587A', a: '#6C4BF4', b: '#2CCB9A', warm: '#FF7A59', sand: '#EFC48E', ocean: '#5A44D6', sea: '#BDEBDD', floor: '#D8D0EE', mantle: '#F4EFFF', bands: ['#D9CFFB', '#F6DA9A', '#B5EBDA', '#F7C2B4', '#E6E0F6'], road: '#4A4560', lane: '#F6DA9A' },
  dark: { ink: '#F2EFFB', ink2: '#A9A2C6', a: '#8F74FF', b: '#3FE0AE', warm: '#FF8A6B', sand: '#A87F52', ocean: '#5B47D9', sea: '#1D4A42', floor: '#3A3260', mantle: '#221B3B', bands: ['#4A3D8A', '#7D6738', '#2F6E5C', '#7E4537', '#3A3260'], road: '#CFC8E8', lane: '#7D6738' },
};
export type SciencePalette = (typeof SCIENCE_PALETTE)['light'];

/** Automatic felt-map heat ramp (weak → strong surge of app activity after a quake). */
export const HEAT_COLORS = ['#FFD166', '#FFA94D', '#FF7A59', '#EE4266'] as const;
/** Felt cells without an intensity (automatic felt map areas no report covers): lib/felt-grid.ts. */
export const FELT_NEUTRAL = '#9AA3B5';
