// Messages for server code (share card, push notifications): English merged with the requested locale.
import en from './messages/en.json';
import type { Locale } from './I18nProvider';

export type Messages = typeof en;
export const SERVER_LOCALES: Locale[] = ['en', 'es', 'ja', 'id', 'tr', 'it', 'pt', 'zh', 'fr', 'de'];
export const asLocale = (v: unknown): Locale => (SERVER_LOCALES.includes(v as Locale) ? (v as Locale) : 'en');

export async function serverMessages(locale: Locale): Promise<Messages> {
  if (locale === 'en') return en;
  const mod = (await import(`./messages/${locale}.json`)) as { default: Messages };
  return { ...en, ...mod.default };
}
