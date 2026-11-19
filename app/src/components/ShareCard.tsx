'use client';
// Share sheet for an event (Android app: native share via lib/native-share.ts): previews the portrait share card (GET /api/share-card, 1080×1350 PNG), with an editable post
// text (description, link, hashtag) and image description (alt text), and offers Share image (Web Share API with files,
// where supported; otherwise Share link with the post), Save image, Copy text and Copy alt text. Many apps (X, Facebook, Bluesky) drop shared text when an
// image comes with it, and none accept alt text this way, so sharing also copies the text for pasting.
/* eslint-disable @next/next/no-img-element -- generated PNG preview */
import { readFeltOn } from '@/lib/felt-pref';
import { copyText } from '@/lib/copy-text';
import { isFeltMark, type FeltMark } from '@/lib/felt-layers';
import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { useT } from '@/i18n/I18nProvider';
import { useUnits } from './Units';
import type { Quake } from '@/lib/quakes/types';
import { canShareNatively, shareFileNatively, shareTextNatively } from '@/lib/native-share';
import { postWithLink } from '@/lib/share-text';
import styles from './dash/dash.module.css';

/** The card image URL; felt=false leaves the felt squares out (the Felt maps switch is off: lib/felt-pref.ts). */
export const shareCardUrl = (id: string, locale: string, units: string, tz: string, felt = true) =>
  `/api/share-card?${new URLSearchParams({ id, locale, units, tz, ...(felt ? {} : { felt: '0' }) })}`;

type Result = { key: string } & ({ s: 'ready'; file: File; url: string; layers: FeltMark[] } | { s: 'failed' });
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
  // Description, hashtag, then the link last (lib/share-text.ts).
  // The image description also names the felt layers the card drew (X-Felt-Layers from the card response).
  const feltAlt = state.s === 'ready' && state.layers.length
    ? ' ' + (state.layers.includes('intensity')
      ? m.sharecard.alt_felt + (state.layers.includes('unknown') ? ' ' + m.sharecard.alt_unknown : '')
      : m.sharecard.alt_unknown_only) : '';
  const post = draft?.key === key ? draft : { key, text: postWithLink(text, typeof location === 'undefined' ? '' : location.origin + path, m.sharecard.tag), alt: alt + feltAlt };
  const [note, setNote] = useState<string | null>(null);
  const edit = (patch: Partial<{ text: string; alt: string }>) => setDraft({ ...post, ...patch });

  useEffect(() => {
    if (!open) return;
    let alive = true, objectUrl = '';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    fetch(shareCardUrl(q.id, locale, units, tz, readFeltOn()))
      .then(r => (r.ok && r.headers.get('content-type')?.startsWith('image/')
        ? r.blob().then(blob => ({ blob, layers: (r.headers.get('x-felt-layers') ?? '').split(',').filter(isFeltMark) }))
        : Promise.reject(new Error(String(r.status)))))
      .then(({ blob, layers }) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        const file = new File([blob], `sisma-M${q.mag.toFixed(1)}-${q.id.replace(/[^a-z0-9]+/gi, '-')}.png`, { type: 'image/png' });
        setResult({ key, s: 'ready', file, url: objectUrl, layers });
      })
      .catch(() => { if (alive) setResult({ key, s: 'failed' }); });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, key, q.id, q.mag, locale, units]);

  // Android app: native share sheet (lib/native-share.ts); browsers: Web Share API with files, where supported.
  const native = canShareNatively();
  const canShareFile = state.s === 'ready' && (native || (typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [state.file] })));
  // Where files can't be shared (or the image failed), share the post with its link instead.
  const canShareLink = !canShareFile && state.s !== 'loading' && (native || (typeof navigator !== 'undefined' && !!navigator.share));
  // Closing the share menu is not an error; anything else shows a short note.
  const failed = (e: unknown) => { if ((e as Error)?.name !== 'AbortError') setNote(m.sharecard.share_failed); };

  const copy = async (what: 'text' | 'alt') => {
    if (await copyText(post[what])) {
      setCopied(what); setTimeout(() => setCopied(c => (c === what ? null : c)), 2500);
    } else if (what === 'text' && navigator.share) {
      // No clipboard at all: hand the text to the share sheet instead.
      try { await navigator.share({ text: post.text }); } catch { /* cancelled */ }
    }
  };
  // Share image / Share link: the text is copied first and the copy is finished before the share menu opens, because
  // apps such as Bluesky drop the text that comes with an image, and on iPhone a copy still pending when the menu opens
  // is lost (lib/copy-text.ts). If iOS then refuses to open the menu (the tap counts as "used" after the wait), the
  // text is already copied and a second tap opens it.
  const copyThenShare = async (data: ShareData, nativeShare: () => Promise<'shared' | 'cancelled' | 'failed'>) => {
    setNote(null);
    const copied = await copyText(post.text);
    if (copied) setCopied('text');
    if (native) { if (await nativeShare() === 'failed') setNote(m.sharecard.share_failed); return; }
    try { await navigator.share(data); } catch (e) {
      if ((e as Error)?.name === 'NotAllowedError' && copied) setNote(m.sharecard.tap_again);
      else failed(e);
    }
  };
  const shareImage = async () => {
    if (state.s !== 'ready') return;
    await copyThenShare({ files: [state.file], title: 'sisma', text: post.text }, () => shareFileNatively(state.file, post.text, m.sharecard.title));
  };
  const shareLink = () => copyThenShare({ title: 'sisma', text: post.text }, () => shareTextNatively(post.text, m.sharecard.title));
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
        {canShareLink && (
          <button type="button" className={styles.sharePrimary} onClick={shareLink}>
            <span className="ms" aria-hidden="true">share</span>{m.sharecard.share_link}
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
      {note && <p className={styles.shareHint} role="alert">{note}</p>}
      <p className={styles.shareHint}>{m.sharecard.hint}</p>
    </Sheet>
  );
}
