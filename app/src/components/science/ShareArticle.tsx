'use client';
// Share button for a science article: the article's card picture (public/og/science-<id>.jpg) with the title, the
// intro's first sentence (in the reader's language) and the link. The picture is sent as an image, as with earthquake
// share cards, because some apps (WhatsApp on iPhone) show a link preview while writing but send the text without it.
// Android app: the system share sheet (lib/native-share.ts); browsers: the Web Share API, with the picture where files
// can be shared, else the text alone; with no Web Share API the text is copied.
import { useEffect, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { canShareNatively, shareFileNatively, shareTextNatively } from '@/lib/native-share';
import { postWithLink } from '@/lib/share-text';
import styles from './science.module.css';

/** The first sentence of a paragraph (Latin and CJK full stops), or the whole of it. */
const firstSentence = (s: string) => s.match(/^.+?(?:[.!?](?=\s|$)|[。！？])/u)?.[0] ?? s;

export function ShareArticle({ id, title, intro }: { id: string; title: string; intro: string }) {
  const { t, m } = useT();
  const [copied, setCopied] = useState(false);
  const [card, setCard] = useState<{ id: string; file: File } | null>(null);

  // Fetched ahead of the tap: Safari opens the share menu only straight from the tap, with nothing awaited first.
  useEffect(() => {
    let alive = true;
    fetch(`/og/science-${id}.jpg`)
      .then(r => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then(b => { if (alive) setCard({ id, file: new File([b], `sisma-${id}.jpg`, { type: 'image/jpeg' }) }); })
      .catch(() => { /* share the text alone */ });
    return () => { alive = false; };
  }, [id]);

  const share = async () => {
    const url = `${location.origin}/app/science/${id}`;
    const text = postWithLink(`${title}\n${firstSentence(intro)}`, url);
    const file = card?.id === id ? card.file : null;
    if (canShareNatively()) {
      if (file && await shareFileNatively(file, text, t('share')) !== 'failed') return;
      await shareTextNatively(text, t('share'));
      return;
    }
    if (navigator.share) {
      const data: ShareData = file && navigator.canShare?.({ files: [file] }) ? { files: [file], title, text } : { title, text };
      try { await navigator.share(data); } catch { /* closed */ }
      return;
    }
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* no clipboard */ }
  };
  return (
    <button type="button" className={styles.shareBtn} onClick={() => void share()} aria-live="polite">
      <span className="ms" aria-hidden="true">{copied ? 'check' : 'ios_share'}</span>{copied ? m.sharecard.copied : t('share')}
    </button>
  );
}
