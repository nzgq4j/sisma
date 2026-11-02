'use client';
// Appearance: system / light / dark. Stored per device ('sisma.theme') and applied as <html data-theme> (globals.css
// defines both palettes); THEME_SCRIPT in the root layout applies it before first paint so there's no flash.
import { useSyncExternalStore } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';
const KEY = 'sisma.theme';
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

const subs = new Set<() => void>();
const read = (): ThemePref => { try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; } };

export function setTheme(t: ThemePref) {
  try { if (t === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch { /* storage unavailable */ }
  if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  subs.forEach(f => f());
}

export function useTheme(): ThemePref {
  return useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, read, () => 'system');
}
