'use client';
// Share sheet for an event: previews the portrait share card (GET /api/share-card, 1080×1350 PNG), with an editable post
// text (description, link, hashtag) and image description (alt text), and offers Share image (Web Share API with files,
// where supported), Save image, Copy text and Copy alt text. Many apps (X, Facebook, Bluesky) drop shared text when an
// image comes with it, and none accept alt text this way, so sharing also copies the text for pasting.
/* eslint-disable @next/next/no-img-element -- generated PNG preview */
import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { useT } from '@/i18n/I18nProvider';
import { useUnits } from './Units';
import type { Quake } from '@/lib/quakes/types';
import styles from './dash/dash.module.css';

export const shareCardUrl = (id: string, locale: string, units: string, tz: string) =>
  `/api/share-card?${new URLSearchParams({ id, locale, units, tz })}`;

type Result = { key: string } & ({ s: 'ready'; file: File; url: string } | { s: 'failed' });
type State = { s: 'loading' } | Result;

export function ShareCardSheet({ q, open, onClose, path, text, alt }: {
  q: Quake; open: boolean; onClose: () => void; path: string;
  /** Opening line(s) of the post; the link and hashtag are added after it. */
  text: string;
  /** Default image description. */
  alt: string;
}) {
  const { m, locale } = useT();
  const units = useUnits();
  const key = `${q.id}|${locale}|${units}`;
  const [result, setResult] = useState<Result | null>(null);
  // Anything fetched for another event, language or unit setting counts as still loading.
  const state: State = result && result.key === key ? result : { s: 'loading' };
  const [copied, setCopied] = useState<null | 'text' | 'alt'>(null);
  // Editable drafts, started again from the defaults for each event, language and unit setting.
  const [draft, setDraft] = useState<{ key: string; text: string; alt: string } | null>(null);
  const post = draft?.key === key ? draft : { key, text: `${text}\n${typeof location === 'undefined' ? '' : location.origin + path}\n${m.sharecard.tag}`, alt };
  const edit = (patch: Partial<{ text: string; alt: string }>) => setDraft({ ...post, ...patch });

  useEffect(() => {
    if (!open) return;
    let alive = true, objectUrl = '';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    fetch(shareCardUrl(q.id, locale, units, tz))
      .then(r => (r.ok && r.headers.get('content-type')?.startsWith('image/') ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then(blob => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        const file = new File([blob], `sisma-M${q.mag.toFixed(1)}-${q.id.replace(/[^a-z0-9]+/gi, '-')}.png`, { type: 'image/png' });
        setResult({ key, s: 'ready', file, url: objectUrl });
      })
      .catch(() => { if (alive) setResult({ key, s: 'failed' }); });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, key, q.id, q.mag, locale, units]);

  const canShareFile = state.s === 'ready' && typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [state.file] });

  const copy = async (what: 'text' | 'alt') => {
    try {
      await navigator.clipboard.writeText(post[what]);
      setCopied(what); setTimeout(() => setCopied(c => (c === what ? null : c)), 2500);
    } catch {
      // No clipboard (older browsers): hand the text to the share sheet instead.
      if (what === 'text' && navigator.share) try { await navigator.share({ text: post.text }); } catch { /* cancelled */ }
    }
  };
  const shareImage = async () => {
    if (state.s !== 'ready') return;
    // Copy first: the receiving app may ignore the text that comes with the image.
    navigator.clipboard?.writeText(post.text).then(() => setCopied('text'), () => {});
    try { await navigator.share({ files: [state.file], title: 'sisma', text: post.text }); } catch { /* cancelled */ }
  };
  const saveImage = () => {
    if (state.s !== 'ready') return;
    const a = document.createElement('a');
    a.href = state.url; a.download = state.file.name; document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <Sheet open={open} onClose={onClose} title={m.sharecard.title}>
      <div className={styles.shareCard} aria-busy={state.s === 'loading'}>
        {state.s === 'ready' && <img src={state.url} alt={m.sharecard.alt} width={1080} height={1350} />}
        {state.s === 'loading' && <span className={styles.shareMsg}><span className="ms" aria-hidden="true">progress_activity</span>{m.sharecard.preparing}</span>}
        {state.s === 'failed' && <span className={styles.shareMsg} role="alert">{m.sharecard.failed}</span>}
      </div>
      <label className={styles.shareField}>
        <span>{m.sharecard.post_label}</span>
        <textarea value={post.text} onChange={e => edit({ text: e.target.value })} rows={5} spellCheck />
      </label>
      <label className={styles.shareField}>
        <span>{m.sharecard.alt_label}</span>
        <textarea value={post.alt} onChange={e => edit({ alt: e.target.value })} rows={4} spellCheck />
      </label>
      <div className={styles.shareActions}>
        {canShareFile && (
          <button type="button" className={styles.sharePrimary} onClick={shareImage}>
            <span className="ms" aria-hidden="true">ios_share</span>{m.sharecard.share_image}
          </button>
        )}
        <button type="button" className={styles.regionBtn} onClick={saveImage} disabled={state.s !== 'ready'}>
          <span className="ms" aria-hidden="true">download</span>{m.sharecard.save_image}
        </button>
        <button type="button" className={styles.regionBtn} onClick={() => void copy('text')} aria-live="polite">
          <span className="ms" aria-hidden="true">{copied === 'text' ? 'check' : 'content_copy'}</span>{copied === 'text' ? m.sharecard.copied : m.sharecard.copy_text}
        </button>
        <button type="button" className={`${styles.regionBtn} ${styles.shareWide}`} onClick={() => void copy('alt')} aria-live="polite">
          <span className="ms" aria-hidden="true">{copied === 'alt' ? 'check' : 'content_copy'}</span>{copied === 'alt' ? m.sharecard.copied : m.sharecard.copy_alt}
        </button>
      </div>
      <p className={styles.shareHint}>{m.sharecard.hint}</p>
    </Sheet>
  );
}
