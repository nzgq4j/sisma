'use client';
// In Depth: the library of long-form science articles (lib/library.ts), as cards like the Science list.
import { useT } from '@/i18n/I18nProvider';
import { LibraryCards } from '@/components/science/Library';
import styles from '@/components/science/science.module.css';

export default function LibraryPage() {
  const { m } = useT();
  return (
    <div className={styles.list}>
      <h1 className={styles.h1}>{m.library.title}</h1>
      <p className={styles.lead}>{m.library.sub}</p>
      <LibraryCards />
    </div>
  );
}
