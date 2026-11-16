'use client';
// Posting an In Depth article to Bluesky by hand (administrators only; /api/admin/bluesky/library re-checks): a sheet
// with the article's share card, the suggested text (title, standfirst, link, hashtags) and alt text, both editable,
// with their character counts, and Post. Opened from Me → Administration and from the Bluesky button that
// administrators see on each article. Posts are in English, the account's language.
import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useAccount } from '@/components/Account';
import { Sheet } from '@/components/Sheet';
import { supabaseBrowser } from '@/lib/supabase-browser';
import sub from '@/app/app/me/subscription/subscription.module.css';
import me from '@/app/app/me/me.module.css';
import styles from '@/app/app/me/admin/admin.module.css';
import science from '@/components/science/science.module.css';

const MAX_TEXT = 300, MAX_ALT = 2000;
const count = (s: string) => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].length;

/** Whether the signed-in user is an administrator (profiles.is_admin); false while unknown or signed out. */
export function useIsAdmin(): boolean {
  const { user } = useAccount();
  const [admin, setAdmin] = useState<{ id: string; on: boolean } | null>(null);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    let alive = true;
    void sb.from('profiles').select('is_admin').eq('id', user.id).maybeSingle().then(({ data }) => { if (alive) setAdmin({ id: user.id, on: data?.is_admin === true }); });
    return () => { alive = false; };
  }, [user]);
  return !!user && admin !== null && admin.id === user.id && admin.on;
}

/** fetch with the signed-in user's token (the admin API checks it). */
export function useAdminApi() {
  const { accessToken } = useAccount();
  return useCallback(async (path: string, init?: RequestInit) => {
    const token = await accessToken();
    return fetch(path, { ...init, headers: { ...(init?.headers ?? {}), 'content-type': 'application/json', authorization: `Bearer ${token}` } });
  }, [accessToken]);
}

interface Draft { text: string; alt: string; url: string; image: string }

/** The post sheet for one article (`id`; null: closed). */
export function LibraryBlueskySheet({ id, title, onClose }: { id: string | null; title?: string; onClose: () => void }) {
  const { m, nf } = useT();
  const k = m.admin;
  const api = useAdminApi();
  const [draft, setDraft] = useState<Draft | 'failed' | null>(null);
  const [text, setText] = useState('');
  const [alt, setAlt] = useState('');
  const [st, setSt] = useState<{ kind: 'idle' | 'busy' | 'done' | 'failed'; url?: string; error?: string }>({ kind: 'idle' });
  useEffect(() => {
    if (!id) return;
    let alive = true;
    void Promise.resolve().then(() => { setDraft(null); setSt({ kind: 'idle' }); });
    void api(`/api/admin/bluesky/library?id=${encodeURIComponent(id)}`).then(r => (r.ok ? r.json() : 'failed')).catch(() => 'failed')
      .then((j: Draft | 'failed') => { if (!alive) return; setDraft(j); if (j !== 'failed') { setText(j.text); setAlt(j.alt); } });
    return () => { alive = false; };
  }, [id, api]);

  const n = count(text), na = count(alt);
  const tooLong = n > MAX_TEXT || na > MAX_ALT;
  const err = (code?: string) => {
    const known = (k as Record<string, string>)[`err_${code}`];
    return known ?? k.post_failed.replace('{error}', code ?? '');
  };
  const post = async () => {
    if (!id) return;
    setSt({ kind: 'busy' });
    const r = await api('/api/admin/bluesky/library', { method: 'POST', body: JSON.stringify({ id, text, alt }) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { url?: string; error?: string };
    setSt(r?.ok ? { kind: 'done', url: j.url } : { kind: 'failed', error: err(j.error ?? 'failed') });
  };
  const reset = () => { if (draft && draft !== 'failed') { setText(draft.text); setAlt(draft.alt); setSt({ kind: 'idle' }); } };

  return (
    <Sheet open={!!id} onClose={onClose} title={k.library_post}>
      {!draft ? <p className={me.hint}>{k.loading}</p> : draft === 'failed' ? <p className={me.errLine} role="alert">{k.error}</p> : (
        <div className={styles.preview}>
          {title && <p className={styles.libTitle} lang="en">{title}</p>}
          {/* eslint-disable-next-line @next/next/no-img-element -- static share card */}
          <img src={draft.image} alt={alt} className={`${styles.card} ${styles.cardWide}`} width={1200} height={630} />
          <label className={styles.field}><span>{k.text_h}</span>
            <textarea className={styles.textarea} value={text} onChange={e => setText(e.target.value)} rows={9} lang="en" spellCheck />
            <em className={n > MAX_TEXT ? styles.over : undefined}>{k.chars.replace('{n}', nf.format(n))}</em></label>
          <label className={styles.field}><span>{k.alt_h}</span>
            <textarea className={styles.textarea} value={alt} onChange={e => setAlt(e.target.value)} rows={6} lang="en" spellCheck />
            <em className={na > MAX_ALT ? styles.over : undefined}>{k.alt_chars.replace('{n}', nf.format(na))}</em></label>
          <p className={me.hint}>{k.library_hint}</p>
          {st.kind === 'done'
            ? <p className={styles.done} role="status">{k.posted_ok} {st.url && <a href={st.url} target="_blank" rel="noopener noreferrer">{k.open_post}</a>}</p>
            : <>
                <button type="button" className={sub.primary} onClick={() => void post()} disabled={st.kind === 'busy' || tooLong || !text.trim()}>
                  <span className="ms" aria-hidden="true">send</span>{st.kind === 'busy' ? k.posting : k.post_now}
                </button>
                <button type="button" className={styles.secondary} onClick={reset} disabled={st.kind === 'busy' || (text === draft.text && alt === draft.alt)}>{k.reset}</button>
              </>}
          {st.kind === 'failed' && <p className={me.errLine} role="alert">{st.error}</p>}
        </div>
      )}
    </Sheet>
  );
}

/** On an article, for administrators only: opens the post sheet. */
export function LibraryBlueskyButton({ id, title }: { id: string; title: string }) {
  const { m } = useT();
  const admin = useIsAdmin();
  const [open, setOpen] = useState(false);
  if (!admin) return null;
  return (
    <>
      <button type="button" className={`${science.shareBtn} ${science.iconBtn}`} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={m.admin.library_post} title={m.admin.library_post}>
        <span className="ms" aria-hidden="true">campaign</span>
      </button>
      <LibraryBlueskySheet id={open ? id : null} title={title} onClose={() => setOpen(false)} />
    </>
  );
}
