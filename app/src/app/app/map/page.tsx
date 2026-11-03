'use client';
// Map tab. Spec: design/SismaApp.dc.html (isMap block + drawMap): Mercator rotated to the user's longitude,
// zoom 1–40, tap a pin for the selected-quake card. Filters, layers and the legend live in the pull-up filter panel;
// choosing a world region there zooms the map to that region.
// /app/map?focus=<quake id> ("Show region") zooms to ~7.5° across the shorter side of the view around that quake,
// marks it as the event in focus (pulsing marker, summary card below) and draws its felt reports. Tapping a nearby
// event there opens a callout on the map; tapping the callout makes that event the focus.
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData } from '@/components/QuakeData';
import { useFeltCells } from '@/components/FeltReport';
import { FeltMapInfoSheet, useFeltMap } from '@/components/FeltMap';
import { regionHref } from '@/components/QuakeDetail';
import { WorldMap } from '@/components/dash/WorldMap';
import { MagBadge } from '@/components/MagBadge';
import { timeAgo } from '@/components/QuakeRow';
import { useDistance } from '@/components/Units';
import type { Quake } from '@/lib/quakes/types';
import { FitLine } from '@/components/FitLine';
import { Legend, Selection } from '@/components/stage/StageParts';
import { FilterPanel, LayerToggle } from '@/components/stage/FilterPanel';
import { REGION_VIEW } from '@/lib/world-regions';
import { HEAT_COLORS, MMI_COLORS, ROMAN } from '@/lib/theme';
import styles from '@/components/stage/stage.module.css';
import dash from '@/components/dash/dash.module.css';

/** Region view: degrees of longitude across the shorter side of the map (~800 km at the equator). */
const REGION_SPAN = 7.5;

export default function MapPage() {
  return <Suspense><MapView /></Suspense>;
}

function MapView() {
  const { t, m, nf } = useT();
  const router = useRouter();
  const focusId = useSearchParams().get('focus');
  const { locations, active } = useApp();
  const { mapList: list, all, loaded, worldReg } = useQuakeData();
  const [plates, setPlates] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const focusQuake = focusId ? all.find(q => q.id === focusId) ?? null : null;
  // A chosen world region frames the map on it (the event in focus of "Show region" comes first).
  const regionView = worldReg ? REGION_VIEW[worldReg] : null;
  // In the region view the card below always shows the event in focus; other events open a callout instead.
  const selId = focusQuake ? focusQuake.id : picked;
  const sel = list.find(q => q.id === selId) ?? all.find(q => q.id === selId) ?? null;
  const [callout, setCallout] = useState<string | null>(null);
  const calloutQuake = focusQuake && callout ? list.find(q => q.id === callout) ?? null : null;
  const felt = useFeltCells(focusQuake ? focusQuake.id : null);
  const auto = useFeltMap(focusQuake ? focusQuake.id : null);
  const [howOpen, setHowOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // Map area covered by the region card (top) and the event card or filter panel (bottom), measured when a callout opens.
  const safeArea = () => {
    const st = stageRef.current?.getBoundingClientRect();
    if (!st) return { top: 0, bottom: 0 };
    const tops = [...stageRef.current!.querySelectorAll(`.${styles.feltCard}`)].map(e => e.getBoundingClientRect().bottom - st.top);
    const card = stageRef.current!.querySelector('aside, [data-filter-panel]')?.getBoundingClientRect();
    return { top: Math.max(0, ...tops), bottom: card ? Math.max(0, st.bottom - card.top) : 0 };
  };

  const clear = () => { setPicked(null); setCallout(null); if (focusId) router.replace('/app/map', { scroll: false }); };
  const exitRegion = () => { setPicked(null); setCallout(null); setSheet(false); router.replace('/app/map', { scroll: false }); };
  // Escape leaves the region view (unless a sheet is open: Escape closes that first).
  useEffect(() => {
    if (!focusId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[role=dialog]')) return;
      if (document.querySelector('[data-callout]')) { setCallout(null); return; }
      router.replace('/app/map', { scroll: false });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [focusId, router]);
  const showRegion = (id: string) => { setPicked(null); setCallout(null); setSheet(false); router.replace(regionHref(id), { scroll: false }); };
  const onSelect = (q: Quake | null) => {
    setSheet(false);
    if (focusQuake) { setCallout(q && q.id !== focusQuake.id ? q.id : null); return; }
    if (q) setPicked(q.id); else clear();
  };

  return (
    <div className={styles.stage} ref={stageRef}>
      <WorldMap quakes={list.some(q => q.id === focusQuake?.id) || !focusQuake ? list : [...list, focusQuake]}
        center={locations[active]} selectedId={sel?.id ?? null}
        onSelect={onSelect} safeArea={safeArea} focusedId={focusQuake?.id ?? null}
        popup={calloutQuake ? { id: calloutQuake.id, content: <NearbyCallout q={calloutQuake} onOpen={() => showRegion(calloutQuake.id)} /> } : null}
        projection="mercator" plates={plates} toolsClassName={styles.mapTools}
        focus={focusQuake ? { key: focusQuake.id, lat: focusQuake.lat, lon: focusQuake.lon, span: REGION_SPAN, y: 0.42 }
          : regionView ? { key: `wr:${worldReg}`, ...regionView, y: 0.42 } : null}
        cells={focusQuake ? felt.cells : []} heat={focusQuake && auto.map ? auto.map.cells : []} onReset={focusId ? exitRegion : undefined} />
      {focusId && (
        <div className={styles.feltCard} role="status">
          <button type="button" className={styles.exitBtn} onClick={exitRegion}>
            <span className="ms" aria-hidden="true">arrow_back</span>{t('exit_region')}
          </button>
          {/* Each line (with its colour scale) only appears once there is something to show. */}
          {focusQuake && !felt.loading && felt.total > 0 && (
            <span className={styles.feltLine}>
              <span className={styles.feltScale} aria-hidden="true">{MMI_COLORS.filter((_, i) => i % 2 === 1).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
              <FitLine min={9}>
                {felt.total === 1 ? t('felt_reports_1') : t('felt_reports_n', { n: nf.format(felt.total) })}
                {felt.cells.length > 0 && ` · MMI ${ROMAN[Math.round(Math.min(...felt.cells.map(c => c.mmi))) - 1]}–${ROMAN[Math.round(Math.max(...felt.cells.map(c => c.mmi))) - 1]}`}
              </FitLine>
            </span>
          )}
          {focusQuake && !auto.loading && auto.map && auto.map.cells.length > 0 && (
            <span className={styles.feltLine}>
              <span className={styles.feltScale} aria-hidden="true">{HEAT_COLORS.map(c => <i key={c} style={{ background: c }} />)}</span>
              <FitLine min={9}>
                {auto.map.cells.length === 1 ? m.feltmap.line_areas_1 : m.feltmap.line_areas.replace('{n}', nf.format(auto.map.cells.length))}
              </FitLine>
              <button type="button" className={styles.infoBtn} onClick={() => setHowOpen(true)} aria-label={m.feltmap.title}>
                <span className="ms" aria-hidden="true">info</span>
              </button>
            </span>
          )}
        </div>
      )}
      <FeltMapInfoSheet open={howOpen} onClose={() => setHowOpen(false)} />
      {!loaded && <div className={styles.loading}>{m.dash.loading}</div>}
      {sel ? <Selection q={sel} open={sheet} setOpen={setSheet} onClear={clear} onShowRegion={() => showRegion(sel.id)} /> : (
        <FilterPanel legend={<Legend plain />}
          layers={<LayerToggle on={plates} onChange={setPlates} icon="texture" label={t('plates')} />}
          hint={<>{t('map_hint')}{plates && <><br />Plates: PB2002, Bird (2003)</>}</>} />
      )}
    </div>
  );
}

/** Callout for a nearby event in the region view; tapping it makes that event the focus. */
function NearbyCallout({ q, onOpen }: { q: Quake; onOpen: () => void }) {
  const { t, locale, m } = useT();
  const u = useDistance();
  const when = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(q.time);
  return (
    <button type="button" className={dash.calloutBtn} onClick={e => { e.stopPropagation(); onOpen(); }} aria-label={`${m.map.focus_event}: M${q.mag.toFixed(1)} ${q.region}`}>
      <MagBadge mag={q.mag} size={40} />
      <span className={dash.calloutText}>
        <strong>{q.region}</strong>
        <span>{when} · {timeAgo(t as never, q.time)}</span>
        <span>{t('depth_deep', { d: u.depth(q.depthKm) })}</span>
      </span>
      <span className={`ms ${dash.calloutGo}`} aria-hidden="true">chevron_right</span>
    </button>
  );
}
