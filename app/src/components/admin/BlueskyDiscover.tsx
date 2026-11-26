'use client';
// Me → Administration → Discover (lib/bluesky-discover.ts; /api/admin/bluesky/discover re-checks the administrator):
// geoscience posts by others on Bluesky, found with sisma's signed-in account, newest first. The saved search terms
// (hashtags and words) are edited in a sheet. Each post can be liked, reposted and its author followed, only by tapping
// the button, and each of those can be undone the same way. Nothing runs on its own.
/* eslint-disable @next/next/no-img-element -- Bluesky avatars and image thumbnails (remote, small) */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { Sheet } from '@/components/Sheet';
import { useAdminApi } from '@/components/admin/LibraryBluesky';
import type { DiscoverAction, FoundPost } from '@/lib/bluesky-discover';
import me from '@/app/app/me/me.module.css';
import sub from '@/app/app/me/subscription/subscription.module.css';
import styles from '@/app/app/me/admin/admin.module.css';

type Result = { posts: FoundPost[]; failed: string[]; at: number };

export function BlueskyDiscover() {
  const { m, locale, nf } = useT();
  const k = m.admin;
  const api = useAdminApi();
  const [terms, setTerms] = useState<string[] | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);

  useEffect(() => {
    void api('/api/admin/bluesky/discover?terms=1').then(r => (r.ok ? r.json() : null)).then((j: { terms?: string[] } | null) => setTerms(j?.terms ?? [])).catch(() => setTerms([]));
  }, [api]);

  // A new search starts from an empty list, so it's clear the results are fresh.
  const search = useCallback(async () => {
    setBusy(true); setErr(null); setRes(null);
    const r = await api('/api/admin/bluesky/discover').catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { posts?: FoundPost[]; failed?: string[]; terms?: string[]; error?: string };
    if (j.terms) setTerms(j.terms);
    if (r?.ok && j.posts) setRes({ posts: j.posts, failed: j.failed ?? [], at: Date.now() });
    else setErr(j.error === 'not_configured' ? k.err_not_configured : k.post_failed.replace('{error}', j.error ?? ''));
    setBusy(false);
  }, [api, k]);

  /** Replaces one post in the list (after an action). */
  const update = (uri: string, fn: (p: FoundPost) => FoundPost) => setRes(r => (r ? { ...r, posts: r.posts.map(p => (p.uri === uri ? fn(p) : p)) } : r));
  /** Same author on several posts: follow state follows the account. */
  const updateAuthor = (did: string, following: string | null) => setRes(r => (r ? { ...r, posts: r.posts.map(p => (p.author.did === did ? { ...p, author: { ...p.author, following } } : p)) } : r));

  return (
    <>
      <div className={styles.head}><span>{k.disc_h}</span></div>
      <p className={me.hint}>{k.disc_p}</p>
      <div className={me.card}>
        <button type="button" className={me.row} aria-haspopup="dialog" onClick={() => setTermsOpen(true)} disabled={!terms}>
          <span className="ms" aria-hidden="true">tag</span>
          <span className={me.grow}>{k.disc_terms}<span className={me.rowHint}>{terms ? terms.slice(0, 6).join(' · ') + (terms.length > 6 ? ' …' : '') : k.loading}</span></span>
          <span className={me.meta}>{terms ? nf.format(terms.length) : ''}</span>
          <span className={`ms ${me.chev}`} aria-hidden="true">chevron_right</span>
        </button>
      </div>
      <div className={styles.actions}>
        <button type="button" className={sub.primary} style={{ flex: 2 }} onClick={() => void search()} disabled={busy || !terms?.length}>
          <span className="ms" aria-hidden="true">{res ? 'refresh' : 'travel_explore'}</span>{busy ? k.disc_searching : res ? k.disc_again : k.disc_search}
        </button>
        {(res || err) && !busy && (
          <button type="button" className={styles.secondary} onClick={() => { setRes(null); setErr(null); }}>{k.disc_clear}</button>
        )}
      </div>
      {err && <p className={me.errLine} role="alert">{err}</p>}
      {res && (
        <>
          <p className={me.hint} role="status">
            {res.posts.length ? k.disc_found.replace('{n}', nf.format(res.posts.length)) : k.disc_none}
            {' '}{k.disc_at.replace('{time}', new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(res.at))}
            {res.failed.length > 0 && <> {k.disc_failed_terms.replace('{terms}', res.failed.join(', '))}</>}
          </p>
          {res.posts.length > 0 && (
            <ul className={styles.found}>
              {res.posts.map(p => <FoundRow key={p.uri} p={p} locale={locale} onPost={fn => update(p.uri, fn)} onAuthor={updateAuthor} />)}
            </ul>
          )}
        </>
      )}
      {/* New terms: the old results no longer match them. */}
      <TermsSheet open={termsOpen} terms={terms ?? []} onClose={() => setTermsOpen(false)} onSaved={t => { setTerms(t); setRes(null); }} />
    </>
  );
}

function FoundRow({ p, locale, onPost, onAuthor }: { p: FoundPost; locale: string; onPost: (fn: (p: FoundPost) => FoundPost) => void; onAuthor: (did: string, following: string | null) => void }) {
  const { m, nf } = useT();
  const k = m.admin;
  const api = useAdminApi();
  const [pending, setPending] = useState<DiscoverAction | null>(null);
  const [fail, setFail] = useState<string | null>(null);
  const when = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(Date.parse(p.createdAt));

  const act = async (action: DiscoverAction) => {
    setPending(action); setFail(null);
    const body = action === 'like' || action === 'repost' ? { uri: p.uri, cid: p.cid }
      : action === 'follow' ? { did: p.author.did }
        : { record: action === 'unlike' ? p.liked : action === 'unrepost' ? p.reposted : p.author.following };
    const r = await api('/api/admin/bluesky/discover', { method: 'POST', body: JSON.stringify({ action, ...body }) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { record?: string | null; error?: string };
    setPending(null);
    if (!r?.ok) { setFail(k.disc_action_failed.replace('{error}', j.error ?? '')); return; }
    const rec = j.record ?? null;
    if (action === 'like') onPost(x => ({ ...x, liked: rec, likes: x.likes + 1 }));
    if (action === 'unlike') onPost(x => ({ ...x, liked: null, likes: Math.max(0, x.likes - 1) }));
    if (action === 'repost') onPost(x => ({ ...x, reposted: rec, reposts: x.reposts + 1 }));
    if (action === 'unrepost') onPost(x => ({ ...x, reposted: null, reposts: Math.max(0, x.reposts - 1) }));
    if (action === 'follow') onAuthor(p.author.did, rec);
    if (action === 'unfollow') onAuthor(p.author.did, null);
  };

  return (
    <li className={styles.foundItem}>
      <div className={styles.foundHead}>
        {p.author.avatar ? <img src={p.author.avatar} alt="" className={styles.avatar} loading="lazy" /> : <span className={styles.avatar} aria-hidden="true" />}
        <span className={styles.itemText}>
          <strong>{p.author.name ?? p.author.handle}</strong>
          <span>@{p.author.handle} · {when}{p.reply ? ` · ${k.disc_reply}` : ''}</span>
        </span>
        <a className={styles.open} href={p.url} target="_blank" rel="noopener noreferrer" aria-label={k.open_post}><span className="ms" aria-hidden="true">open_in_new</span></a>
      </div>
      {p.text && <p className={styles.foundText} lang={p.langs[0]}>{p.text}</p>}
      {p.image && <img src={p.image.thumb} alt={p.image.alt} className={styles.foundImg} loading="lazy" />}
      {p.link && <a className={styles.foundLink} href={p.link.uri} target="_blank" rel="noopener noreferrer">{p.link.title}</a>}
      <p className={styles.foundMeta}>
        {k.disc_counts.replace('{likes}', nf.format(p.likes)).replace('{reposts}', nf.format(p.reposts)).replace('{replies}', nf.format(p.replies))}
        {' · '}{k.disc_found_by.replace('{terms}', p.terms.join(', '))}
      </p>
      <div className={styles.foundActions}>
        <Toggle on={!!p.liked} busy={pending === 'like' || pending === 'unlike'} icon="favorite" label={p.liked ? k.disc_liked : k.disc_like} onClick={() => void act(p.liked ? 'unlike' : 'like')} />
        <Toggle on={!!p.reposted} busy={pending === 'repost' || pending === 'unrepost'} icon="repeat" label={p.reposted ? k.disc_reposted : k.disc_repost} onClick={() => void act(p.reposted ? 'unrepost' : 'repost')} />
        <Toggle on={!!p.author.following} busy={pending === 'follow' || pending === 'unfollow'} icon="person_add" label={p.author.following ? k.disc_following : k.disc_follow} onClick={() => void act(p.author.following ? 'unfollow' : 'follow')} />
      </div>
      {fail && <p className={me.errLine} role="alert">{fail}</p>}
    </li>
  );
}

function Toggle({ on, busy, icon, label, onClick }: { on: boolean; busy: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.toggle} aria-pressed={on} aria-busy={busy} disabled={busy} onClick={onClick}>
      <span className={`ms${on ? ' fill' : ''}`} aria-hidden="true">{icon}</span>{label}
    </button>
  );
}

function TermsSheet({ open, terms, onClose, onSaved }: { open: boolean; terms: string[]; onClose: () => void; onSaved: (t: string[]) => void }) {
  const { m } = useT();
  const k = m.admin;
  const api = useAdminApi();
  const [list, setList] = useState<string[]>(terms);
  const [draft, setDraft] = useState('');
  const [st, setSt] = useState<'idle' | 'busy' | 'saved' | 'failed'>('idle');
  // Starts from the saved terms each time the sheet opens (not when saving updates them, which would hide "Saved").
  const saved = useRef(terms);
  useEffect(() => { saved.current = terms; }, [terms]);
  useEffect(() => { if (open) void Promise.resolve().then(() => { setList(saved.current); setDraft(''); setSt('idle'); }); }, [open]);

  const add = () => {
    const t = draft.trim().replace(/\s+/g, ' ');
    if (!t || t === '#' || list.some(x => x.toLowerCase() === t.toLowerCase()) || list.length >= 20) { setDraft(''); return; }
    setList([...list, t]); setDraft(''); setSt('idle');
  };
  const save = async () => {
    setSt('busy');
    const r = await api('/api/admin/bluesky/discover', { method: 'PATCH', body: JSON.stringify({ terms: list }) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { terms?: string[] };
    if (r?.ok && j.terms) { onSaved(j.terms); setList(j.terms); setSt('saved'); } else setSt('failed');
  };

  return (
    <Sheet open={open} onClose={onClose} title={k.disc_terms}>
      <div className={styles.preview}>
        <p className={me.hint}>{k.disc_terms_p}</p>
        <ul className={styles.chips}>
          {list.map(t => (
            <li key={t}>
              <span>{t}</span>
              <button type="button" aria-label={k.disc_remove.replace('{term}', t)} onClick={() => { setList(list.filter(x => x !== t)); setSt('idle'); }}>
                <span className="ms" aria-hidden="true">close</span>
              </button>
            </li>
          ))}
        </ul>
        <form className={styles.addRow} onSubmit={e => { e.preventDefault(); add(); }}>
          <label className={styles.lbl} style={{ flex: 1 }}>
            <span className="sr-only">{k.disc_add_ph}</span>
            <input className={styles.input} value={draft} maxLength={64} placeholder={k.disc_add_ph} onChange={e => setDraft(e.target.value)} />
          </label>
          <button type="submit" className={styles.secondary} style={{ flex: 'none' }} disabled={!draft.trim() || list.length >= 20}>{k.disc_add}</button>
        </form>
        <button type="button" className={sub.primary} onClick={() => void save()} disabled={st === 'busy'}>
          <span className="ms" aria-hidden="true">{st === 'saved' ? 'check' : 'save'}</span>{st === 'saved' ? k.disc_saved : k.disc_save}
        </button>
        {st === 'failed' && <p className={me.errLine} role="alert">{k.error}</p>}
      </div>
    </Sheet>
  );
}
