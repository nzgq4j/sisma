'use client';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import locales from './locales.json';
import en from './messages/en.json';

export type Locale = 'en' | 'es' | 'ja' | 'id' | 'tr' | 'it' | 'pt' | 'zh' | 'fr' | 'de';
export const LOCALES = locales as { code: Locale; name: string }[];
type Messages = typeof en;

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import('./messages/en.json'), es: () => import('./messages/es.json'), ja: () => import('./messages/ja.json'),
  id: () => import('./messages/id.json'), tr: () => import('./messages/tr.json'), it: () => import('./messages/it.json'),
  pt: () => import('./messages/pt.json'), zh: () => import('./messages/zh.json'), fr: () => import('./messages/fr.json'), de: () => import('./messages/de.json'),
};

function detect(): Locale {
  const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem('sisma.locale') as Locale | null) : null;
  if (saved && saved in loaders) return saved;
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
  return (nav in loaders ? nav : 'en') as Locale;
}

const Ctx = createContext<{ locale: Locale; m: Messages; setLocale: (l: Locale) => void }>({ locale: 'en', m: en, setLocale: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [m, setM] = useState<Messages>(en);
  useEffect(() => { setLocaleState(detect()); }, []);
  useEffect(() => {
    loaders[locale]().then(mod => setM({ ...en, ...mod.default, web: { ...en.web, ...mod.default.web } }));
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(() => ({ locale, m, setLocale: (l: Locale) => { localStorage.setItem('sisma.locale', l); setLocaleState(l); } }), [locale, m]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const { m, locale, setLocale } = useContext(Ctx);
  const t = (key: keyof Messages, vars?: Record<string, string | number>) =>
    String(m[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? ''));
  return { t, m, locale, setLocale, nf: new Intl.NumberFormat(locale) };
}
