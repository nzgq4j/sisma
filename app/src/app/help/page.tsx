// Help centre home (/help): every topic as a card, the most asked-for tasks, and how to contact support. Each topic is
// its own page (app/help/[topic]/page.tsx, content in ./topics.tsx, translations in ./i18n/). Linked from Me → Account
// and the site footers. Rendered in English on the server; the reader's language takes over in the browser.
import type { Metadata } from 'next';
import { CARDS, cardMetadata } from '@/lib/seo';
import { HelpHub } from './HelpHubTitle';
import { OldAnchorRedirect } from './HelpChrome';
import { HUB, MAIL, TOPICS } from './topics';

export const metadata: Metadata = cardMetadata(CARDS.help);

export default function HelpHome() {
  const nav = TOPICS.map(({ slug, icon, title, sub }) => ({ slug, icon, title, sub }));
  return <HelpHub nav={nav} hub={HUB} mail={MAIL} oldAnchors={<OldAnchorRedirect slugs={nav.map(t => t.slug)} />} />;
}
