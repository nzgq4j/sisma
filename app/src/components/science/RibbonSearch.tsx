'use client';
// Science → Pacific Fire Ribbon, search (step 6): volcanoes by name (any of the catalogue's 681 on the route) and the
// loaded earthquakes by place, USGS id or magnitude ("6.1", "M6", "M6+": that magnitude and above). Picking a result
// selects it on the ribbon and the map and moves both to it.
import { useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { Sheet } from '@/components/Sheet';
import { depthColour, type RibbonQuake } from '@/lib/ribbon/shared';
import type { RibbonVolcano } from '@/lib/ribbon/volcanoes';
import styles from './ribbon.module.css';

/** Lower case without accents, for matching ("Popocatépetl" ~ "popocatepetl"). */
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** What a query finds: volcanoes by name, earthquakes by magnitude (a number) or by place / id. Largest first. */
export function searchRibbon(query: string, quakes: RibbonQuake[], volcanoes: RibbonVolcano[]) {
  const q = fold(query.trim());
  if (!q) return { volcanoes: [] as RibbonVolcano[], quakes: [] as RibbonQuake[] };
  const mag = /^m?\s*(\d+(?:[.,]\d+)?)\s*\+?$/.exec(q);
  const vs = mag ? [] : volcanoes.filter(v => fold(v.name).includes(q)).sort((a, b) => Number(!fold(a.name).startsWith(q)) - Number(!fold(b.name).startsWith(q)) || a.name.localeCompare(b.name)).slice(0, 8);
  const min = mag ? Number(mag[1].replace(',', '.')) : null;
  const qs = quakes.filter(e => (min !== null ? (e.mag ?? -Infinity) >= min : fold(e.place ?? '').includes(q) || fold(e.id) === q))
    .sort((a, b) => (b.mag ?? -Infinity) - (a.mag ?? -Infinity) || b.time - a.time).slice(0, 12);
  return { volcanoes: vs, quakes: qs };
}

export function RibbonSearch({ open, onClose, quakes, volcanoes, onPickQuake, onPickVolcano, when }: {
  open: boolean; onClose: () => void; quakes: RibbonQuake[]; volcanoes: RibbonVolcano[];
  onPickQuake: (q: RibbonQuake) => void; onPickVolcano: (v: RibbonVolcano) => void; when: Intl.DateTimeFormat;
}) {
  const { m, locale } = useT();
  const k = m.ribbon;
  const [text, setText] = useState('');
  const found = useMemo(() => searchRibbon(text, quakes, volcanoes), [text, quakes, volcanoes]);
  const mag1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const none = text.trim() !== '' && found.volcanoes.length === 0 && found.quakes.length === 0;
  return (
    <Sheet open={open} onClose={onClose} title={k.search}>
      <input className={styles.searchInput} type="search" value={text} onChange={e => setText(e.target.value)} placeholder={k.search_ph}
        aria-label={k.search} autoFocus enterKeyHint="search" />
      <p className={styles.hint3d}>{k.search_hint}</p>
      {none && <p className={styles.hint3d} role="status">{k.search_none}</p>}
      {found.volcanoes.length > 0 && (
        <div className={styles.largest}>
          <h2>{k.layer_volcanoes}</h2>
          <ul>
            {found.volcanoes.map(v => (
              <li key={v.n}>
                <button type="button" onClick={() => { onPickVolcano(v); onClose(); }}>
                  <span className={styles.searchTri} aria-hidden="true">▲</span>
                  <b>{v.name}</b>
                  <span>{v.country ?? ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {found.quakes.length > 0 && (
        <div className={styles.largest}>
          <h2>{k.layer_quakes}</h2>
          <ul>
            {found.quakes.map(e => (
              <li key={e.id}>
                <button type="button" onClick={() => { onPickQuake(e); onClose(); }}>
                  <i style={{ background: depthColour(e.depth) }} aria-hidden="true" />
                  <b>M{e.mag !== null ? mag1.format(e.mag) : '–'}</b>
                  <span>{e.place ?? e.id} · {when.format(e.time)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
