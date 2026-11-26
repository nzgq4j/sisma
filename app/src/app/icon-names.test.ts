import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ICON_NAMES, iconFontHref } from './icon-names';

// The icon font (app/layout.tsx) is requested with only the icons the app uses (icon_names=), which keeps it to tens
// of KiB instead of ~3 MB. Any Material Symbols name that appears as a string, JSX text, JSON "icon" value or CSS
// `content:` in src/ counts as used; a few ordinary words that happen to be icon names are included too, which only
// costs a glyph each. After adding an icon, update the list with:  UPDATE_ICONS=1 npx vitest run icon-names
const ROOT = join(__dirname, '..');
const CODEPOINTS = join(__dirname, '../../scripts/data/material-symbols-rounded.codepoints');

function usedIcons() {
  const known = new Set(readFileSync(CODEPOINTS, 'utf8').split('\n').map(l => l.split(' ')[0]).filter(Boolean));
  const used = new Set<string>();
  const add = (n: string) => { if (known.has(n)) used.add(n); };
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (/\.test\.|icon-names\.ts$/.test(f)) continue;
      const s = readFileSync(p, 'utf8');
      if (/\.(tsx?|mjs)$/.test(f)) {
        for (const m of s.matchAll(/["'`]([a-z][a-z0-9_]*)["'`]/g)) add(m[1]);
        for (const m of s.matchAll(/>\s*([a-z][a-z0-9_]*)\s*</g)) add(m[1]);
      } else if (f.endsWith('.json')) {
        for (const m of s.matchAll(/"icon"\s*:\s*"([a-z0-9_]+)"/g)) add(m[1]);
      } else if (f.endsWith('.css')) {
        for (const m of s.matchAll(/content:\s*['"]([a-z0-9_]+)['"]/g)) add(m[1]);
      }
    }
  };
  walk(ROOT);
  return [...used].sort();
}

describe('icon font subset', () => {
  it('requests every icon the app uses', () => {
    const used = usedIcons();
    if (process.env.UPDATE_ICONS) {
      const body = used.map(n => `'${n}'`).join(', ').replace(/(.{1,116})(, |$)/g, '  $1,\n').replace(/,,\n$/, ',\n');
      const file = join(__dirname, 'icon-names.ts');
      const src = readFileSync(file, 'utf8').replace(/export const ICON_NAMES[^=]*= \[[^\]]*\];/, `export const ICON_NAMES: readonly string[] = [\n${body}];`);
      writeFileSync(file, src);
      return;
    }
    expect(ICON_NAMES, 'run UPDATE_ICONS=1 npx vitest run icon-names').toEqual(used);
  });
  it('builds a sorted icon_names request', () => {
    const href = iconFontHref();
    const names = new URL(href).searchParams.get('icon_names')!.split(',');
    expect(names).toEqual([...names].sort());
    expect(names.length).toBe(ICON_NAMES.length);
  });
});
