// Building blocks of the help topics (English in ./topics.tsx, translations in ./i18n/<locale>.tsx): interface labels,
// phone screenshots, callouts, FAQ items and the magnitude legend. A screenshot shows the app in the language its text
// is in (HelpLang, set by HelpChrome; ./help-shot.tsx, the only client part): public/help/<name>-<theme>.webp in
// English, public/help/<locale>/… otherwise. The rest works on the server (English pages) and in the browser.
import type { ReactNode } from 'react';
import { MAG_SCALE } from '@/lib/theme';
import { SITE } from '@/lib/site';
import s from './help.module.css';

export const MAIL = SITE.legal.supportEmail;
export const usd = (n: number) => `US$${n.toFixed(2)}`;

export { HelpLang, Shot } from './help-shot';

export const Ui = ({ children }: { children: ReactNode }) => <span className={s.ui}>{children}</span>;

export function Callout({ kind = 'tip', children }: { kind?: 'tip' | 'note' | 'warn'; children: ReactNode }) {
  const icon = kind === 'tip' ? 'lightbulb' : kind === 'warn' ? 'warning' : 'info';
  return <div className={`${s.callout} ${s[kind]}`} role="note"><span className="ms" aria-hidden="true">{icon}</span><div>{children}</div></div>;
}

export function Faq({ q, children }: { q: string; children: ReactNode }) {
  return <details><summary>{q}</summary><div>{children}</div></details>;
}

/** Words for the magnitude legend: "Magnitude {range}", "{n} or more", "below {n}", "{a} to {b}". */
export interface LegendWords { label: string; magnitude: string; orMore: string; below: string; to: string }
const EN_LEGEND: LegendWords = { label: 'Magnitude colours', magnitude: 'Magnitude {range}', orMore: '{n} or more', below: 'below {n}', to: '{a} to {b}' };

export function MagLegend({ words = EN_LEGEND }: { words?: LegendWords }) {
  const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
  const bands = MAG_SCALE.map(([min, color, ink], i) => ({
    color, ink,
    label: i === 0 ? fill(words.orMore, { n: min }) : i === MAG_SCALE.length - 1 ? fill(words.below, { n: MAG_SCALE[i - 1][0] })
      : fill(words.to, { a: min, b: MAG_SCALE[i - 1][0] - 0.1 }),
    sample: i === MAG_SCALE.length - 1 ? '2.5' : (min + 0.4).toFixed(1),
  }));
  return (
    <ul className={s.legend} aria-label={words.label}>
      {bands.map(b => <li key={b.label}><span className={s.badge} style={{ background: b.color, color: b.ink }}>{b.sample}</span>{fill(words.magnitude, { range: b.label })}</li>)}
    </ul>
  );
}
