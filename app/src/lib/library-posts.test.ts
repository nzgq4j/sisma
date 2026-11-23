import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { BLUESKY_MAX_ALT, BLUESKY_MAX_GRAPHEMES, graphemes } from './bluesky';
import { LIBRARY } from './library';
import {
  allCombos, comboKey, draftLibraryPostIn, firstSlot, libraryPostImage, libraryPostTotal, libraryPostUrl, LIBRARY_POST_LOCALES,
  nextSlot, pickCombo, sameHalfDay,
} from './library-posts';

const enc = new TextEncoder();
const slice = (s: string, a: number, b: number) => new TextDecoder().decode(enc.encode(s).slice(a, b));

describe('In Depth posts content', () => {
  it('has every article in 10 languages', () => {
    expect(LIBRARY_POST_LOCALES.length).toBe(10);
    expect(allCombos()).toHaveLength(libraryPostTotal());
    expect(libraryPostTotal()).toBe(LIBRARY.length * 10);
  });
  for (const l of LIBRARY_POST_LOCALES) {
    it(`${l}: every post fits, links the article in ${l}, tags and describes its card`, () => {
      for (const a of LIBRARY) {
        const d = draftLibraryPostIn(a.id, l);
        const where = `${a.id}/${l}`;
        expect(graphemes(d.text), where).toBeLessThanOrEqual(BLUESKY_MAX_GRAPHEMES);
        expect(d.url).toBe(libraryPostUrl(a.id, l));
        expect(d.url.endsWith(l === 'en' ? a.id : `${a.id}?lang=${l}`), where).toBe(true);
        const link = d.facets.find(f => f.features[0].$type === 'app.bsky.richtext.facet#link');
        expect(link && slice(d.text, link.index.byteStart, link.index.byteEnd), `${where} link`).toBe(d.url);
        const tags = d.facets.flatMap(f => f.features[0].$type === 'app.bsky.richtext.facet#tag' ? [(f.features[0] as { tag: string }).tag] : []);
        expect(tags.length, `${where} tags`).toBe(5);
        expect(tags.slice(-2), `${where} feeds`).toEqual(['geosky', 'sciencesky']);
        expect(d.alt, `${where} alt`).not.toMatch(/\{(title|address|image)\}/);
        expect(graphemes(d.alt), `${where} alt`).toBeLessThanOrEqual(BLUESKY_MAX_ALT);
        expect(d.image).toBe(libraryPostImage(a.id, l));
        // The title in that language starts the post (it is in the dek-less part, so it always fits).
        expect(d.text.split('\n\n')[0].length, where).toBeGreaterThan(10);
      }
    });
  }
  it('has a share card for every article in every language', () => {
    const pub = join(__dirname, '../../public');
    const missing = allCombos().map(c => libraryPostImage(c.article, c.locale)).filter(p => !existsSync(join(pub, p)));
    expect(missing).toEqual([]);
  });
});

describe('choosing a post', () => {
  it('never repeats a combination until every one is used', () => {
    const used = new Set<string>();
    let seq = 0.37;
    const rand = () => (seq = (seq * 9301 + 49297) % 233280 / 233280);
    for (let i = 0; i < libraryPostTotal(); i++) {
      const c = pickCombo(used, rand);
      expect(c).not.toBeNull();
      const k = comboKey(c!.article, c!.locale);
      expect(used.has(k)).toBe(false);
      used.add(k);
    }
    expect(pickCombo(used, rand)).toBeNull();
  });
  it('a new article joins the round', () => {
    const ids = LIBRARY.slice(0, 2).map(a => a.id);
    const used = new Set(allCombos(ids.slice(0, 1)).map(c => comboKey(c.article, c.locale)));
    for (let i = 0; i < 20; i++) expect(pickCombo(used, Math.random, ids)!.article).toBe(ids[1]);
  });
});

describe('scheduling: two a day', () => {
  const H = 43_200_000;
  const morning = Date.UTC(2026, 10, 23, 3, 30), evening = Date.UTC(2026, 10, 23, 15, 30);
  it('next slot is a whole minute in the following half-day', () => {
    for (const t of [morning, evening]) for (const r of [0, 0.5, 0.9999]) {
      const s = nextSlot(t, () => r);
      expect(sameHalfDay(s, t + H), `${t} ${r}`).toBe(true);
      expect(s % 60_000).toBe(0);
    }
  });
  it('gives one slot in each half of the UTC day', () => {
    const am = nextSlot(Date.UTC(2026, 10, 22, 18), () => 0.7), pm = nextSlot(am, () => 0.2);
    expect(new Date(am).getUTCHours()).toBeLessThan(12);
    expect(new Date(pm).getUTCHours()).toBeGreaterThanOrEqual(12);
    expect(new Date(am).getUTCDate()).toBe(new Date(pm).getUTCDate());
  });
  it('first slot is later in this half-day, or the next one near its end', () => {
    for (const r of [0, 0.5, 0.9999]) {
      const s = firstSlot(morning, () => r);
      expect(s).toBeGreaterThan(morning);
      expect(sameHalfDay(s, morning)).toBe(true);
    }
    const late = Date.UTC(2026, 10, 23, 11, 58);
    expect(sameHalfDay(firstSlot(late, () => 0.5), late + H)).toBe(true);
  });
});
