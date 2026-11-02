'use client';
// Map tab. Spec: design/SismaApp.dc.html (isMap block + drawMap): Mercator rotated to the user's longitude,
// zoom 1–14, range chips + Plates toggle, magnitude legend + hint, tap a circle for the selected-quake card.
import { useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData } from '@/components/QuakeData';
import { WorldMap } from '@/components/dash/WorldMap';
import { Legend, RangeChips, Selection, ToggleChip } from '@/components/stage/StageParts';
import styles from '@/components/stage/stage.module.css';

export default function MapPage() {
  const { t, m } = useT();
  const { locations, active } = useApp();
  const { list, loaded } = useQuakeData();
  const [plates, setPlates] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const sel = list.find(q => q.id === selId) ?? null;

  return (
    <div className={styles.stage}>
      <WorldMap quakes={list} center={locations[active]} selectedId={selId} onSelect={q => { setSelId(q?.id ?? null); setSheet(false); }}
        projection="mercator" plates={plates} toolsClassName={styles.mapTools} />
      <div className={styles.chips}>
        <RangeChips />
        <ToggleChip on={plates} onClick={() => setPlates(v => !v)} icon="texture" label={t('plates')} />
      </div>
      {!loaded && <div className={styles.loading}>{m.dash.loading}</div>}
      {sel ? <Selection q={sel} open={sheet} setOpen={setSheet} onClear={() => setSelId(null)} /> : (
        <div className={styles.bottom}>
          <Legend />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {plates && <span className={styles.credit}>Plates: PB2002, Bird (2003)</span>}
            <div className={styles.hint}>{t('map_hint')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
