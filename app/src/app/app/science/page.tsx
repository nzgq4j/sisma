'use client';
// Science list. Spec: design/SismaApp.dc.html (isSciList block).
import Link from 'next/link';
import science from '@/content/science.json';
import { localArticle } from '@/lib/science';
import { useT } from '@/i18n/I18nProvider';
import styles from '@/components/science/science.module.css';

export default function SciencePage() {
  const { m, t, locale } = useT();
  return (
    <div className={styles.list}>
      <p className={styles.lead}>{m.sci_sub}</p>
      <div className={styles.topics}>
        {science.map((a, i) => (
          <Link key={a.id} href={'/app/science/' + a.id} className={styles.topic}>
            <span className={`${styles.tile} ${styles[a.tone as 'violet' | 'mint' | 'warm']}`}><span className="ms" aria-hidden="true">{a.icon}</span></span>
            <span className={styles.topicText}>
              <span className={styles.meta}>{String(i + 1).padStart(2, '0')} · {t('min_read', { n: a.mins })}</span>
              <span className={styles.topicTitle}>{m.sci_t[i]}</span>
              <span className={styles.blurb} lang={localArticle(a, locale).lang}>{localArticle(a, locale).intro}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
