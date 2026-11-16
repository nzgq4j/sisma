// The help centre in the reader's language: ./i18n/<locale>.tsx (topics and hub text with the same structure as the
// English in ./topics.tsx). Each language is its own chunk, fetched only when that language is in use; the pages are
// built and indexed in English.
import { useEffect, useState } from 'react';
import { useT, type Locale } from '@/i18n/I18nProvider';
import type { Hub, Topic } from './topics';

export interface HelpBundle { TOPICS: Topic[]; HUB: Hub }

export async function loadHelp(locale: Locale): Promise<HelpBundle | null> {
  switch (locale) {
    case 'es': return import('./i18n/es');
    case 'fr': return import('./i18n/fr');
    case 'de': return import('./i18n/de');
    case 'it': return import('./i18n/it');
    case 'pt': return import('./i18n/pt');
    case 'ja': return import('./i18n/ja');
    case 'zh': return import('./i18n/zh');
    case 'id': return import('./i18n/id');
    case 'tr': return import('./i18n/tr');
    default: return null;
  }
}

/** The help text for the current language once loaded (null in English, while loading, or if it fails). */
export function useHelpTranslation(): { locale: Locale; help: HelpBundle } | null {
  const { locale } = useT();
  const [loaded, setLoaded] = useState<{ locale: Locale; help: HelpBundle } | null>(null);
  useEffect(() => {
    let alive = true;
    if (locale === 'en') return;
    loadHelp(locale).then(help => { if (alive && help) setLoaded({ locale, help }); }).catch(() => { /* English */ });
    return () => { alive = false; };
  }, [locale]);
  return loaded?.locale === locale ? loaded : null;
}
