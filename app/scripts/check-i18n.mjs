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
process.exit(bad ? 1 : 0);
