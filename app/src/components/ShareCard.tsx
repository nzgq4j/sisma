'use client';
// Share sheet for an event: previews the portrait share card (GET /api/share-card, 1080×1350 PNG) and offers
// Share image (Web Share API with files, where supported), Save image and Copy link.
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

export function ShareCardSheet({ q, open, onClose, path, text }: { q: Quake; open: boolean; onClose: () => void; path: string; text: string }) {
  const { m, locale } = useT();
  const units = useUnits();
  const key = `${q.id}|${locale}|${units}`;
  const [result, setResult] = useState<Result | null>(null);
  // Anything fetched for another event, language or unit setting counts as still loading.
  const state: State = result && result.key === key ? result : { s: 'loading' };
  const [copied, setCopied] = useState(false);

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

  const link = () => `${location.origin}${path}`;
  const shareImage = async () => {
    if (state.s !== 'ready') return;
    try { await navigator.share({ files: [state.file], title: 'sisma', text: `${text}\n${link()}` }); } catch { /* cancelled */ }
  };
  const saveImage = () => {
    if (state.s !== 'ready') return;
    const a = document.createElement('a');
    a.href = state.url; a.download = state.file.name; document.body.appendChild(a); a.click(); a.remove();
  };
  const copyLink = async () => {
    try {
      if (!navigator.clipboard && navigator.share) { await navigator.share({ title: 'sisma', text, url: link() }); return; }
      await navigator.clipboard.writeText(`${text}\n${link()}`); setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable or share cancelled */ }
  };

  return (
    <Sheet open={open} onClose={onClose} title={m.sharecard.title}>
      <div className={styles.shareCard} aria-busy={state.s === 'loading'}>
        {state.s === 'ready' && <img src={state.url} alt={m.sharecard.alt} width={1080} height={1350} />}
        {state.s === 'loading' && <span className={styles.shareMsg}><span className="ms" aria-hidden="true">progress_activity</span>{m.sharecard.preparing}</span>}
        {state.s === 'failed' && <span className={styles.shareMsg} role="alert">{m.sharecard.failed}</span>}
      </div>
      <div className={styles.shareActions}>
        {canShareFile && (
          <button type="button" className={styles.sharePrimary} onClick={shareImage}>
            <span className="ms" aria-hidden="true">ios_share</span>{m.sharecard.share_image}
          </button>
        )}
        <button type="button" className={styles.regionBtn} onClick={saveImage} disabled={state.s !== 'ready'}>
          <span className="ms" aria-hidden="true">download</span>{m.sharecard.save_image}
        </button>
        <button type="button" className={styles.regionBtn} onClick={copyLink} aria-live="polite">
          <span className="ms" aria-hidden="true">{copied ? 'check' : 'link'}</span>{copied ? m.link_copied : m.sharecard.copy_link}
        </button>
      </div>
    </Sheet>
  );
}
