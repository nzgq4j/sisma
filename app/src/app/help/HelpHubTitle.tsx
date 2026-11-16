'use client';
// The help home inside the help frame: intro, popular tasks, all topics and contact, in the reader's language once its
// help file has loaded (./help-i18n.ts), English as rendered by the server until then.
import Link from 'next/link';
import { HelpChrome, type NavTopic } from './HelpChrome';
import { useHelpTranslation } from './help-i18n';
import type { Hub } from './topics';
import s from './help.module.css';

export function HelpHub({ nav: navEn, hub: hubEn, mail, oldAnchors }: { nav: NavTopic[]; hub: Hub; mail: string; oldAnchors: React.ReactNode }) {
  const tr = useHelpTranslation();
  const hub = tr?.help.HUB ?? hubEn;
  const nav = tr ? tr.help.TOPICS.map(({ slug, icon, title, sub }) => ({ slug, icon, title, sub })) : navEn;
  const lang = tr ? tr.locale : 'en';
  return (
    <HelpChrome nav={navEn} title="">
      {oldAnchors}
      <div lang={lang}>
        <p className={s.lead}>{hub.lead}</p>

        <h2 className={s.groupH}>{hub.popularH}</h2>
        <ul className={s.popular}>
          {hub.popular.map(([href, icon, label]) => (
            <li key={label}><Link href={href}><span className="ms" aria-hidden="true">{icon}</span>{label}<span className="ms" aria-hidden="true">chevron_right</span></Link></li>
          ))}
        </ul>

        <h2 className={s.groupH}>{hub.allH}</h2>
        <ul className={s.toc}>
          {nav.map(t => (
            <li key={t.slug}><Link href={`/help/${t.slug}`}><span className="ms" aria-hidden="true">{t.icon}</span><span>{t.title}<small>{t.sub}</small></span></Link></li>
          ))}
        </ul>

        <div className={s.contact}>
          <span className="ms" aria-hidden="true">support_agent</span>
          <div style={{ flex: '1 1 240px' }}><p style={{ margin: 0 }}><strong>{hub.contactQ}</strong> {hub.contactP}</p></div>
          <a className={s.mail} href={`mailto:${mail}?subject=${encodeURIComponent('sisma help')}`}>{mail}</a>
        </div>
      </div>
    </HelpChrome>
  );
}
