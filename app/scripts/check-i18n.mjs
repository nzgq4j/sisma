import fs from 'node:fs';
const dir = new URL('../src/i18n/messages/', import.meta.url);
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? flat(v, p + k + '.') : [p + k]);
const en = new Set(flat(JSON.parse(fs.readFileSync(new URL('en.json', dir)))));
let bad = 0;
for (const f of fs.readdirSync(dir)) {
  const keys = new Set(flat(JSON.parse(fs.readFileSync(new URL(f, dir)))));
  const missing = [...en].filter(k => !keys.has(k));
  if (missing.length) { bad++; console.error(f + ' missing: ' + missing.join(', ')); }
}

// Science articles: every language has content/science/<locale>.json with each article's intro, the same number of
// sections and, for the preparedness kit, the same number of items as the English (content/science.json).
const sciDir = new URL('../src/content/', import.meta.url);
const source = JSON.parse(fs.readFileSync(new URL('science.json', sciDir)));
for (const f of fs.readdirSync(dir).filter(f => f !== 'en.json')) {
  const file = new URL('science/' + f, sciDir);
  if (!fs.existsSync(file)) { bad++; console.error('content/science/' + f + ' missing'); continue; }
  const tr = JSON.parse(fs.readFileSync(file));
  const problems = source.flatMap(a => {
    const t = tr[a.id];
    if (!t?.intro) return [a.id + ': not translated'];
    return [
      ...((t.sections?.length ?? 0) !== a.sections.length ? [`${a.id}: ${t.sections?.length ?? 0} sections, English has ${a.sections.length}`] : []),
      ...(t.sections ?? []).flatMap((s, i) => (s.h && s.p ? [] : [`${a.id}: section ${i + 1} empty`])),
      ...((t.kit?.length ?? 0) !== (a.kit?.length ?? 0) ? [`${a.id}: ${t.kit?.length ?? 0} kit items, English has ${a.kit?.length ?? 0}`] : []),
    ];
  });
  if (problems.length) { bad++; console.error('content/science/' + f + ': ' + problems.join('; ')); }
}
process.exit(bad ? 1 : 0);
