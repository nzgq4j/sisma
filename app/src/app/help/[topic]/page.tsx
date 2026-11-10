// One help topic (/help/<slug>): its article from ../topics.tsx inside the help frame, with its own title, description
// and canonical URL for search.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cardMetadata } from '@/lib/seo';
import { HelpChrome } from '../HelpChrome';
import { TOPICS, topicBySlug } from '../topics';
import { JsonLd, helpGraph } from '@/lib/structured-data';

const describe = (sub: string) => `${sub}. How to use sisma, with screenshots and troubleshooting.`;

export const dynamicParams = false;
export function generateStaticParams() {
  return TOPICS.map(t => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const t = topicBySlug((await params).topic);
  if (!t) return {};
  return cardMetadata({
    title: `${t.title} — sisma Help`, description: describe(t.sub),
    path: `/help/${t.slug}`, image: 'home', alt: 'sisma: live earthquakes worldwide', kicker: '', heading: '', sub: '',
  });
}

export default async function HelpTopic({ params }: { params: Promise<{ topic: string }> }) {
  const t = topicBySlug((await params).topic);
  if (!t) notFound();
  const nav = TOPICS.map(({ slug, icon, title, sub }) => ({ slug, icon, title, sub }));
  return <><JsonLd graph={helpGraph(t.slug, t.title, describe(t.sub))} /><HelpChrome nav={nav} current={t.slug} title={t.title}>{t.body}</HelpChrome></>;
}
