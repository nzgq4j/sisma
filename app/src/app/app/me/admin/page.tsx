'use client';
// Me → Administration (profiles.is_admin only; every request is re-checked by /api/admin/*): automatic posts to Bluesky
// and X, one at a time (switch at the top) — the account, on/off, minimum magnitude, the last 24 hours of M4.5+ events
// with a preview of each post (card image, text, alt text) and "Post now", and the log of posts with links. Posting
// itself is in lib/bluesky.ts and lib/x.ts (every-minute alert job).
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useAccount } from '@/components/Account';
import { MagBadge } from '@/components/MagBadge';
import { Sheet, SheetOptions } from '@/components/Sheet';
import me from '../me.module.css';
import sub from '../subscription/subscription.module.css';
import styles from './admin.module.css';

interface Recent { id: string; time: number; mag: number; place: string; posted: boolean; next: boolean }
interface Post { quake_id: string; quake_time: string; mag: number; place: string | null; status: 'posting' | 'posted' | 'failed'; error: string | null; post_url: string | null; manual: boolean; created_at: string }
interface Connection { source: 'account' | 'env' | null; handle: string | null; connectedAt: string | null; lastError: string | null; envAvailable?: boolean; appReady?: boolean }
type Net = 'bluesky' | 'x';
/** Result of "Sign in with X", from the callback's redirect (?net=x&x=connected|error&code=…). */
type XReturn = { kind: 'ok' } | { kind: 'error'; code: string } | null;
interface Data { configured: boolean; connection: Connection; settings: { enabled: boolean; minMagnitude: number }; mags: number[]; recent: Recent[]; posts: Post[] }
interface Preview { text: string; alt: string; graphemes: number; max?: number; image: string }

export default function AdminPage() {
  const { m, locale, nf } = useT();
  const k = m.admin;
  const { ready, user, accessToken } = useAccount();
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'forbidden' | 'error'>('loading');
  const [magOpen, setMagOpen] = useState(false);
  const [sel, setSel] = useState<Recent | null>(null);
  const [net, setNet] = useState<Net>('bluesky');
  const [xReturn, setXReturn] = useState<XReturn>(null);
  // Coming back from X: open the X section with the sign-in result, then tidy the address.
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('net') !== 'x') return;
    const x = p.get('x');
    void Promise.resolve().then(() => { setNet('x'); setXReturn(x === 'connected' ? { kind: 'ok' } : x === 'error' ? { kind: 'error', code: p.get('code') ?? 'failed' } : null); });
    history.replaceState(null, '', location.pathname);
  }, []);
  const nf1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const when = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const token = await accessToken();
    return fetch(path, { ...init, headers: { ...(init?.headers ?? {}), 'content-type': 'application/json', authorization: `Bearer ${token}` } });
  }, [accessToken]);
  const load = useCallback(async () => {
    const r = await api(`/api/admin/${net}`).catch(() => null);
    if (!r) { setState('error'); return; }
    if (r.status === 403 || r.status === 401) { setState('forbidden'); return; }
    if (!r.ok) { setState('error'); return; }
    setData((await r.json()) as Data); setState('ok');
  }, [api, net]);
  useEffect(() => {
    if (!ready) return;
    void Promise.resolve().then(() => (user ? load() : setState('forbidden')));
  }, [ready, user, load]);

  const save = async (patch: { enabled?: boolean; minMagnitude?: number }) => {
    if (!data) return;
    setData({ ...data, settings: { ...data.settings, ...patch } });
    const r = await api(`/api/admin/${net}`, { method: 'PATCH', body: JSON.stringify(patch) }).catch(() => null);
    if (!r?.ok) setState('error');
    void load();
  };

  const pick = (n: Net) => { if (n === net) return; setNet(n); setData(null); setState('loading'); setSel(null); };
  const tabs = (
    <div className={me.seg} role="radiogroup" aria-label={k.networks}>
      {(['bluesky', 'x'] as const).map(n => <button key={n} type="button" role="radio" aria-checked={net === n} onClick={() => pick(n)}>{n === 'x' ? k.x_h : k.bsky_h}</button>)}
    </div>
  );
  const back = <Link href="/app/me" className={sub.back}><span className="ms" aria-hidden="true">arrow_back</span>{m.sub.back}</Link>;
  if (state === 'loading') return <div className={me.page}>{back}<h1 className={sub.h1}>{k.title}</h1>{tabs}</div>;
  if (state === 'forbidden') return <div className={me.page}>{back}<h1 className={sub.h1}>{k.title}</h1><p className={me.hint}>{k.forbidden}</p></div>;
  if (!data) return <div className={me.page}>{back}<h1 className={sub.h1}>{k.title}</h1>{tabs}<p className={me.errLine} role="alert">{k.error}</p></div>;
  const s = data.settings;

  return (
    <div className={me.page}>
      {back}
      <h1 className={sub.h1}>{k.title}</h1>
      {tabs}

      <div className={styles.head}><span>{net === 'x' ? k.x_h : k.bsky_h}</span><span className={data.configured ? styles.ok : styles.warn}>{data.configured ? k.connected : k.not_connected}</span></div>
      {net === 'x'
        ? <XConnectionCard c={data.connection} api={api} back={xReturn} onChange={() => void load()} />
        : <ConnectionCard c={data.connection} api={api} onChange={() => void load()} />}
      <div className={me.card}>
        <button type="button" className={me.row} role="switch" aria-checked={s.enabled} onClick={() => void save({ enabled: !s.enabled })} disabled={!data.configured && !s.enabled}>
          <span className="ms" aria-hidden="true">campaign</span>
          <span className={me.grow}>{k.auto}<span className={me.rowHint}>{k.auto_p}</span></span>
          <span className={me.switch} aria-hidden="true"><span /></span>
        </button>
        <button type="button" className={me.row} aria-haspopup="dialog" onClick={() => setMagOpen(true)}>
          <span className="ms" aria-hidden="true">speed</span><span className={me.grow}>{k.min}</span>
          <span className={me.meta}>M{nf1.format(s.minMagnitude)}+</span><span className={`ms ${me.chev}`} aria-hidden="true">chevron_right</span>
        </button>
      </div>
      {state === 'error' && <p className={me.errLine} role="alert">{k.error}</p>}

      <div className={styles.head}><span>{k.recent}</span></div>
      {data.recent.length === 0 ? <p className={me.hint}>{k.recent_none}</p> : (
        <div className={styles.list}>
          {data.recent.map(q => (
            <button key={q.id} type="button" className={styles.item} onClick={() => setSel(q)} aria-haspopup="dialog">
              <MagBadge mag={q.mag} size={40} />
              <span className={styles.itemText}><strong>{q.place}</strong><span>{when.format(q.time)}</span></span>
              {q.posted ? <span className={styles.tag}>{k.posted}</span> : q.next ? <span className={`${styles.tag} ${styles.tagNext}`}>{k.next}</span> : null}
              <span className="ms" aria-hidden="true">chevron_right</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.head}><span>{k.log}</span></div>
      {data.posts.length === 0 ? <p className={me.hint}>{k.log_none}</p> : (
        <div className={styles.list}>
          {data.posts.map(p => (
            <div key={p.quake_id} className={styles.item}>
              <MagBadge mag={Number(p.mag)} size={40} />
              <span className={styles.itemText}>
                <strong>{p.place ?? p.quake_id}</strong>
                <span>{when.format(Date.parse(p.created_at))} · {p.manual ? k.by_hand : k.automatic} · {k[`st_${p.status}`]}</span>
                {p.status === 'failed' && p.error && <span className={styles.err}>{p.error}</span>}
              </span>
              {p.post_url && <a className={styles.open} href={p.post_url} target="_blank" rel="noopener noreferrer" aria-label={k.open_post}><span className="ms" aria-hidden="true">open_in_new</span></a>}
            </div>
          ))}
        </div>
      )}
      {(() => { const n = data.posts.filter(p => p.status === 'posted').length; return n > 0 && <p className={me.hint}>{n === 1 ? k.count_1 : k.count.replace('{n}', nf.format(n))}</p>; })()}

      <Sheet open={magOpen} onClose={() => setMagOpen(false)} title={k.min}>
        <SheetOptions value={String(s.minMagnitude)} onPick={v => { setMagOpen(false); void save({ minMagnitude: Number(v) }); }}
          options={data.mags.map(v => ({ value: String(v), label: `M${nf1.format(v)}+` }))} />
      </Sheet>
      <PreviewSheet net={net} q={sel} configured={data.configured} api={api} onClose={() => setSel(null)} onPosted={() => void load()} />
    </div>
  );
}

/** The Bluesky account posts go out from: sign in (app password, used once and never stored), check, sign out. */
function ConnectionCard({ c, api, onChange }: { c: Connection; api: (p: string, i?: RequestInit) => Promise<Response>; onChange: () => void }) {
  const { m, locale } = useT();
  const k = m.admin;
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [server, setServer] = useState('');
  const [other, setOther] = useState(false);
  const [st, setSt] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'error'; text?: string }>({ kind: 'idle' });
  const err = (code?: string) => (k as Record<string, string>)[`err_${code}`] ?? k.err_failed;

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !pw) { setSt({ kind: 'error', text: k.err_missing }); return; }
    setSt({ kind: 'busy' });
    const r = await api('/api/admin/bluesky/connect', { method: 'POST', body: JSON.stringify({ identifier: id, password: pw, service: other ? server : undefined }) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { handle?: string; error?: string };
    setPw('');
    if (r?.ok) { setSt({ kind: 'ok', text: k.check_ok.replace('{handle}', j.handle ?? '') }); onChange(); }
    else setSt({ kind: 'error', text: err(j.error) });
  };
  const check = async () => {
    setSt({ kind: 'busy' });
    const r = await api('/api/admin/bluesky/connect').catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { handle?: string; error?: string };
    setSt(r?.ok ? { kind: 'ok', text: k.check_ok.replace('{handle}', j.handle ?? '') } : { kind: 'error', text: err(j.error) });
    onChange();
  };
  const signOut = async () => {
    setSt({ kind: 'busy' });
    await api('/api/admin/bluesky/connect', { method: 'DELETE' }).catch(() => null);
    setSt({ kind: 'idle' }); onChange();
  };
  const since = c.connectedAt ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(c.connectedAt)) : null;
  const msg = st.text && <p className={st.kind === 'error' ? me.errLine : styles.done} role={st.kind === 'error' ? 'alert' : 'status'}>{st.text}</p>;

  if (c.source === 'account') {
    return (
      <div className={me.card}>
        <div className={me.row}>
          <span className="ms" aria-hidden="true">verified_user</span>
          <span className={me.grow}>{k.conn_account.replace('{handle}', c.handle ?? '')}{since && <span className={me.rowHint}>{k.since.replace('{date}', since)}</span>}</span>
        </div>
        {c.lastError && <p className={me.errLine} role="alert">{k.session_error.replace('{error}', c.lastError)}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => void check()} disabled={st.kind === 'busy'}>{k.check}</button>
          <button type="button" className={styles.secondary} onClick={() => void signOut()} disabled={st.kind === 'busy'}>{k.sign_out}</button>
        </div>
        {msg}
      </div>
    );
  }
  return (
    <form className={`${me.card} ${styles.login}`} onSubmit={e => void signIn(e)}>
      <div className={styles.loginH}>{k.login_h}</div>
      {c.source === 'env' && <p className={me.hint}>{k.conn_env}</p>}
      {c.lastError && <p className={me.errLine} role="alert">{k.session_error.replace('{error}', c.lastError)}</p>}
      <label className={styles.lbl}><span>{k.login_id}</span>
        <input className={styles.input} value={id} onChange={e => setId(e.target.value)} placeholder={k.login_id_ph} autoComplete="username" autoCapitalize="none" spellCheck={false} inputMode="email" /></label>
      <label className={styles.lbl}><span>{k.login_pw}</span>
        <input className={styles.input} type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder={k.login_pw_ph} autoComplete="current-password" /></label>
      {other
        ? <label className={styles.lbl}><span>{k.login_server}</span><input className={styles.input} value={server} onChange={e => setServer(e.target.value)} placeholder="https://bsky.social" inputMode="url" autoCapitalize="none" spellCheck={false} /><em>{k.login_server_hint}</em></label>
        : <button type="button" className={styles.linkBtn} onClick={() => setOther(true)}>{k.other_server}</button>}
      <p className={me.hint}>{k.login_hint}</p>
      <button type="submit" className={sub.primary} disabled={st.kind === 'busy'}><span className="ms" aria-hidden="true">login</span>{st.kind === 'busy' ? k.logging_in : k.login_btn}</button>
      {c.source === 'env' && <button type="button" className={styles.secondary} onClick={() => void check()} disabled={st.kind === 'busy'}>{k.check}</button>}
      {msg}
    </form>
  );
}

/**
 * The X account posts go out from: "Sign in with X" sends the administrator to x.com to sign in and approve (sisma
 * never sees the password) and back to this page; then check or sign out.
 */
function XConnectionCard({ c, api, back, onChange }: { c: Connection; api: (p: string, i?: RequestInit) => Promise<Response>; back: XReturn; onChange: () => void }) {
  const { m, locale } = useT();
  const k = m.admin;
  const errText = (code?: string) => (k as Record<string, string>)[`x_err_${code}`] ?? k.x_err_failed;
  const [st, setSt] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'error'; text?: string }>({ kind: 'idle' });
  const shown = st.kind === 'idle' && back ? (back.kind === 'ok' ? { kind: 'ok' as const, text: k.x_connected_ok } : { kind: 'error' as const, text: errText(back.code) }) : st;

  const signIn = async () => {
    setSt({ kind: 'busy', text: k.x_redirecting });
    const r = await api('/api/admin/x/connect', { method: 'POST' }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { url?: string; error?: string };
    if (r?.ok && j.url) { location.assign(j.url); return; }
    setSt({ kind: 'error', text: errText(j.error) });
  };
  const check = async () => {
    setSt({ kind: 'busy' });
    const r = await api('/api/admin/x/connect').catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { username?: string; error?: string };
    setSt(r?.ok ? { kind: 'ok', text: k.check_ok.replace('{handle}', j.username ?? '') } : { kind: 'error', text: errText(j.error) });
    onChange();
  };
  const signOut = async () => {
    setSt({ kind: 'busy' });
    await api('/api/admin/x/connect', { method: 'DELETE' }).catch(() => null);
    setSt({ kind: 'idle' }); onChange();
  };
  const since = c.connectedAt ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(c.connectedAt)) : null;
  const msg = shown.text && <p className={shown.kind === 'error' ? me.errLine : styles.done} role={shown.kind === 'error' ? 'alert' : 'status'}>{shown.text}</p>;

  if (c.source === 'account') {
    return (
      <div className={me.card}>
        <div className={me.row}>
          <span className="ms" aria-hidden="true">verified_user</span>
          <span className={me.grow}>{k.conn_account.replace('{handle}', c.handle ?? '')}{since && <span className={me.rowHint}>{k.since.replace('{date}', since)}</span>}</span>
        </div>
        {c.lastError && <p className={me.errLine} role="alert">{k.session_error.replace('{error}', c.lastError)}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => void check()} disabled={st.kind === 'busy'}>{k.check}</button>
          <button type="button" className={styles.secondary} onClick={() => void signOut()} disabled={st.kind === 'busy'}>{k.sign_out}</button>
        </div>
        {msg}
      </div>
    );
  }
  return (
    <div className={`${me.card} ${styles.login}`}>
      <div className={styles.loginH}>{k.x_login_h}</div>
      {c.lastError && <p className={me.errLine} role="alert">{k.session_error.replace('{error}', c.lastError)}</p>}
      {c.appReady === false
        ? <p className={me.hint}>{k.x_app_missing}</p>
        : <>
            <p className={me.hint}>{k.x_login_hint}</p>
            <button type="button" className={sub.primary} onClick={() => void signIn()} disabled={st.kind === 'busy'}>
              <span className="ms" aria-hidden="true">login</span>{st.kind === 'busy' ? k.x_redirecting : k.x_login_btn}
            </button>
          </>}
      <p className={me.hint}>{k.x_cost}</p>
      {shown.kind !== 'busy' && msg}
    </div>
  );
}

function PreviewSheet({ net, q, configured, api, onClose, onPosted }: {
  net: Net; q: Recent | null; configured: boolean; api: (p: string, i?: RequestInit) => Promise<Response>; onClose: () => void; onPosted: () => void;
}) {
  const { m } = useT();
  const k = m.admin;
  const [p, setP] = useState<Preview | 'failed' | null>(null);
  const [st, setSt] = useState<{ kind: 'idle' | 'busy' | 'done' | 'failed'; url?: string; error?: string }>({ kind: 'idle' });
  useEffect(() => {
    if (!q) return;
    let alive = true;
    void Promise.resolve().then(() => { setP(null); setSt({ kind: 'idle' }); });
    // A failed request shows a message instead of loading for ever.
    void api(`/api/admin/${net}/preview?id=${encodeURIComponent(q.id)}`).then(r => (r.ok ? r.json() : 'failed')).catch(() => 'failed')
      .then(j => { if (alive) setP(j as Preview | 'failed'); });
    return () => { alive = false; };
  }, [q, api, net]);
  const post = async () => {
    if (!q) return;
    setSt({ kind: 'busy' });
    const r = await api(`/api/admin/${net}/post`, { method: 'POST', body: JSON.stringify({ id: q.id }) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { url?: string; error?: string };
    if (r?.ok) { setSt({ kind: 'done', url: j.url }); onPosted(); }
    else setSt({ kind: 'failed', error: j.error === 'already_posted' ? k.already : (j.error ?? '') });
  };
  return (
    <Sheet open={!!q} onClose={onClose} title={k.preview}>
      {!p ? <p className={me.hint}>{k.loading}</p> : p === 'failed' ? <p className={me.errLine} role="alert">{k.preview_failed}</p> : (
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG */}
          <img src={p.image} alt={p.alt} className={styles.card} width={1080} height={1350} />
          <div className={styles.field}><span>{k.text_h}</span><pre className={styles.text}>{p.text}</pre><em>{k.chars.replace('{n}', String(p.graphemes)).replace('{max}', String(p.max ?? 300))}</em></div>
          <div className={styles.field}><span>{k.alt_h}</span><p className={styles.text}>{p.alt}</p></div>
          {st.kind === 'done'
            ? <p className={styles.done} role="status">{net === 'x' ? k.x_posted_ok : k.posted_ok} {st.url && <a href={st.url} target="_blank" rel="noopener noreferrer">{k.open_post}</a>}</p>
            : <button type="button" className={sub.primary} onClick={() => void post()} disabled={!configured || st.kind === 'busy' || (q?.posted ?? false)}>
                <span className="ms" aria-hidden="true">send</span>{st.kind === 'busy' ? k.posting : q?.posted ? k.posted : k.post_now}
              </button>}
          {st.kind === 'failed' && <p className={me.errLine} role="alert">{k.post_failed.replace('{error}', st.error ?? '')}</p>}
          {!configured && <p className={me.hint}>{net === 'x' ? k.x_not_configured : k.not_configured}</p>}
        </div>
      )}
    </Sheet>
  );
}
