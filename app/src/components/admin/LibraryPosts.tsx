'use client';
// Me → Administration → In Depth posts (lib/library-posts.ts; /api/admin/library-posts re-checks the administrator):
// twice-daily automatic posting on/off, the time of the next post, progress through the article / language
// combinations this round, "Post now" (random unused combination, or a chosen article and language with a preview)
// and the recent posts. Same layout as the Play Store posts (components/admin/PromoPosts).
import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { Sheet, SheetOptions } from '@/components/Sheet';
import { useAdminApi } from '@/components/admin/LibraryBluesky';
import { Collapsible } from '@/components/admin/Collapsible';
import { useLibraryTranslation } from '@/components/science/Library';
import { libraryArticle, localLibrary } from '@/lib/library';
import me from '@/app/app/me/me.module.css';
import sub from '@/app/app/me/subscription/subscription.module.css';
import styles from '@/app/app/me/admin/admin.module.css';

interface Row { id: number; article_id: string; locale: string; status: 'posting' | 'posted' | 'failed'; error: string | null; post_url: string | null; manual: boolean; created_at: string }
interface Data { configured: boolean; settings: { enabled: boolean; nextAt: string | null; cycle: number }; progress: { posted: number; total: number }; articles: string[]; locales: string[]; used: string[]; recent: Row[] }
interface Preview { text: string; alt: string; image: string; graphemes: number }
const RANDOM = 'random';

export function LibraryPosts() {
  const { m, locale, nf } = useT();
  const k = m.admin;
  const api = useAdminApi();
  const tr = useLibraryTranslation();
  const [data, setData] = useState<Data | null | 'error'>(null);
  const [open, setOpen] = useState(false);
  const when = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const langName = (l: string) => { try { return new Intl.DisplayNames(locale, { type: 'language' }).of(l) ?? l; } catch { return l; } };
  const title = (id: string) => { const a = libraryArticle(id); return a ? localLibrary(a, tr, locale).title : id; };

  const load = useCallback(async () => {
    const r = await api('/api/admin/library-posts').catch(() => null);
    setData(r?.ok ? ((await r.json()) as Data) : 'error');
  }, [api]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const toggle = async () => {
    if (!data || data === 'error') return;
    const enabled = !data.settings.enabled;
    setData({ ...data, settings: { ...data.settings, enabled } });
    await api('/api/admin/library-posts', { method: 'PATCH', body: JSON.stringify({ enabled }) }).catch(() => null);
    void load();
  };

  const head = <div className={styles.head}><span>{k.libposts_h}</span></div>;
  if (!data) return <>{head}<p className={me.hint}>{k.loading}</p></>;
  if (data === 'error') return <>{head}<p className={me.errLine} role="alert">{k.libposts_not_set_up}</p></>;
  const s = data.settings;
  return (
    <>
      {head}
      <p className={me.hint}>{k.libposts_p}</p>
      <div className={me.card}>
        <button type="button" className={me.row} role="switch" aria-checked={s.enabled} onClick={() => void toggle()} disabled={!data.configured && !s.enabled}>
          <span className="ms" aria-hidden="true">event_repeat</span>
          <span className={me.grow}>{k.libposts_auto}<span className={me.rowHint}>{k.libposts_auto_p}</span></span>
          <span className={me.switch} aria-hidden="true"><span /></span>
        </button>
        <div className={me.row}>
          <span className="ms" aria-hidden="true">schedule</span><span className={me.grow}>{k.promo_next}</span>
          <span className={me.meta}>{s.enabled && s.nextAt ? when.format(Date.parse(s.nextAt)) : k.promo_off}</span>
        </div>
        <div className={me.row}>
          <span className="ms" aria-hidden="true">donut_large</span><span className={me.grow}>{k.promo_progress}</span>
          <span className={me.meta}>{k.promo_progress_v.replace('{n}', nf.format(data.progress.posted)).replace('{total}', nf.format(data.progress.total))}</span>
        </div>
        <button type="button" className={me.row} aria-haspopup="dialog" onClick={() => setOpen(true)} disabled={!data.configured}>
          <span className="ms" aria-hidden="true">send</span><span className={me.grow}>{k.promo_post_now}</span>
          <span className={`ms ${me.chev}`} aria-hidden="true">chevron_right</span>
        </button>
      </div>
      {!data.configured && <p className={me.hint}>{k.not_configured}</p>}

      <Collapsible icon="history" title={k.libposts_recent} count={nf.format(data.recent.length)}>
      {data.recent.length === 0 ? <p className={me.hint}>{k.libposts_none}</p> : (
        <div className={styles.list}>
          {data.recent.map(r => (
            <div key={r.id} className={styles.item}>
              <span className={styles.tile}><span className={styles.lang}>{r.locale.toUpperCase()}</span></span>
              <span className={styles.itemText}>
                <strong>{title(r.article_id)}</strong>
                <span>{langName(r.locale)} · {when.format(Date.parse(r.created_at))} · {r.manual ? k.by_hand : k.automatic} · {k[`st_${r.status}`]}</span>
                {r.status === 'failed' && r.error && <span className={styles.err}>{r.error}</span>}
              </span>
              {r.post_url && <a className={styles.open} href={r.post_url} target="_blank" rel="noopener noreferrer" aria-label={k.open_post}><span className="ms" aria-hidden="true">open_in_new</span></a>}
            </div>
          ))}
        </div>
      )}
      </Collapsible>

      <PostNowSheet open={open} data={data} title={title} langName={langName} onClose={() => setOpen(false)} onPosted={() => void load()} />
    </>
  );
}

function PostNowSheet({ open, data, title, langName, onClose, onPosted }: {
  open: boolean; data: Data; title: (id: string) => string; langName: (l: string) => string; onClose: () => void; onPosted: () => void;
}) {
  const { m } = useT();
  const k = m.admin;
  const api = useAdminApi();
  const [article, setArticle] = useState(RANDOM);
  const [lang, setLang] = useState(RANDOM);
  const [pick, setPick] = useState<'article' | 'lang' | null>(null);
  const [preview, setPreview] = useState<Preview | 'failed' | null>(null);
  const [st, setSt] = useState<{ kind: 'idle' | 'busy' | 'done' | 'failed'; url?: string; error?: string; posted?: string }>({ kind: 'idle' });
  const chosen = article !== RANDOM && lang !== RANDOM;

  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => { setSt({ kind: 'idle' }); setPick(null); });
  }, [open]);
  useEffect(() => {
    if (!open || !chosen) return;
    let alive = true;
    void Promise.resolve().then(() => setPreview(null));
    void api(`/api/admin/library-posts?article=${article}&locale=${lang}`).then(r => (r.ok ? r.json() : 'failed')).catch(() => 'failed')
      .then((j: Preview | 'failed') => { if (alive) setPreview(j); });
    return () => { alive = false; };
  }, [open, chosen, article, lang, api]);

  const send = async () => {
    setSt({ kind: 'busy' });
    const r = await api('/api/admin/library-posts', { method: 'POST', body: JSON.stringify({ article: article === RANDOM ? undefined : article, locale: lang === RANDOM ? undefined : lang }) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { url?: string; error?: string; article?: string; locale?: string };
    if (r?.ok) { setSt({ kind: 'done', url: j.url, posted: j.article && j.locale ? `${title(j.article)} · ${langName(j.locale)}` : undefined }); onPosted(); }
    else setSt({ kind: 'failed', error: (k as Record<string, string>)[`err_${j.error}`] ?? k.post_failed.replace('{error}', j.error ?? '') });
  };
  const used = new Set(data.used);
  const doneMark = (n: number) => (n > 0 ? `${n}/${data.locales.length}` : undefined);

  return (
    <Sheet open={open} onClose={onClose} title={k.libposts_post_h}>
      <div className={styles.preview}>
        <div className={me.card}>
          <button type="button" className={me.row} aria-expanded={pick === 'article'} onClick={() => setPick(pick === 'article' ? null : 'article')}>
            <span className="ms" aria-hidden="true">article</span><span className={me.grow}>{k.library_article}</span>
            <span className={me.meta}>{article === RANDOM ? k.promo_random : title(article)}</span><span className={`ms ${me.chev}`} aria-hidden="true">expand_more</span>
          </button>
          {pick === 'article' && <SheetOptions value={article} onPick={v => { setArticle(v); setPick(null); }}
            options={[{ value: RANDOM, label: k.promo_random }, ...data.articles.map(a => ({ value: a, label: <span className={styles.wrapLabel}>{title(a)}</span>, meta: doneMark(data.locales.filter(l => used.has(`${a}:${l}`)).length) }))]} />}
          <button type="button" className={me.row} aria-expanded={pick === 'lang'} onClick={() => setPick(pick === 'lang' ? null : 'lang')}>
            <span className="ms" aria-hidden="true">translate</span><span className={me.grow}>{k.promo_lang}</span>
            <span className={me.meta}>{lang === RANDOM ? k.promo_random : langName(lang)}</span><span className={`ms ${me.chev}`} aria-hidden="true">expand_more</span>
          </button>
          {pick === 'lang' && <SheetOptions value={lang} onPick={v => { setLang(v); setPick(null); }}
            options={[{ value: RANDOM, label: k.promo_random }, ...data.locales.map(l => ({ value: l, label: langName(l), meta: article !== RANDOM && used.has(`${article}:${l}`) ? k.promo_used : undefined }))]} />}
        </div>
        {!chosen ? <p className={me.hint}>{k.libposts_random_note}</p>
          : !preview ? <p className={me.hint}>{k.loading}</p>
          : preview === 'failed' ? <p className={me.errLine} role="alert">{k.error}</p>
          : <>
              {/* eslint-disable-next-line @next/next/no-img-element -- static share card */}
              <img src={preview.image} alt={preview.alt} className={styles.card} />
              <div className={styles.field}><span>{k.text_h}</span><pre className={styles.text} lang={lang}>{preview.text}</pre><em>{k.chars.replace('{n}', String(preview.graphemes))}</em></div>
              <div className={styles.field}><span>{k.alt_h}</span><p className={styles.text} lang={lang}>{preview.alt}</p></div>
              {used.has(`${article}:${lang}`) && <p className={me.hint}>{k.libposts_used_note}</p>}
            </>}
        {st.kind === 'done'
          ? <p className={styles.done} role="status">{k.posted_ok} {st.posted && <>({st.posted}) </>}{st.url && <a href={st.url} target="_blank" rel="noopener noreferrer">{k.open_post}</a>}</p>
          : <button type="button" className={sub.primary} onClick={() => void send()} disabled={st.kind === 'busy' || !data.configured}>
              <span className="ms" aria-hidden="true">send</span>{st.kind === 'busy' ? k.posting : k.post_now}
            </button>}
        {st.kind === 'failed' && <p className={me.errLine} role="alert">{st.error}</p>}
        <p className={me.hint}>{k.libposts_counts_note}</p>
      </div>
    </Sheet>
  );
}
