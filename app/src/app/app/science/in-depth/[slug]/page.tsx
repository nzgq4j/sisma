'use client';
// In Depth article (lib/library.ts): header with reading time and Share, title, standfirst, updated date, sections,
// frequently asked questions, references (English, as published) and the next article. Text in the reader's
// language once its file has loaded (administrators also see a Bluesky button to post it); English is what the server renders and what search engines index.
import Link from 'next/link';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { LIBRARY, LIBRARY_PATH, libraryHref, localLibrary } from '@/lib/library';
import { formatDay, useLibraryTranslation } from '@/components/science/Library';
import { ShareArticle } from '@/components/science/ShareArticle';
import { LibraryBlueskyButton } from '@/components/admin/LibraryBluesky';
import styles from '@/components/science/science.module.css';

export default function LibraryArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const i = LIBRARY.findIndex(a => a.id === slug);
  if (i < 0) notFound();
  return <ArticleView key={slug} i={i} />;
}

function ArticleView({ i }: { i: number }) {
  const { t, m, locale } = useT();
  const tr = useLibraryTranslation();
  const a = localLibrary(LIBRARY[i], tr, locale);
  const next = localLibrary(LIBRARY[(i + 1) % LIBRARY.length], tr, locale);
  return (
    <article className={styles.article}>
      <div className={styles.artHead}>
        <span className={`${styles.tile} ${styles.tileSm} ${styles[a.tone as 'violet' | 'mint' | 'warm']}`}><span className="ms" aria-hidden="true">{a.icon}</span></span>
        <span className={styles.muted}>{m.library.title} · {t('min_read', { n: a.mins })}</span>
        <ShareArticle id={a.id} title={a.title} intro={a.dek} path={libraryHref(a.id)} image={`library-${a.id}`} />
        <LibraryBlueskyButton id={a.id} title={LIBRARY[i].title} />
      </div>
      <div lang={a.lang} className={styles.longform}>
        <h1 className={styles.h1}>{a.title}</h1>
        <p className={styles.intro}>{a.dek}</p>
        <p className={styles.dateline}><time dateTime={a.updated}>{m.library.updated.replace('{d}', formatDay(a.updated, locale))}</time></p>
        {a.sections.map(s => (
          <section key={s.h} className={styles.section}>
            <h2>{s.h}</h2>
            {s.p.map((p, j) => <p key={j}>{p}</p>)}
          </section>
        ))}
        <section className={styles.section}>
          <h2>{m.library.faq}</h2>
          <dl className={styles.faq}>
            {a.faq.map(f => (<div key={f.q}><dt>{f.q}</dt><dd>{f.a}</dd></div>))}
          </dl>
        </section>
      </div>
      <section className={styles.section} lang="en">
        <h2 lang={locale}>{m.library.refs}</h2>
        <ol className={styles.refs}>
          {a.refs.map(r => (
            <li key={r.text}><Reference text={r.text} url={r.url} /></li>
          ))}
        </ol>
      </section>
      {LIBRARY.length > 1 && (
        <Link href={libraryHref(next.id)} className={styles.next}>
          <span><small>{m.library.next}</small><strong lang={next.lang}>{next.title}</strong></span>
          <span className="ms" aria-hidden="true">arrow_forward</span>
        </Link>
      )}
      <Link href={LIBRARY_PATH} className={styles.next}>
        <span><strong>{m.library.all}</strong></span>
        <span className="ms" aria-hidden="true">arrow_forward</span>
      </Link>
    </article>
  );
}

/** A bibliography entry with its URL (where the text contains it) as a link. */
function Reference({ text, url }: { text: string; url: string | null }) {
  const at = url ? text.indexOf(url) : -1;
  if (!url) return <>{text}</>;
  const link = <a href={url} target="_blank" rel="noopener noreferrer">{url.replace(/^https?:\/\//, '')}</a>;
  return at < 0 ? <>{text} {link}</> : <>{text.slice(0, at)}{link}{text.slice(at + url.length)}</>;
}
