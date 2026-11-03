'use client';
// Globe tab. Spec: design/SismaApp.dc.html (isGlobe block + initGlobe): Depth / Plates / Spin chips, +/− zoom,
// magnitude or depth legend, tap a quake for the selected-quake card.
import { useRef, useState, useSyncExternalStore } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData } from '@/components/QuakeData';
import { Globe, type GlobeHandle } from '@/components/Globe';
import { Legend, RangeChips, Selection, ToggleChip, MagFilterChip, RegionFilterChip } from '@/components/stage/StageParts';
import styles from '@/components/stage/stage.module.css';

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const q = matchMedia(RM); q.addEventListener('change', cb); return () => q.removeEventListener('change', cb); };

export default function GlobePage() {
  const { t, m } = useT();
  const { locations, active } = useApp();
  const { mapList: list, loaded } = useQuakeData();
  const reducedMotion = useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
  const globe = useRef<GlobeHandle>(null);
  const [depth, setDepth] = useState(false);
  const [plates, setPlates] = useState(false);
  const [spinPref, setSpin] = useState<boolean | null>(null);
  const spin = spinPref ?? !reducedMotion; // spins by default unless the user prefers reduced motion
  const [selId, setSelId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const sel = list.find(q => q.id === selId) ?? null;

  return (
    <div className={`${styles.stage} ${styles.globeStage}`}>
      <Globe ref={globe} quakes={list} center={locations[active]} selectedId={selId} onSelect={q => { setSelId(q?.id ?? null); setSheet(false); }}
        depthMode={depth} plates={plates} spin={spin} label={t('count', { n: list.length })} />
      <div className={styles.chips}>
        <ToggleChip on={depth} onClick={() => setDepth(v => !v)} icon="layers" label={t('depth_view')} />
        <ToggleChip on={plates} onClick={() => setPlates(v => !v)} icon="texture" label={t('plates')} />
        <ToggleChip on={spin} onClick={() => setSpin(!spin)} icon="3d_rotation" label={t('spin')} />
        <RangeChips />
        <MagFilterChip />
        <RegionFilterChip />
      </div>
      <div className={styles.zoomPill}>
        <button type="button" onClick={() => globe.current?.zoomBy(1.6)} aria-label={m.dash.zoom_in} title={m.dash.zoom_in}><span className="ms">add</span></button>
        <hr />
        <button type="button" onClick={() => globe.current?.zoomBy(1 / 1.6)} aria-label={m.dash.zoom_out} title={m.dash.zoom_out}><span className="ms">remove</span></button>
      </div>
      {!loaded && <div className={styles.loading}>{m.dash.loading}</div>}
      {sel ? <Selection q={sel} open={sheet} setOpen={setSheet} onClear={() => setSelId(null)} /> : (
        <div className={styles.bottom}>
          <Legend depth={depth} />
          {plates && <span className={styles.credit}>Plates: PB2002, Bird (2003)</span>}
        </div>
      )}
    </div>
  );
}
