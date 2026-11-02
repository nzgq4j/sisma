// Tokens lifted from design/SismaApp.dc.html. globals.css mirrors these as CSS variables.
export const THEME = {
  light: { bg: '#F6F4FC', surface: '#FFFFFF', surface2: '#EFECF8', ink: '#1B1530', ink2: '#5E587A', line: '#E4E0F0', violet: '#6C4BF4', onViolet: '#FFFFFF', violetSoft: '#ECE7FF', violetText: '#5A38E0', mint: '#2CCB9A', mintSoft: '#D9F7EC', mintText: '#0A7558', warmSoft: '#FFE9E1', warmText: '#B3401F', mapSea: '#E3F4EE', mapLand: '#FFFFFF', mapLine: '#D3CCE8', mapGrat: 'rgba(108,75,244,.10)' },
  dark: { bg: '#100C1D', surface: '#1A1530', surface2: '#251F3F', ink: '#F2EFFB', ink2: '#A9A2C6', line: '#2E2748', violet: '#8F74FF', onViolet: '#120C26', violetSoft: '#2A2152', violetText: '#BFAFFF', mint: '#3FE0AE', mintSoft: '#123A30', mintText: '#6DF0C6', warmSoft: '#3A2019', warmText: '#FFA088', mapSea: '#10302C', mapLand: '#2A2346', mapLine: '#40376A', mapGrat: 'rgba(255,255,255,.06)' },
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
export const depthColor = (km: number) => (km < 70 ? '#2CCB9A' : km < 300 ? '#7B61FF' : '#B5179E');
export const MMI_COLORS = ['#86DCC4', '#86DCC4', '#F7CF4A', '#F7CF4A', '#FFA94D', '#FF7A59', '#EE4266', '#EE4266', '#B5179E', '#B5179E'];
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
