'use client';
// Event marker style on the maps and globe (Me → Map markers): 'pins' (one size, magnitude written in the head) or
// 'circles' (size and colour by magnitude). Stored per device ('sisma.markers'); pins by default.
import { useSyncExternalStore } from 'react';
import type { MarkerStyle } from '@/lib/pin';

export type { MarkerStyle };
const KEY = 'sisma.markers';
const subs = new Set<() => void>();
const read = (): MarkerStyle => {
  try { return localStorage.getItem(KEY) === 'circles' ? 'circles' : 'pins'; } catch { return 'pins'; }
};
export function setMarkerStyle(s: MarkerStyle) {
  try { localStorage.setItem(KEY, s); } catch { /* storage unavailable */ }
  subs.forEach(f => f());
}
export const useMarkerStyle = () => useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, read, () => 'pins' as MarkerStyle);
