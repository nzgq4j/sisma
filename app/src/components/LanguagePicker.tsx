'use client';
// Language selector in the style of the polar lights app: a "Language" sheet listing every language in its own
// script, with a check on the current one. Picking applies immediately and closes the sheet.
/* eslint-disable @next/next/no-img-element -- tiny bundled flag SVGs */
import { useState, type ReactNode } from 'react';
import { useT, LOCALES, type Locale } from '@/i18n/I18nProvider';
import { Sheet, SheetOptions } from './Sheet';
import styles from './sheet.module.css';

const FLAGS = LOCALES as { code: Locale; name: string; flag?: string }[];

/** Every language in its own script with its flag; picking applies immediately. Used in the sheet and in onboarding. */
export function LanguageOptions({ onPicked }: { onPicked?: () => void }) {
  const { locale, setLocale } = useT();
  return (
    <SheetOptions value={locale} onPick={l => { setLocale(l); onPicked?.(); }}
      options={FLAGS.map(l => ({
        value: l.code, label: l.name, lang: l.code,
        lead: l.flag ? <img src={`/flags/${l.flag}.svg`} alt="" width={26} height={26} className={styles.flag} /> : undefined,
      }))} />
  );
}

export function LanguageSheet({ open, onClose, className }: { open: boolean; onClose: () => void; className?: string }) {
  const { t } = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t('language')} className={className}>
      <LanguageOptions onPicked={onClose} />
    </Sheet>
  );
}

/** Wraps any trigger: renders it with an onClick that opens the language sheet. */
export function LanguagePicker({ children, sheetClassName }: { children: (open: () => void, current: { code: Locale; name: string; flag?: string }) => ReactNode; sheetClassName?: string }) {
  const { locale } = useT();
  const [open, setOpen] = useState(false);
  const current = FLAGS.find(l => l.code === locale) ?? FLAGS[0];
  return (
    <>
      {children(() => setOpen(true), current)}
      <LanguageSheet open={open} onClose={() => setOpen(false)} className={sheetClassName} />
    </>
  );
}
