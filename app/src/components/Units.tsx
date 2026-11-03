'use client';
// Distance units (km / miles) for everything the app shows: distances, depths, alert radius. Stored per device
// ('sisma.units'); default miles in the US, Liberia and Myanmar, kilometres elsewhere. Data stays in km internally.
import { useSyncExternalStore } from 'react';
import { useT } from '@/i18n/I18nProvider';

import { KM_PER_MI, convertKmInText, type Units } from '@/lib/units';

export { KM_PER_MI, convertKmInText, type Units };
const KEY = 'sisma.units';
const subs = new Set<() => void>();

const defaultUnits = (): Units => {
  const region = (navigator.language.split('-')[1] ?? '').toUpperCase();
  return ['US', 'LR', 'MM'].includes(region) ? 'mi' : 'km';
};
const read = (): Units => {
  try { const v = localStorage.getItem(KEY); if (v === 'km' || v === 'mi') return v; } catch { /* storage unavailable */ }
  return defaultUnits();
};
export function setUnits(u: Units) {
  try { localStorage.setItem(KEY, u); } catch { /* storage unavailable */ }
  subs.forEach(f => f());
}
export const useUnits = () => useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, read, () => 'km' as Units);

/** Formatters in the chosen units: dist(1234) → "1,234 km" / "767 mi"; depth(10) → "10 km" / "6.2 mi". */
export function useDistance() {
  const units = useUnits();
  const { nf, locale } = useT();
  const one = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const conv = (km: number) => (units === 'mi' ? km / KM_PER_MI : km);
  return {
    units,
    unit: units === 'mi' ? 'mi' : 'km',
    dist: (km: number) => `${nf.format(Math.round(conv(km)))} ${units === 'mi' ? 'mi' : 'km'}`,
    /** Source place text with any "N km" converted, e.g. "50 mi SSE of Palekastro". */
    text: (s: string) => convertKmInText(s, units, v => one.format(v)),
    depth: (km: number) => { const v = conv(km); return `${v < 10 ? one.format(Math.round(v * 10) / 10) : nf.format(Math.round(v))} ${units === 'mi' ? 'mi' : 'km'}`; },
  };
}
