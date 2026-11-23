import { describe, expect, it } from 'vitest';
import { BLUESKY_MAX_GRAPHEMES, graphemes } from './bluesky';
import { allCombos, comboKey, draftPromo, firstSlot, nextSlot, pickCombo, playUrl, PROMO_IDS, PROMO_LOCALES, PROMO_TOTAL, sameUtcDay, type PromoId, type PromoLocale } from './promo';

const enc = new TextEncoder();
const slice = (s: string, a: number, b: number) => new TextDecoder().decode(enc.encode(s).slice(a, b));

describe('Play Store posts content', () => {
  it('has 10 posts in 10 languages', () => {
    expect(PROMO_IDS.length).toBe(10);
    expect(PROMO_LOCALES.length).toBe(10);
    expect(allCombos()).toHaveLength(PROMO_TOTAL);
    expect(PROMO_TOTAL).toBe(100);
  });
  for (const l of PROMO_LOCALES) {
    it(`${l}: every post fits, links the ${l} listing and tags`, () => {
      for (const p of PROMO_IDS) {
        const d = draftPromo(p, l);
        expect(graphemes(d.text), `${p}/${l}`).toBeLessThanOrEqual(BLUESKY_MAX_GRAPHEMES);
        expect(d.url).toBe(playUrl(l));
        const link = d.facets.find(f => f.features[0].$type === 'app.bsky.richtext.facet#link');
        expect(link && slice(d.text, link.index.byteStart, link.index.byteEnd), `${p}/${l} link`).toBe(d.url);
        expect(d.facets.filter(f => f.features[0].$type === 'app.bsky.richtext.facet#tag').length, `${p}/${l} tags`).toBeGreaterThan(0);
        expect(d.alt.length, `${p}/${l} alt`).toBeGreaterThan(20);
        expect(d.image).toMatch(new RegExp(`^/promo/${l}/`));
      }
    });
  }
});

describe('choosing a post', () => {
  it('never repeats a combination until all 100 are used', () => {
    const used = new Set<string>();
    let seq = 0.37;
    const rand = () => (seq = (seq * 9301 + 49297) % 233280 / 233280);
    for (let i = 0; i < PROMO_TOTAL; i++) {
      const c = pickCombo(used, rand);
      expect(c).not.toBeNull();
      const k = comboKey(c!.post, c!.locale);
      expect(used.has(k)).toBe(false);
      used.add(k);
    }
    expect(pickCombo(used, rand)).toBeNull();
  });
});

describe('spreading posts out', () => {
  it('never repeats the previous language or post while others remain', () => {
    const used = new Set<string>(); let last: { post: PromoId; locale: PromoLocale } | null = null;
    for (let i = 0; i < PROMO_TOTAL; i++) {
      const c: { post: PromoId; locale: PromoLocale } = pickCombo(used, Math.random, last)!;
      if (last && i < PROMO_TOTAL - 20) { expect(c.locale).not.toBe(last.locale); expect(c.post).not.toBe(last.post); }
      used.add(comboKey(c.post, c.locale)); last = c;
    }
    expect(used.size).toBe(PROMO_TOTAL);
  });
});

describe('scheduling', () => {
  const t = Date.UTC(2026, 10, 18, 15, 30);
  it('next slot is a whole minute on the next UTC day', () => {
    for (const r of [0, 0.5, 0.9999]) {
      const s = nextSlot(t, () => r);
      expect(sameUtcDay(s, t + 86_400_000)).toBe(true);
      expect(s % 60_000).toBe(0);
    }
  });
  it('first slot is later today, or tomorrow near midnight', () => {
    for (const r of [0, 0.5, 0.9999]) {
      const s = firstSlot(t, () => r);
      expect(s).toBeGreaterThan(t);
      expect(sameUtcDay(s, t)).toBe(true);
    }
    const late = Date.UTC(2026, 10, 18, 23, 58);
    expect(sameUtcDay(firstSlot(late, () => 0.5), late + 86_400_000)).toBe(true);
  });
});
