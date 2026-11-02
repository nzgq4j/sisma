'use client';
// Live copy of the app inside a phone frame (design: <dc-import name="SismaApp" bare> at 0.8 scale).
// The frame loads the real /app route, so it always shows the current build with live data.
// Locale is shared through localStorage ('sisma.locale'), so the frame is remounted when it changes.
import styles from './site.module.css';
import { useT } from '@/i18n/I18nProvider';
import { SITE } from '@/lib/site';

export function AppPreview() {
  const { t, locale } = useT();
  return (
    <div className={styles.previewWrap}>
      <div className={styles.previewBox}>
        <div className={styles.previewScale}>
          <div className={styles.phone}>
            <div className={styles.statusBar} aria-hidden="true">
              <span>9:41</span>
              <span className={styles.statusIcons}>
                <span className={styles.ms}>signal_cellular_alt</span>
                <span className={styles.ms}>wifi</span>
                <span className={styles.ms}>battery_full</span>
              </span>
            </div>
            <iframe key={locale} src={SITE.appPath} title={t('app_tag')} className={styles.phoneFrame} />
          </div>
        </div>
      </div>
    </div>
  );
}
