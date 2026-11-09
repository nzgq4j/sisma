// Science article text in the reader's language: English in content/science.json (ids, visuals and the source text),
// translations of the intro, sections and preparedness kit in content/science/<locale>.json. A translation that is
// missing, or out of step with the English (different number of sections or kit items), falls back to English for
// that article; npm run check:i18n reports any such gap.
import science from '@/content/science.json';
import es from '@/content/science/es.json';
import ja from '@/content/science/ja.json';
import id from '@/content/science/id.json';
import tr from '@/content/science/tr.json';
import it from '@/content/science/it.json';
import pt from '@/content/science/pt.json';
import zh from '@/content/science/zh.json';
import fr from '@/content/science/fr.json';
import de from '@/content/science/de.json';
import type { Locale } from '@/i18n/I18nProvider';

export type ScienceArticle = (typeof science)[number] & { kit?: string[] };
interface Translation { intro: string; sections: { h: string; p: string }[]; kit?: string[] }

const TRANSLATIONS: Partial<Record<Locale, Record<string, Translation>>> = { es, ja, id, tr, it, pt, zh, fr, de };

/** The article's text in `locale` (or English), and the language it is actually in, for the lang attribute. */
export function localArticle(a: ScienceArticle, locale: Locale): ScienceArticle & { lang: Locale } {
  const t = TRANSLATIONS[locale]?.[a.id];
  const fits = t && t.sections.length === a.sections.length && (t.kit?.length ?? 0) === (a.kit?.length ?? 0);
  return fits ? { ...a, intro: t.intro, sections: t.sections, ...(a.kit ? { kit: t.kit } : {}), lang: locale } : { ...a, lang: 'en' };
}
