// Every help translation (./i18n/<locale>.tsx) keeps the English structure (./topics.tsx): the same topics in the same
// order with the same icons, and in each the same anchors, links, screenshots, FAQ items, callout kinds and the same
// prices / trial / email expressions. Only the words change. Compared on the source text, topic by topic.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const LOCALES = ['es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'id', 'tr'];
const read = (f: string) => readFileSync(new URL(f, import.meta.url), 'utf8');

/** The source split into topics (from each `slug: '…'`), with the parts that must not change. */
function shape(src: string) {
  const all = (s: string, re: RegExp) => [...s.matchAll(re)].map(m => m[1] ?? m[0]);
  const topics = src.split(/(?=\n\s*\{\s*\n\s*slug: ')/).slice(1).map(t => ({
    slug: all(t, /slug: '([^']+)'/g)[0],
    icon: all(t, /icon: '([^']+)'/g)[0],
    ids: all(t, /\sid="([^"]+)"/g),
    links: all(t, /href=(?:"([^"]+)"|\{`([^`]+)`\})/g),
    shots: all(t, /<Shot src="([^"]+)"/g),
    faqs: all(t, /<Faq /g).length,
    callouts: all(t, /<Callout(?: kind="(\w+)")?>/g).map(k => k || 'tip'),
    legends: all(t, /<MagLegend/g).length,
    exprs: all(t, /\{(usd\([^)]*\)|TRIAL_DAYS|MAIL)\}/g).sort(),
  }));
  const hub = src.slice(src.indexOf('export const HUB'), src.indexOf('export const TOPICS'));
  return { topics, hubLinks: all(hub, /\['(\/help[^']*)', '([^']+)'/g) };
}

describe('help translations', () => {
  const en = shape(read('./topics.tsx'));
  it('English has its topics', () => expect(en.topics.length).toBeGreaterThan(10));
  for (const l of LOCALES) {
    it(`${l} matches the English structure`, () => {
      const src = read(`./i18n/${l}.tsx`);
      expect(src, `${l} is translated`).not.toContain("from '../topics';\nexport");
      expect(src).toContain('export const TOPICS');
      const tr = shape(src);
      expect(tr.topics.map(t => t.slug)).toEqual(en.topics.map(t => t.slug));
      tr.topics.forEach((t, i) => expect(t, `${l}: ${t.slug}`).toEqual(en.topics[i]));
      expect(tr.hubLinks).toEqual(en.hubLinks);
    });
  }
});
