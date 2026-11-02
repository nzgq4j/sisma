'use client';
// Article. Spec: design/SismaApp.dc.html (isArticle block): header, intro, the article's visual
// (animated canvas with modes, magnitude slider, live depth + Omori, or preparedness), sections, next topic.
// Article text is English (src/content/science.json); all interface text is translated.
import Link from 'next/link';
import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import science from '@/content/science.json';
import { useT } from '@/i18n/I18nProvider';
import { ScienceCanvas } from '@/components/science/ScienceCanvas';
import { DepthWidget, MagnitudeWidget, PrepWidget } from '@/components/science/Widgets';
import { VISUALS, type CanvasVisual } from '@/components/science/visuals';
import styles from '@/components/science/science.module.css';

type Article = (typeof science)[number] & { kit?: string[] };

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const i = science.findIndex(x => x.id === slug);
  if (i < 0) notFound();
  return <ArticleView key={slug} a={science[i] as Article} i={i} />;
}

function ArticleView({ a, i }: { a: Article; i: number }) {
  const { t, m } = useT();
  const [mode, setMode] = useState(a.modes[0]?.[0] ?? '');
  const next = science[(i + 1) % science.length], ni = (i + 1) % science.length;
  const isCanvas = a.visual in VISUALS;
  const caption = a.visual === 'tsunami' ? m.sci.cap.tsunami : m.sci.cap[mode as keyof typeof m.sci.cap] ?? '';
  return (
    <article className={styles.article}>
      <div className={styles.artHead}>
        <span className={`${styles.tile} ${styles.tileSm} ${styles[a.tone as 'violet' | 'mint' | 'warm']}`}><span className="ms" aria-hidden="true">{a.icon}</span></span>
        <span className={styles.muted}>{t('min_read', { n: a.mins })}</span>
      </div>
      <h1 className={styles.h1}>{m.sci_t[i]}</h1>
      <p className={styles.intro} lang="en">{a.intro}</p>

      {isCanvas && (
        <ScienceCanvas visual={a.visual as CanvasVisual} mode={mode} caption={caption}>
          {a.modes.length > 0 && (
            <div className={styles.modes} role="group" aria-label={m.sci_t[i]}>
              {a.modes.map(([id]) => (
                <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>{m.sci.modes[id as keyof typeof m.sci.modes] ?? id}</button>
              ))}
            </div>
          )}
        </ScienceCanvas>
      )}
      {a.visual === 'mag' && <MagnitudeWidget />}
      {a.visual === 'depth' && <DepthWidget />}
      {a.visual === 'prep' && <PrepWidget kit={a.kit ?? []} />}

      {a.sections.map(s => (
        <section key={s.h} className={styles.section} lang="en"><h2>{s.h}</h2><p>{s.p}</p></section>
      ))}
      <Link href={'/app/science/' + next.id} className={styles.next} aria-label={`${m.sci.next}: ${m.sci_t[ni]}`}>
        <span><small>{String(ni + 1).padStart(2, '0')}</small><strong>{m.sci_t[ni]}</strong></span>
        <span className="ms" aria-hidden="true">arrow_forward</span>
      </Link>
    </article>
  );
}
