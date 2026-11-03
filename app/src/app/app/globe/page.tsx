'use client';
// Globe tab. Spec: design/SismaApp.dc.html (isGlobe block + initGlobe): +/− zoom, tap a quake for the selected-quake
// card. Filters, the Depth / Plates / Spin layers and the legend live in the pull-up filter panel; choosing a world
// region there turns the globe to face it (and stops the spin unless the user turned it on).
import { useRef, useState, useSyncExternalStore } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData } from '@/components/QuakeData';
import { Globe, type GlobeHandle } from '@/components/Globe';
import { Legend, Selection } from '@/components/stage/StageParts';
import { FilterPanel, LayerToggle } from '@/components/stage/FilterPanel';
import { REGION_VIEW } from '@/lib/world-regions';
import styles from '@/components/stage/stage.module.css';

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const q = matchMedia(RM); q.addEventListener('change', cb); return () => q.removeEventListener('change', cb); };

export default function GlobePage() {
  const { t, m } = useT();
  const { locations, active } = useApp();
  const { mapList: list, loaded, worldReg } = useQuakeData();
  const reducedMotion = useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
  const globe = useRef<GlobeHandle>(null);
  const [depth, setDepth] = useState(false);
  const [plates, setPlates] = useState(false);
  const [spinPref, setSpin] = useState<boolean | null>(null);
  const regionView = worldReg ? REGION_VIEW[worldReg] ?? (worldReg === 'polar' ? { lat: -75, lon: 0 } : null) : null;
  // Spins by default unless the user prefers reduced motion or a region is chosen (the spin would turn it away).
  const spin = spinPref ?? (!reducedMotion && !regionView);
  const [selId, setSelId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const sel = list.find(q => q.id === selId) ?? null;

  return (
    <div className={`${styles.stage} ${styles.globeStage}`}>
      <Globe ref={globe} quakes={list} center={locations[active]} selectedId={selId} onSelect={q => { setSelId(q?.id ?? null); setSheet(false); }}
        depthMode={depth} plates={plates} spin={spin} label={t('count', { n: list.length })}
        focus={regionView ? { key: `wr:${worldReg}`, lat: regionView.lat, lon: regionView.lon } : null} />
      <div className={styles.zoomPill}>
        <button type="button" onClick={() => globe.current?.zoomBy(1.6)} aria-label={m.dash.zoom_in} title={m.dash.zoom_in}><span className="ms">add</span></button>
        <hr />
        <button type="button" onClick={() => globe.current?.zoomBy(1 / 1.6)} aria-label={m.dash.zoom_out} title={m.dash.zoom_out}><span className="ms">remove</span></button>
      </div>
      {!loaded && <div className={styles.loading}>{m.dash.loading}</div>}
      {sel ? <Selection q={sel} open={sheet} setOpen={setSheet} onClear={() => setSelId(null)} /> : (
        <FilterPanel legend={<Legend depth={depth} plain />}
          layers={<>
            <LayerToggle on={depth} onChange={setDepth} icon="layers" label={t('depth_view')} />
            <LayerToggle on={plates} onChange={setPlates} icon="texture" label={t('plates')} />
            <LayerToggle on={spin} onChange={setSpin} icon="3d_rotation" label={t('spin')} />
          </>}
          hint={<>{t('map_hint')}{plates && <><br />Plates: PB2002, Bird (2003)</>}</>} />
      )}
    </div>
  );
}
