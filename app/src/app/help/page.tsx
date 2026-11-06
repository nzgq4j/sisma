// Help centre home (/help): every topic as a card, the most asked-for tasks, and how to contact support. Each topic is
// its own page (app/help/[topic]/page.tsx, content in ./topics.tsx). Linked from Me → Account and the site footers.
import type { Metadata } from 'next';
import Link from 'next/link';
import { CARDS, cardMetadata } from '@/lib/seo';
import { HelpHubTitle } from './HelpHubTitle';
import { OldAnchorRedirect } from './HelpChrome';
import { MAIL, TOPICS } from './topics';
import s from './help.module.css';

export const metadata: Metadata = cardMetadata(CARDS.help);

const POPULAR: [string, string, string][] = [
  ['/help/account#password-reset', 'lock_reset', 'Reset a forgotten password'],
  ['/help/plus#cancel', 'event_busy', 'Cancel sisma+'],
  ['/help/troubleshooting', 'notifications_off', 'Not getting alerts'],
  ['/help/troubleshooting', 'credit_card', 'Paid but still on the free plan'],
  ['/help/account#delete-account', 'person_remove', 'Delete your account'],
  ['/help/share', 'ios_share', 'Share an earthquake with text'],
];

export default function HelpHome() {
  const nav = TOPICS.map(({ slug, icon, title, sub }) => ({ slug, icon, title, sub }));
  return (
    <HelpHubTitle nav={nav}>
      <OldAnchorRedirect slugs={nav.map(t => t.slug)} />
      <p className={s.lead}>Everything you need to use sisma on the website and in the Android app, with fixes for the most common problems.</p>

      <h2 className={s.groupH}>Popular</h2>
      <ul className={s.popular}>
        {POPULAR.map(([href, icon, label]) => (
          <li key={label}><Link href={href}><span className="ms" aria-hidden="true">{icon}</span>{label}<span className="ms" aria-hidden="true">chevron_right</span></Link></li>
        ))}
      </ul>

      <h2 className={s.groupH}>All topics</h2>
      <ul className={s.toc}>
        {nav.map(t => (
          <li key={t.slug}><Link href={`/help/${t.slug}`}><span className="ms" aria-hidden="true">{t.icon}</span><span>{t.title}<small>{t.sub}</small></span></Link></li>
        ))}
      </ul>

      <div className={s.contact}>
        <span className="ms" aria-hidden="true">support_agent</span>
        <div style={{ flex: '1 1 240px' }}><p style={{ margin: 0 }}><strong>Can’t find an answer?</strong> Write to us and we’ll help.</p></div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
    </HelpHubTitle>
  );
}
