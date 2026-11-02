'use client';
// Map tab. Spec: design/SismaApp.dc.html (isMap block + drawMap): Mercator rotated to the user's longitude,
// zoom 1–40, range chips + Plates toggle, magnitude legend + hint, tap a circle for the selected-quake card.
// /app/map?focus=<quake id> ("Show region") zooms to that quake and draws its felt reports as soft ~10 km areas.
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData } from '@/components/QuakeData';
import { useFeltCells } from '@/components/FeltReport';
import { regionHref } from '@/components/QuakeDetail';
import { WorldMap } from '@/components/dash/WorldMap';
import { Legend, RangeChips, Selection, ToggleChip } from '@/components/stage/StageParts';
import { MMI_COLORS, ROMAN } from '@/lib/theme';
import styles from '@/components/stage/stage.module.css';

const FOCUS_ZOOM = 24;

export default function MapPage() {
  return <Suspense><MapView /></Suspense>;
}

function MapView() {
  const { t, m, nf } = useT();
  const router = useRouter();
  const focusId = useSearchParams().get('focus');
  const { locations, active } = useApp();
  const { list, all, loaded } = useQuakeData();
  const [plates, setPlates] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const selId = picked ?? focusId;
  const sel = list.find(q => q.id === selId) ?? all.find(q => q.id === selId) ?? null;
  const focusQuake = focusId ? all.find(q => q.id === focusId) ?? null : null;
  const felt = useFeltCells(focusQuake ? focusQuake.id : null);

  const clear = () => { setPicked(null); if (focusId) router.replace('/app/map', { scroll: false }); };
  const showRegion = (id: string) => { setPicked(null); setSheet(false); router.replace(regionHref(id), { scroll: false }); };

  return (
    <div className={styles.stage}>
      <WorldMap quakes={list.some(q => q.id === focusQuake?.id) || !focusQuake ? list : [...list, focusQuake]}
        center={locations[active]} selectedId={sel?.id ?? null}
        onSelect={q => { if (q) setPicked(q.id); else clear(); setSheet(false); }}
        projection="mercator" plates={plates} toolsClassName={styles.mapTools}
        focus={focusQuake ? { key: focusQuake.id, lat: focusQuake.lat, lon: focusQuake.lon, zoom: FOCUS_ZOOM } : null}
        cells={focusQuake ? felt.cells : []} />
      <div className={styles.chips}>
        <RangeChips />
        <ToggleChip on={plates} onClick={() => setPlates(v => !v)} icon="texture" label={t('plates')} />
      </div>
      {focusQuake && !felt.loading && (
        <div className={styles.feltCard} role="status">
          <span className={styles.feltScale} aria-hidden="true">{MMI_COLORS.filter((_, i) => i % 2 === 1).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
          <span>{felt.total === 0 ? t('felt_reports_0') : felt.total === 1 ? t('felt_reports_1') : t('felt_reports_n', { n: nf.format(felt.total) })}</span>
          {felt.cells.length > 0 && <span className={styles.feltRange}>MMI {ROMAN[Math.round(Math.min(...felt.cells.map(c => c.mmi))) - 1]}–{ROMAN[Math.round(Math.max(...felt.cells.map(c => c.mmi))) - 1]}</span>}
        </div>
      )}
      {!loaded && <div className={styles.loading}>{m.dash.loading}</div>}
      {sel ? <Selection q={sel} open={sheet} setOpen={setSheet} onClear={clear} onShowRegion={() => showRegion(sel.id)} /> : (
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
