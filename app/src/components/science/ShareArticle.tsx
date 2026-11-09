'use client';
// Share button for a science article: the title, the intro's first sentence (in the reader's language) and the link.
// Android app: the system share sheet (lib/native-share.ts); browsers: the Web Share API, else the text is copied.
// Link previews show the article's social card (public/og/science-<id>.jpg).
import { useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { canShareNatively, shareTextNatively } from '@/lib/native-share';
import { postWithLink } from '@/lib/share-text';
import styles from './science.module.css';

/** The first sentence of a paragraph (Latin and CJK full stops), or the whole of it. */
const firstSentence = (s: string) => s.match(/^.+?[.!?。！？](?=\s|$)/u)?.[0] ?? s;

export function ShareArticle({ id, title, intro }: { id: string; title: string; intro: string }) {
  const { t, m } = useT();
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${location.origin}/app/science/${id}`;
    const text = postWithLink(`${title}\n${firstSentence(intro)}`, url);
    if (canShareNatively()) { await shareTextNatively(text, t('share')); return; }
    if (navigator.share) { try { await navigator.share({ title, text }); } catch { /* closed */ } return; }
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* no clipboard */ }
  };
  return (
    <button type="button" className={styles.shareBtn} onClick={() => void share()} aria-live="polite">
      <span className="ms" aria-hidden="true">{copied ? 'check' : 'ios_share'}</span>{copied ? m.sharecard.copied : t('share')}
    </button>
  );
}
