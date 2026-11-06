// Text for sharing an earthquake: the post that goes with the share card, and fitting the card's headline on one line.
// Pure functions (no DOM), used by the share sheet (components/ShareCard.tsx), the event detail and the server-drawn
// card (lib/share-card.tsx).

/**
 * Fills a translated post template such as "M{mag} earthquake · {place}\n{when} · {depth} deep". Each line is split
 * into fragments on " · "; a fragment whose placeholders are all empty is left out, as are lines with nothing left, so
 * the post never shows "undefined", a dangling " · " or an empty line.
 */
export function fillPost(template: string, values: Record<string, string | number | null | undefined>): string {
  const val = (k: string) => { const v = values[k]; return v === null || v === undefined ? '' : String(v).trim(); };
  return template.split('\n').map(line => line.split(' · ').map(frag => {
    const keys = [...frag.matchAll(/\{(\w+)\}/g)].map(x => x[1]);
    if (keys.length && keys.every(k => !val(k))) return '';
    return frag.replace(/\{(\w+)\}/g, (_, k: string) => val(k)).trim();
  }).filter(Boolean).join(' · ')).filter(Boolean).join('\n');
}

/** The full post: the description, then the hashtag, then the link last (on its own line). Empty parts are left out. */
export const postWithLink = (text: string, url: string, tag?: string) =>
  [text.trim(), tag?.trim(), url.trim()].filter(Boolean).join('\n');

/** Rough width of `text` in em for a bold Latin sans (Figtree 800), wide enough to be safe; CJK counts 1 em. */
export function emWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    if (/[⺀-鿿가-힯豈-﫿＀-￯]/.test(ch)) w += 1;
    else if (/\s/.test(ch)) w += 0.26;
    else if (/[.,:;'’!|ilIj()-]/.test(ch)) w += 0.32;
    else if (/[MWmw]/.test(ch)) w += 0.84;
    else if (/[A-Z0-9]/.test(ch)) w += 0.66;
    else w += 0.56;
  }
  return w;
}

/**
 * Fits one line of text into `maxWidth` px: steps the font size down from `size` by 2 px until it fits, no lower than
 * `min`; if it still doesn't fit at `min`, cuts it at a word (or character) and adds "…".
 */
export function fitLine(text: string, { maxWidth, size, min }: { maxWidth: number; size: number; min: number }): { text: string; size: number } {
  const t = text.trim();
  for (let s = size; s >= min; s -= 2) if (emWidth(t) * s <= maxWidth) return { text: t, size: s };
  const room = maxWidth / min - emWidth('…');
  let cut = '';
  for (const ch of t) { if (emWidth(cut + ch) > room) break; cut += ch; }
  const word = cut.replace(/\s+\S*$/, '');
  return { text: `${(word.length >= cut.length * 0.6 ? word : cut).replace(/[\s,·-]+$/, '')}…`, size: min };
}
